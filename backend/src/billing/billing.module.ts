import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingLineItem } from './entities/billing-line-item.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { S3Adapter } from './adapters/s3.adapter';

@Module({
  imports: [TypeOrmModule.forFeature([BillingLineItem])],
  controllers: [BillingController],
  providers: [BillingService, S3Adapter],
})
export class BillingModule {}
