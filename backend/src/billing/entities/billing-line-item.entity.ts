import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('billing_line_items')
@Index(['billingPeriodStart', 'billingPeriodEnd'])
export class BillingLineItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ─── Mandatory columns ────────────────────────────────────────────────────

  @Column({ type: 'decimal', precision: 20, scale: 10 })
  billedCost!: number;

  @Column({ type: 'varchar' })
  billingAccountId!: string;

  @Column({ type: 'varchar' })
  billingAccountName!: string;

  @Column({ type: 'varchar', length: 3 })
  billingCurrency!: string;

  @Column({ type: 'timestamp' })
  billingPeriodEnd!: Date;

  @Column({ type: 'timestamp' })
  billingPeriodStart!: Date;

  @Column({ type: 'varchar' })
  chargeCategory!: string;

  @Column({ type: 'varchar', nullable: true })
  chargeClass!: string | null;

  @Column({ type: 'text' })
  chargeDescription!: string;

  @Column({ type: 'timestamp' })
  chargePeriodEnd!: Date;

  @Column({ type: 'timestamp' })
  chargePeriodStart!: Date;

  @Column({ type: 'varchar' })
  provider!: string;

  // ─── Conditional / Recommended columns ───────────────────────────────────

  @Column({ type: 'varchar', nullable: true })
  availabilityZone!: string | null;

  @Column({ type: 'varchar', nullable: true })
  billingAccountType!: string | null;

  @Column({ type: 'varchar', nullable: true })
  capacityReservationId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  capacityReservationStatus!: string | null;

  @Column({ type: 'varchar', nullable: true })
  chargeFrequency!: string | null;

  @Column({ type: 'varchar', nullable: true })
  commitmentDiscountCategory!: string | null;

  @Column({ type: 'varchar', nullable: true })
  commitmentDiscountId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  commitmentDiscountName!: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 10, nullable: true })
  commitmentDiscountQuantity!: number | null;

  @Column({ type: 'varchar', nullable: true })
  commitmentDiscountStatus!: string | null;

  @Column({ type: 'varchar', nullable: true })
  commitmentDiscountType!: string | null;

  @Column({ type: 'varchar', nullable: true })
  commitmentDiscountUnit!: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 10, nullable: true })
  consumedQuantity!: number | null;

  @Column({ type: 'varchar', nullable: true })
  consumedUnit!: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 10, nullable: true })
  contractedCost!: number | null;

  @Column({ type: 'decimal', precision: 20, scale: 10, nullable: true })
  contractedUnitPrice!: number | null;

  @Column({ type: 'decimal', precision: 20, scale: 10, nullable: true })
  effectiveCost!: number | null;

  @Column({ type: 'varchar', nullable: true })
  invoiceId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  invoiceIssuer!: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 10, nullable: true })
  listCost!: number | null;

  @Column({ type: 'decimal', precision: 20, scale: 10, nullable: true })
  listUnitPrice!: number | null;

  @Column({ type: 'varchar', nullable: true })
  pricingCategory!: string | null;

  @Column({ type: 'varchar', nullable: true })
  pricingCurrency!: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 10, nullable: true })
  pricingCurrencyContractedUnitPrice!: number | null;

  @Column({ type: 'decimal', precision: 20, scale: 10, nullable: true })
  pricingCurrencyEffectiveCost!: number | null;

  @Column({ type: 'decimal', precision: 20, scale: 10, nullable: true })
  pricingCurrencyListUnitPrice!: number | null;

  @Column({ type: 'decimal', precision: 20, scale: 10, nullable: true })
  pricingQuantity!: number | null;

  @Column({ type: 'varchar', nullable: true })
  pricingUnit!: string | null;

  @Column({ type: 'varchar', nullable: true })
  publisher!: string | null;

  @Column({ type: 'varchar', nullable: true })
  regionId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  regionName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  resourceId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  resourceName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  resourceType!: string | null;

  @Column({ type: 'varchar', nullable: true })
  serviceCategory!: string | null;

  @Column({ type: 'varchar', nullable: true })
  serviceName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  serviceSubcategory!: string | null;

  @Column({ type: 'varchar', nullable: true })
  skuId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  skuMeter!: string | null;

  @Column({ type: 'text', nullable: true })
  skuPriceDetails!: string | null;

  @Column({ type: 'varchar', nullable: true })
  skuPriceId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  subAccountId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  subAccountName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  subAccountType!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  tags!: Record<string, string> | null;

  // ─── Audit ────────────────────────────────────────────────────────────────

  @CreateDateColumn()
  createdAt!: Date;
}
