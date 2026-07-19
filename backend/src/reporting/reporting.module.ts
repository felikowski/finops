import { Module } from '@nestjs/common';
import { DuckLakeModule } from '../ducklake/ducklake.module';
import { CustomersModule } from '../customers/customers.module';
import { BillingAccountsModule } from '../billing-accounts/billing-accounts.module';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';

@Module({
  imports: [DuckLakeModule, CustomersModule, BillingAccountsModule],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
