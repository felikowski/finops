import { Injectable, Logger } from '@nestjs/common';
import { DuckLakeBillingRepository, UpsertFromCsvParams } from '../ducklake/ducklake-billing.repository';

export interface S3GetStreamParams {
  billingAccountId: string;
  bucket: string;
  key: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Entry point `BillingAccountsService` calls to pull a FOCUS CSV — kept as a
 * thin wrapper around `DuckLakeBillingRepository` so its calling convention
 * (name, params shape, `{ rowsInserted }` return, throws on failure) stays
 * stable and `billing-accounts.module.ts`/the controller/the frontend don't
 * need to change. The actual push-down SQL lives in DuckLakeBillingRepository
 * (issue #49) — this class holds no DuckLake- or Postgres-specific logic.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly duckLakeBillingRepository: DuckLakeBillingRepository) {}

  async ingestFromS3(params: S3GetStreamParams): Promise<{ rowsInserted: number }> {
    this.logger.log(`Starting ingestion from s3://${params.bucket}/${params.key}`);

    const upsertParams: UpsertFromCsvParams = {
      billingAccountId: params.billingAccountId,
      sourceBucket: params.bucket,
      sourceKey: params.key,
      sourceRegion: params.region,
      sourceAccessKeyId: params.accessKeyId,
      sourceSecretAccessKey: params.secretAccessKey,
    };
    const { rowsAffected } = await this.duckLakeBillingRepository.upsertFromCsv(upsertParams);

    this.logger.log(`Ingestion complete. Rows affected: ${rowsAffected}`);
    return { rowsInserted: rowsAffected };
  }
}
