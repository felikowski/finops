import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingLineItem } from './entities/billing-line-item.entity';
import { BillingService } from './billing.service';
import { S3Adapter } from './adapters/s3.adapter';

@Module({
  imports: [TypeOrmModule.forFeature([BillingLineItem])],
  providers: [BillingService, S3Adapter],
  exports: [BillingService],
})
export class BillingModule {}
