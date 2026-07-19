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

/** Internal join key back to Postgres' `billing_accounts.id` — not part of the FOCUS spec, so kept out of FOCUS_COLUMNS (that table maps CSV headers only). Distinct from FOCUS's own `billingAccountId` column, which is the *cloud provider's* account id. */
const SOURCE_BILLING_ACCOUNT_ID_COLUMN = 'sourceBillingAccountId';

export interface CostByMonth {
  period: string;
  totalCost: number;
}

export interface CostByCategoryAndProvider {
  serviceCategory: string | null;
  provider: string;
  totalCost: number;
}

export interface CostByDay {
  day: string;
  totalCost: number;
}

export interface UpsertFromCsvParams {
  /** The owning billing_accounts.id — used both for the S3 secret name and stamped onto every row as sourceBillingAccountId. */
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
  /** Memoized so CREATE/ALTER only run once per process, not on every call — see ensureSchema(). */
  private schemaReady: Promise<void> | null = null;

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

    await this.ensureSchema();

    // ORDER BY here (not just GROUP BY at query time) so rows land sorted by
    // charge date within each written file — enables row-group pruning on
    // top of the file-level partition pruning below (see the
    // ducklake-experiment spike: sorted writes cut a 3-day filter from
    // ~2.2s to ~0.51s). Unverified specifically for MERGE INTO's physical
    // write path (the spike only proved it for a plain INSERT) — worth an
    // EXPLAIN ANALYZE check against real data.
    const mergeSql = `
      MERGE INTO ${TABLE_NAME} AS target
      USING (
        SELECT
          *,
          ${buildLineItemKeyExpr()} AS ${quoteIdent('lineItemKey')},
          now() AS ${quoteIdent('insertedAt')},
          ${sqlLiteral(params.billingAccountId)} AS ${quoteIdent(SOURCE_BILLING_ACCOUNT_ID_COLUMN)}
        FROM (
          SELECT
            ${buildFocusColumnSelectSql(availableHeaders)}
          FROM ${readCsvExpr}
        ) AS mapped
        ORDER BY ${quoteIdent('chargePeriodStart')}
      ) AS source
      ON (target.${quoteIdent('lineItemKey')} = source.${quoteIdent('lineItemKey')})
      WHEN MATCHED THEN UPDATE SET ${this.updateSetClause()}
      WHEN NOT MATCHED THEN INSERT (${this.allColumns().map(quoteIdent).join(', ')})
        VALUES (${this.allColumns().map((c) => `source.${quoteIdent(c)}`).join(', ')});
    `;

    const result = await connection.run(mergeSql);
    return { rowsAffected: result.rowsChanged };
  }

  /**
   * Total billed cost per calendar month (issue #58), scoped to the given
   * billing_accounts ids (a customer's own accounts — resolved in Postgres
   * by the caller, since DuckLake and Postgres are separate connections and
   * can't be joined in one query).
   */
  async getCostByMonth(billingAccountIds: string[]): Promise<CostByMonth[]> {
    if (billingAccountIds.length === 0) {
      return [];
    }
    await this.ensureSchema();
    const connection = await this.connectionService.getConnection();
    const reader = await connection.runAndReadAll(`
      SELECT
        strftime(date_trunc('month', ${quoteIdent('chargePeriodStart')}), '%Y-%m') AS period,
        CAST(SUM(${quoteIdent('billedCost')}) AS DOUBLE) AS "totalCost"
      FROM ${TABLE_NAME}
      WHERE ${quoteIdent(SOURCE_BILLING_ACCOUNT_ID_COLUMN)} IN (${this.idList(billingAccountIds)})
      GROUP BY period
      ORDER BY period;
    `);
    return reader.getRowObjects() as unknown as CostByMonth[];
  }

  /**
   * Total billed cost broken down by FOCUS service category and provider
   * (issue #58), scoped the same way as getCostByMonth. Grouped by
   * `serviceCategory` first — FOCUS's standardized taxonomy (e.g.
   * "Compute", "Storage") — rather than the provider-specific `serviceName`
   * ("Amazon Elastic Compute Cloud" vs. "Virtual Machines"), so spend is
   * comparable across providers.
   */
  async getCostByCategoryAndProvider(billingAccountIds: string[]): Promise<CostByCategoryAndProvider[]> {
    if (billingAccountIds.length === 0) {
      return [];
    }
    await this.ensureSchema();
    const connection = await this.connectionService.getConnection();
    const reader = await connection.runAndReadAll(`
      SELECT
        ${quoteIdent('serviceCategory')} AS "serviceCategory",
        ${quoteIdent('provider')} AS provider,
        CAST(SUM(${quoteIdent('billedCost')}) AS DOUBLE) AS "totalCost"
      FROM ${TABLE_NAME}
      WHERE ${quoteIdent(SOURCE_BILLING_ACCOUNT_ID_COLUMN)} IN (${this.idList(billingAccountIds)})
      GROUP BY "serviceCategory", provider
      ORDER BY "serviceCategory", "totalCost" DESC;
    `);
    return reader.getRowObjects() as unknown as CostByCategoryAndProvider[];
  }

  /**
   * Total billed cost per day within a single calendar month (issue #58
   * follow-up), scoped the same way as getCostByMonth. `month` must already
   * be a validated "YYYY-MM" string (see ReportingService) — it's embedded
   * directly in SQL here, not passed as a bind parameter.
   */
  async getCostByDay(billingAccountIds: string[], month: string): Promise<CostByDay[]> {
    if (billingAccountIds.length === 0) {
      return [];
    }
    await this.ensureSchema();
    const connection = await this.connectionService.getConnection();
    const reader = await connection.runAndReadAll(`
      SELECT
        strftime(date_trunc('day', ${quoteIdent('chargePeriodStart')}), '%Y-%m-%d') AS day,
        CAST(SUM(${quoteIdent('billedCost')}) AS DOUBLE) AS "totalCost"
      FROM ${TABLE_NAME}
      WHERE ${quoteIdent(SOURCE_BILLING_ACCOUNT_ID_COLUMN)} IN (${this.idList(billingAccountIds)})
        AND date_trunc('month', ${quoteIdent('chargePeriodStart')}) = strptime(${sqlLiteral(`${month}-01`)}, '%Y-%m-%d')
      GROUP BY day
      ORDER BY day;
    `);
    return reader.getRowObjects() as unknown as CostByDay[];
  }

  private idList(ids: string[]): string {
    return ids.map(sqlLiteral).join(', ');
  }

  /** Runs CREATE/ALTER exactly once per process — repeating ALTER TABLE SET PARTITIONED BY on every call would churn out a new (identical) partition spec version each time. */
  private ensureSchema(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = this.initSchema();
    }
    return this.schemaReady;
  }

  private async initSchema(): Promise<void> {
    const connection = await this.connectionService.getConnection();
    await connection.run(this.createTableSql());
    await connection.run(
      `ALTER TABLE ${TABLE_NAME} ADD COLUMN IF NOT EXISTS ${quoteIdent(SOURCE_BILLING_ACCOUNT_ID_COLUMN)} VARCHAR;`,
    );
    // Partition by owning billing account (one S3 folder per customer's
    // account, issue #58 follow-up) then by month (the ducklake-experiment
    // spike measured ~17.7x file-pruning speedup from month partitioning
    // alone). Only affects rows written after this runs — DuckLake keeps
    // pre-existing data under its prior (or no) partitioning.
    await connection.run(
      `ALTER TABLE ${TABLE_NAME} SET PARTITIONED BY (${quoteIdent(SOURCE_BILLING_ACCOUNT_ID_COLUMN)}, month(${quoteIdent('chargePeriodStart')}));`,
    );
  }

  private allColumns(): string[] {
    return [
      ...FOCUS_COLUMNS.map((def) => def.column),
      'lineItemKey',
      'insertedAt',
      SOURCE_BILLING_ACCOUNT_ID_COLUMN,
    ];
  }

  private createTableSql(): string {
    const columnDefs = FOCUS_COLUMNS.map((def) => `${quoteIdent(def.column)} ${def.type}`);
    columnDefs.push(`${quoteIdent('lineItemKey')} VARCHAR`);
    columnDefs.push(`${quoteIdent('insertedAt')} TIMESTAMP`);
    columnDefs.push(`${quoteIdent(SOURCE_BILLING_ACCOUNT_ID_COLUMN)} VARCHAR`);
    return `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (${columnDefs.join(', ')});`;
  }

  private updateSetClause(): string {
    const assignments = FOCUS_COLUMNS.map(
      (def) => `${quoteIdent(def.column)} = source.${quoteIdent(def.column)}`,
    );
    assignments.push(`${quoteIdent('insertedAt')} = source.${quoteIdent('insertedAt')}`);
    assignments.push(
      `${quoteIdent(SOURCE_BILLING_ACCOUNT_ID_COLUMN)} = source.${quoteIdent(SOURCE_BILLING_ACCOUNT_ID_COLUMN)}`,
    );
    return assignments.join(', ');
  }
}
