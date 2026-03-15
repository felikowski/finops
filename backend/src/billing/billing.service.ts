import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parse } from 'csv-parse';
import { BillingLineItem } from './entities/billing-line-item.entity';
import { S3Adapter } from './adapters/s3.adapter';

const BATCH_SIZE = 1000;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(BillingLineItem)
    private readonly repo: Repository<BillingLineItem>,
    private readonly s3Adapter: S3Adapter,
  ) {}

  async ingestFromS3(bucket: string, key: string): Promise<{ rowsInserted: number }> {
    this.logger.log(`Starting ingestion from s3://${bucket}/${key}`);

    const s3Stream = await this.s3Adapter.getStream(bucket, key);
    const parser = s3Stream.pipe(
      parse({ columns: true, cast: true, skip_empty_lines: true, trim: true }),
    );

    let batch: Partial<BillingLineItem>[] = [];
    let totalRows = 0;

    for await (const record of parser) {
      batch.push(this.mapRecord(record));

      if (batch.length >= BATCH_SIZE) {
        await this.repo.insert(batch);
        totalRows += batch.length;
        this.logger.log(`Inserted ${totalRows} rows...`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await this.repo.insert(batch);
      totalRows += batch.length;
    }

    this.logger.log(`Ingestion complete. Total rows inserted: ${totalRows}`);
    return { rowsInserted: totalRows };
  }

  private mapRecord(record: Record<string, any>): Partial<BillingLineItem> {
    return {
      billedCost: record['BilledCost'],
      billingAccountId: record['BillingAccountId'],
      billingAccountName: record['BillingAccountName'],
      billingCurrency: record['BillingCurrency'],
      billingPeriodEnd: record['BillingPeriodEnd'] ? new Date(record['BillingPeriodEnd']) : undefined,
      billingPeriodStart: record['BillingPeriodStart'] ? new Date(record['BillingPeriodStart']) : undefined,
      chargeCategory: record['ChargeCategory'],
      chargeClass: record['ChargeClass'] ?? null,
      chargeDescription: record['ChargeDescription'],
      chargePeriodEnd: record['ChargePeriodEnd'] ? new Date(record['ChargePeriodEnd']) : undefined,
      chargePeriodStart: record['ChargePeriodStart'] ? new Date(record['ChargePeriodStart']) : undefined,
      provider: record['Provider'],
      availabilityZone: record['AvailabilityZone'] ?? null,
      billingAccountType: record['BillingAccountType'] ?? null,
      capacityReservationId: record['CapacityReservationId'] ?? null,
      capacityReservationStatus: record['CapacityReservationStatus'] ?? null,
      chargeFrequency: record['ChargeFrequency'] ?? null,
      commitmentDiscountCategory: record['CommitmentDiscountCategory'] ?? null,
      commitmentDiscountId: record['CommitmentDiscountId'] ?? null,
      commitmentDiscountName: record['CommitmentDiscountName'] ?? null,
      commitmentDiscountQuantity: record['CommitmentDiscountQuantity'] ?? null,
      commitmentDiscountStatus: record['CommitmentDiscountStatus'] ?? null,
      commitmentDiscountType: record['CommitmentDiscountType'] ?? null,
      commitmentDiscountUnit: record['CommitmentDiscountUnit'] ?? null,
      consumedQuantity: record['ConsumedQuantity'] ?? null,
      consumedUnit: record['ConsumedUnit'] ?? null,
      contractedCost: record['ContractedCost'] ?? null,
      contractedUnitPrice: record['ContractedUnitPrice'] ?? null,
      effectiveCost: record['EffectiveCost'] ?? null,
      invoiceId: record['InvoiceId'] ?? null,
      invoiceIssuer: record['InvoiceIssuer'] ?? null,
      listCost: record['ListCost'] ?? null,
      listUnitPrice: record['ListUnitPrice'] ?? null,
      pricingCategory: record['PricingCategory'] ?? null,
      pricingCurrency: record['PricingCurrency'] ?? null,
      pricingCurrencyContractedUnitPrice: record['PricingCurrencyContractedUnitPrice'] ?? null,
      pricingCurrencyEffectiveCost: record['PricingCurrencyEffectiveCost'] ?? null,
      pricingCurrencyListUnitPrice: record['PricingCurrencyListUnitPrice'] ?? null,
      pricingQuantity: record['PricingQuantity'] ?? null,
      pricingUnit: record['PricingUnit'] ?? null,
      publisher: record['Publisher'] ?? null,
      regionId: record['RegionId'] ?? null,
      regionName: record['RegionName'] ?? null,
      resourceId: record['ResourceId'] ?? null,
      resourceName: record['ResourceName'] ?? null,
      resourceType: record['ResourceType'] ?? null,
      serviceCategory: record['ServiceCategory'] ?? null,
      serviceName: record['ServiceName'] ?? null,
      serviceSubcategory: record['ServiceSubcategory'] ?? null,
      skuId: record['SkuId'] ?? null,
      skuMeter: record['SkuMeter'] ?? null,
      skuPriceDetails: record['SkuPriceDetails'] ?? null,
      skuPriceId: record['SkuPriceId'] ?? null,
      subAccountId: record['SubAccountId'] ?? null,
      subAccountName: record['SubAccountName'] ?? null,
      subAccountType: record['SubAccountType'] ?? null,
      tags: record['Tags'] ? JSON.parse(record['Tags']) : null,
    };
  }
}
