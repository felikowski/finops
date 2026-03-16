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

  private val(record: Record<string, any>, ...keys: string[]): any {
    for (const key of keys) {
      const v = record[key];
      if (v !== undefined && v !== null && v !== 'NULL') return v;
    }
    return null;
  }

  private parseDate(record: Record<string, any>, ...keys: string[]): Date | undefined {
    const v = this.val(record, ...keys);
    return v ? new Date(v) : undefined;
  }

  private mapRecord(record: Record<string, any>): Partial<BillingLineItem> {
    return {
      // Mandatory — support both FOCUS 1.0 and 1.2 column names
      billedCost: this.val(record, 'BilledCost'),
      billingAccountId: this.val(record, 'BillingAccountId'),
      billingAccountName: this.val(record, 'BillingAccountName'),
      billingCurrency: this.val(record, 'BillingCurrency'),
      billingPeriodEnd: this.parseDate(record, 'BillingPeriodEnd'),
      billingPeriodStart: this.parseDate(record, 'BillingPeriodStart'),
      chargeCategory: this.val(record, 'ChargeCategory'),
      chargeClass: this.val(record, 'ChargeClass'),
      chargeDescription: this.val(record, 'ChargeDescription'),
      chargePeriodEnd: this.parseDate(record, 'ChargePeriodEnd'),
      chargePeriodStart: this.parseDate(record, 'ChargePeriodStart'),
      // FOCUS 1.0 used ProviderName, 1.2 uses Provider
      provider: this.val(record, 'Provider', 'ProviderName'),

      // Conditional
      availabilityZone: this.val(record, 'AvailabilityZone'),
      billingAccountType: this.val(record, 'BillingAccountType'),
      capacityReservationId: this.val(record, 'CapacityReservationId'),
      capacityReservationStatus: this.val(record, 'CapacityReservationStatus'),
      chargeFrequency: this.val(record, 'ChargeFrequency'),
      commitmentDiscountCategory: this.val(record, 'CommitmentDiscountCategory'),
      commitmentDiscountId: this.val(record, 'CommitmentDiscountId'),
      commitmentDiscountName: this.val(record, 'CommitmentDiscountName'),
      commitmentDiscountQuantity: this.val(record, 'CommitmentDiscountQuantity'),
      commitmentDiscountStatus: this.val(record, 'CommitmentDiscountStatus'),
      commitmentDiscountType: this.val(record, 'CommitmentDiscountType'),
      commitmentDiscountUnit: this.val(record, 'CommitmentDiscountUnit'),
      consumedQuantity: this.val(record, 'ConsumedQuantity'),
      consumedUnit: this.val(record, 'ConsumedUnit'),
      contractedCost: this.val(record, 'ContractedCost'),
      contractedUnitPrice: this.val(record, 'ContractedUnitPrice'),
      effectiveCost: this.val(record, 'EffectiveCost'),
      invoiceId: this.val(record, 'InvoiceId'),
      // FOCUS 1.0 used InvoiceIssuerName, 1.2 uses InvoiceIssuer
      invoiceIssuer: this.val(record, 'InvoiceIssuer', 'InvoiceIssuerName'),
      listCost: this.val(record, 'ListCost'),
      listUnitPrice: this.val(record, 'ListUnitPrice'),
      pricingCategory: this.val(record, 'PricingCategory'),
      pricingCurrency: this.val(record, 'PricingCurrency'),
      pricingCurrencyContractedUnitPrice: this.val(record, 'PricingCurrencyContractedUnitPrice'),
      pricingCurrencyEffectiveCost: this.val(record, 'PricingCurrencyEffectiveCost'),
      pricingCurrencyListUnitPrice: this.val(record, 'PricingCurrencyListUnitPrice'),
      pricingQuantity: this.val(record, 'PricingQuantity'),
      pricingUnit: this.val(record, 'PricingUnit'),
      // FOCUS 1.0 used PublisherName, 1.2 uses Publisher
      publisher: this.val(record, 'Publisher', 'PublisherName'),
      regionId: this.val(record, 'RegionId'),
      regionName: this.val(record, 'RegionName'),
      resourceId: this.val(record, 'ResourceId'),
      resourceName: this.val(record, 'ResourceName'),
      resourceType: this.val(record, 'ResourceType'),
      serviceCategory: this.val(record, 'ServiceCategory'),
      serviceName: this.val(record, 'ServiceName'),
      serviceSubcategory: this.val(record, 'ServiceSubcategory'),
      skuId: this.val(record, 'SkuId'),
      skuMeter: this.val(record, 'SkuMeter'),
      skuPriceDetails: this.val(record, 'SkuPriceDetails'),
      skuPriceId: this.val(record, 'SkuPriceId'),
      subAccountId: this.val(record, 'SubAccountId'),
      subAccountName: this.val(record, 'SubAccountName'),
      subAccountType: this.val(record, 'SubAccountType'),
      tags: (() => {
        const t = this.val(record, 'Tags');
        if (!t) return null;
        try { return JSON.parse(t); } catch { return null; }
      })(),
    };
  }
}
