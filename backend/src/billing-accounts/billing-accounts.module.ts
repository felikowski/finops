import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingAccount } from './entities/billing-account.entity';
import { BillingAccountPull } from './entities/billing-account-pull.entity';
import { BillingAccountsService } from './billing-accounts.service';
import { BillingAccountsController } from './billing-accounts.controller';
import { CredentialResolverService } from './credential-resolver.service';
import { BillingModule } from '../billing/billing.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillingAccount, BillingAccountPull]),
    BillingModule,
    CustomersModule,
  ],
  controllers: [BillingAccountsController],
  providers: [BillingAccountsService, CredentialResolverService],
  exports: [BillingAccountsService],
})
export class BillingAccountsModule {}
