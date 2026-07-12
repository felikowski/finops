import { MigrationInterface, QueryRunner } from "typeorm";

export class Baseline1783854818004 implements MigrationInterface {
    name = 'Baseline1783854818004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "finops"."billing_accounts_provider_enum" AS ENUM('aws', 'azure', 'gcp')`);
        await queryRunner.query(`CREATE TABLE "finops"."billing_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" integer NOT NULL DEFAULT '1', "provider" "finops"."billing_accounts_provider_enum" NOT NULL DEFAULT 'aws', "displayName" character varying NOT NULL, "cloudAccountId" character varying, "sourceConfig" jsonb NOT NULL, "credentialRef" character varying, "focusVersion" character varying NOT NULL DEFAULT '1.2', "enabled" boolean NOT NULL DEFAULT true, "lastIngestedAt" TIMESTAMP, "lastRowsInserted" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f693b4dfaa4ad064b3821cb6d79" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "finops"."billing_account_pulls_status_enum" AS ENUM('success', 'error')`);
        await queryRunner.query(`CREATE TABLE "finops"."billing_account_pulls" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "billingAccountId" uuid NOT NULL, "startedAt" TIMESTAMP NOT NULL, "finishedAt" TIMESTAMP NOT NULL, "status" "finops"."billing_account_pulls_status_enum" NOT NULL, "rowsInserted" integer, "errorMessage" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8890cf151ef9899f1280c94ee3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_842ab8e80a44c394aec48d8dac" ON "finops"."billing_account_pulls" ("billingAccountId", "startedAt") `);
        await queryRunner.query(`CREATE TABLE "finops"."billing_line_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "billedCost" numeric(20,10) NOT NULL, "billingAccountId" character varying NOT NULL, "billingAccountName" character varying NOT NULL, "billingCurrency" character varying(3) NOT NULL, "billingPeriodEnd" TIMESTAMP NOT NULL, "billingPeriodStart" TIMESTAMP NOT NULL, "chargeCategory" character varying NOT NULL, "chargeClass" character varying, "chargeDescription" text NOT NULL, "chargePeriodEnd" TIMESTAMP NOT NULL, "chargePeriodStart" TIMESTAMP NOT NULL, "provider" character varying NOT NULL, "availabilityZone" character varying, "billingAccountType" character varying, "capacityReservationId" character varying, "capacityReservationStatus" character varying, "chargeFrequency" character varying, "commitmentDiscountCategory" character varying, "commitmentDiscountId" character varying, "commitmentDiscountName" character varying, "commitmentDiscountQuantity" numeric(20,10), "commitmentDiscountStatus" character varying, "commitmentDiscountType" character varying, "commitmentDiscountUnit" character varying, "consumedQuantity" numeric(20,10), "consumedUnit" character varying, "contractedCost" numeric(20,10), "contractedUnitPrice" numeric(20,10), "effectiveCost" numeric(20,10), "invoiceId" character varying, "invoiceIssuer" character varying, "listCost" numeric(20,10), "listUnitPrice" numeric(20,10), "pricingCategory" character varying, "pricingCurrency" character varying, "pricingCurrencyContractedUnitPrice" numeric(20,10), "pricingCurrencyEffectiveCost" numeric(20,10), "pricingCurrencyListUnitPrice" numeric(20,10), "pricingQuantity" numeric(20,10), "pricingUnit" character varying, "publisher" character varying, "regionId" character varying, "regionName" character varying, "resourceId" character varying, "resourceName" character varying, "resourceType" character varying, "serviceCategory" character varying, "serviceName" character varying, "serviceSubcategory" character varying, "skuId" character varying, "skuMeter" character varying, "skuPriceDetails" text, "skuPriceId" character varying, "subAccountId" character varying, "subAccountName" character varying, "subAccountType" character varying, "tags" jsonb, "lineItemKey" character varying NOT NULL, "insertedAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c9b7365d066a551f2d5d34845c9" UNIQUE ("lineItemKey"), CONSTRAINT "PK_0e167c43e52de8a85285a58f879" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_196e4c4093052434d1f9891760" ON "finops"."billing_line_items" ("billingPeriodStart", "billingPeriodEnd") `);
        await queryRunner.query(`ALTER TABLE "finops"."billing_account_pulls" ADD CONSTRAINT "FK_964c1955415cd9b0df48d822695" FOREIGN KEY ("billingAccountId") REFERENCES "finops"."billing_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "finops"."billing_account_pulls" DROP CONSTRAINT "FK_964c1955415cd9b0df48d822695"`);
        await queryRunner.query(`DROP INDEX "finops"."IDX_196e4c4093052434d1f9891760"`);
        await queryRunner.query(`DROP TABLE "finops"."billing_line_items"`);
        await queryRunner.query(`DROP INDEX "finops"."IDX_842ab8e80a44c394aec48d8dac"`);
        await queryRunner.query(`DROP TABLE "finops"."billing_account_pulls"`);
        await queryRunner.query(`DROP TYPE "finops"."billing_account_pulls_status_enum"`);
        await queryRunner.query(`DROP TABLE "finops"."billing_accounts"`);
        await queryRunner.query(`DROP TYPE "finops"."billing_accounts_provider_enum"`);
    }

}
