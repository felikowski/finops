import { Module } from '@nestjs/common';
import { DuckLakeConnectionService } from './ducklake-connection.service';
import { DuckLakeBillingRepository } from './ducklake-billing.repository';

@Module({
  providers: [DuckLakeConnectionService, DuckLakeBillingRepository],
  exports: [DuckLakeBillingRepository],
})
export class DuckLakeModule {}
