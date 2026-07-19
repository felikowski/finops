import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { DuckLakeModule } from '../ducklake/ducklake.module';

@Module({
  imports: [DuckLakeModule],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
