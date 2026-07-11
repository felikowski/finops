import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingAccount } from './entities/billing-account.entity';
import { BillingAccountsService } from './billing-accounts.service';
import { BillingAccountsController } from './billing-accounts.controller';
import { CredentialResolverService } from './credential-resolver.service';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [TypeOrmModule.forFeature([BillingAccount]), BillingModule],
  controllers: [BillingAccountsController],
  providers: [BillingAccountsService, CredentialResolverService],
})
export class BillingAccountsModule {}
