import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Billing line items are now written into the DuckLake catalog via
 * push-down SQL (issue #49), not this Postgres table. Written by hand,
 * mirroring the Baseline migration's own CREATE TABLE/CREATE INDEX exactly
 * (reversed) — `migration:generate` reported "no changes" for this table's
 * removal (it only diffs entities it still has metadata for, not tables
 * orphaned by a deleted entity), so hand-authoring was the reliable path.
 */
export class DropBillingLineItems1784481740826 implements MigrationInterface {
    name = 'DropBillingLineItems1784481740826'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "finops"."IDX_196e4c4093052434d1f9891760"`);
        await queryRunner.query(`DROP TABLE "finops"."billing_line_items"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "finops"."billing_line_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "billedCost" numeric(20,10) NOT NULL, "billingAccountId" character varying NOT NULL, "billingAccountName" character varying NOT NULL, "billingCurrency" character varying(3) NOT NULL, "billingPeriodEnd" TIMESTAMP NOT NULL, "billingPeriodStart" TIMESTAMP NOT NULL, "chargeCategory" character varying NOT NULL, "chargeClass" character varying, "chargeDescription" text NOT NULL, "chargePeriodEnd" TIMESTAMP NOT NULL, "chargePeriodStart" TIMESTAMP NOT NULL, "provider" character varying NOT NULL, "availabilityZone" character varying, "billingAccountType" character varying, "capacityReservationId" character varying, "capacityReservationStatus" character varying, "chargeFrequency" character varying, "commitmentDiscountCategory" character varying, "commitmentDiscountId" character varying, "commitmentDiscountName" character varying, "commitmentDiscountQuantity" numeric(20,10), "commitmentDiscountStatus" character varying, "commitmentDiscountType" character varying, "commitmentDiscountUnit" character varying, "consumedQuantity" numeric(20,10), "consumedUnit" character varying, "contractedCost" numeric(20,10), "contractedUnitPrice" numeric(20,10), "effectiveCost" numeric(20,10), "invoiceId" character varying, "invoiceIssuer" character varying, "listCost" numeric(20,10), "listUnitPrice" numeric(20,10), "pricingCategory" character varying, "pricingCurrency" character varying, "pricingCurrencyContractedUnitPrice" numeric(20,10), "pricingCurrencyEffectiveCost" numeric(20,10), "pricingCurrencyListUnitPrice" numeric(20,10), "pricingQuantity" numeric(20,10), "pricingUnit" character varying, "publisher" character varying, "regionId" character varying, "regionName" character varying, "resourceId" character varying, "resourceName" character varying, "resourceType" character varying, "serviceCategory" character varying, "serviceName" character varying, "serviceSubcategory" character varying, "skuId" character varying, "skuMeter" character varying, "skuPriceDetails" text, "skuPriceId" character varying, "subAccountId" character varying, "subAccountName" character varying, "subAccountType" character varying, "tags" jsonb, "lineItemKey" character varying NOT NULL, "insertedAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c9b7365d066a551f2d5d34845c9" UNIQUE ("lineItemKey"), CONSTRAINT "PK_0e167c43e52de8a85285a58f879" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_196e4c4093052434d1f9891760" ON "finops"."billing_line_items" ("billingPeriodStart", "billingPeriodEnd") `);
    }

}
