import { Injectable } from '@nestjs/common';
import { DuckLakeConnectionService } from './ducklake-connection.service';
import {
  FOCUS_COLUMNS,
  buildFocusColumnSelectSql,
  buildLineItemKeyExpr,
  quoteIdent,
  sqlLiteral,
} from './focus-column-mapping';

const TABLE_NAME = 'billing_line_items';

export interface UpsertFromCsvParams {
  /** Used to derive a per-account, collision-free source S3 secret name. */
  billingAccountId: string;
  sourceBucket: string;
  sourceKey: string;
  sourceRegion: string;
  sourceAccessKeyId: string;
  sourceSecretAccessKey: string;
}

/**
 * Isolation boundary for DuckLake-specific SQL (issue #49) — keeps it out of
 * BillingService the way S3Adapter kept AWS SDK calls out of it.
 */
@Injectable()
export class DuckLakeBillingRepository {
  constructor(private readonly connectionService: DuckLakeConnectionService) {}

  async listCatalogTables(): Promise<string[]> {
    const connection = await this.connectionService.getConnection();
    const reader = await connection.runAndReadAll('SHOW ALL TABLES;');
    return reader.getRowObjects().map((row) => String(row.name));
  }

  /**
   * Pushes a FOCUS CSV straight from S3 into the DuckLake catalog via one
   * `MERGE INTO` — no row ever touches the JS heap (ADR-0005's ELT
   * push-down). The only JS-side work is a cheap header-discovery query, so
   * FOCUS 1.0/1.2 column-name fallbacks can be resolved before the real SQL
   * runs (referencing a CSV column that doesn't exist throws a DuckDB
   * binder error, unlike the old row-by-row `val()` helper's tolerant
   * lookup).
   */
  async upsertFromCsv(params: UpsertFromCsvParams): Promise<{ rowsAffected: number }> {
    const connection = await this.connectionService.getConnection();
    const s3Path = `s3://${params.sourceBucket}/${params.sourceKey}`;
    const readCsvExpr = `read_csv(${sqlLiteral(s3Path)}, header=true, all_varchar=true)`;

    // A stable, per-account secret name — the connection is a shared
    // singleton (see DuckLakeConnectionService), so a fixed name would let
    // one account's credentials clobber another's mid-flight.
    const secretName = `source_s3_${params.billingAccountId.replace(/-/g, '_')}`;
    await connection.run(`
      CREATE OR REPLACE SECRET ${secretName} (
        TYPE s3,
        KEY_ID ${sqlLiteral(params.sourceAccessKeyId)},
        SECRET ${sqlLiteral(params.sourceSecretAccessKey)},
        REGION ${sqlLiteral(params.sourceRegion)},
        SCOPE ${sqlLiteral(`s3://${params.sourceBucket}`)}
      );
    `);

    const describeReader = await connection.runAndReadAll(
      `DESCRIBE SELECT * FROM ${readCsvExpr};`,
    );
    const availableHeaders = new Set(
      describeReader.getRowObjects().map((row) => String(row.column_name)),
    );

    await connection.run(this.createTableSql());

    const mergeSql = `
      MERGE INTO ${TABLE_NAME} AS target
      USING (
        SELECT *, ${buildLineItemKeyExpr()} AS ${quoteIdent('lineItemKey')}, now() AS ${quoteIdent('insertedAt')}
        FROM (
          SELECT
            ${buildFocusColumnSelectSql(availableHeaders)}
          FROM ${readCsvExpr}
        ) AS mapped
      ) AS source
      ON (target.${quoteIdent('lineItemKey')} = source.${quoteIdent('lineItemKey')})
      WHEN MATCHED THEN UPDATE SET ${this.updateSetClause()}
      WHEN NOT MATCHED THEN INSERT (${this.allColumns().map(quoteIdent).join(', ')})
        VALUES (${this.allColumns().map((c) => `source.${quoteIdent(c)}`).join(', ')});
    `;

    const result = await connection.run(mergeSql);
    return { rowsAffected: result.rowsChanged };
  }

  private allColumns(): string[] {
    return [...FOCUS_COLUMNS.map((def) => def.column), 'lineItemKey', 'insertedAt'];
  }

  private createTableSql(): string {
    const columnDefs = FOCUS_COLUMNS.map((def) => `${quoteIdent(def.column)} ${def.type}`);
    columnDefs.push(`${quoteIdent('lineItemKey')} VARCHAR`);
    columnDefs.push(`${quoteIdent('insertedAt')} TIMESTAMP`);
    return `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (${columnDefs.join(', ')});`;
  }

  private updateSetClause(): string {
    const assignments = FOCUS_COLUMNS.map(
      (def) => `${quoteIdent(def.column)} = source.${quoteIdent(def.column)}`,
    );
    assignments.push(`${quoteIdent('insertedAt')} = source.${quoteIdent('insertedAt')}`);
    return assignments.join(', ');
  }
}
