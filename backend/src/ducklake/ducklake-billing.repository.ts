import { Injectable } from '@nestjs/common';
import { DuckLakeConnectionService } from './ducklake-connection.service';

/**
 * Isolation boundary for DuckLake-specific SQL (issue #49) — keeps it out of
 * BillingService the way S3Adapter keeps AWS SDK calls out of it.
 *
 * `listCatalogTables` is the one real thing this slice proves end-to-end:
 * the catalog attach + S3 secret both actually work against production
 * infra. Real billing-aggregation query methods land once ingestion
 * push-down (the next #49 slice) writes line items into the catalog.
 */
@Injectable()
export class DuckLakeBillingRepository {
  constructor(private readonly connectionService: DuckLakeConnectionService) {}

  async listCatalogTables(): Promise<string[]> {
    const connection = await this.connectionService.getConnection();
    const reader = await connection.runAndReadAll('SHOW ALL TABLES;');
    return reader.getRowObjects().map((row) => String(row.name));
  }
}
