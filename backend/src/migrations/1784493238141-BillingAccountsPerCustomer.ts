import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Introduces `customers` as the real owner of a billing account, replacing
 * the `tenantId` int placeholder from the Baseline migration (its comment:
 * "not an FK yet ... until issue #8 defines the real tenant model"). This is
 * NOT #8's database-per-tenant architecture — just enough for the shared
 * app DB to stop showing every customer's billing accounts to every logged-in
 * user. `customerId` is nullable because rows that existed before this
 * scoping landed have no owner yet and need manual assignment.
 */
export class BillingAccountsPerCustomer1784493238141 implements MigrationInterface {
    name = 'BillingAccountsPerCustomer1784493238141'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "finops"."customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "auth0UserId" character varying NOT NULL, "displayName" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_customers_auth0UserId" UNIQUE ("auth0UserId"), CONSTRAINT "PK_customers" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "finops"."billing_accounts" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "finops"."billing_accounts" ADD "customerId" uuid`);
        await queryRunner.query(`ALTER TABLE "finops"."billing_accounts" ADD CONSTRAINT "FK_billing_accounts_customerId" FOREIGN KEY ("customerId") REFERENCES "finops"."customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "finops"."billing_accounts" DROP CONSTRAINT "FK_billing_accounts_customerId"`);
        await queryRunner.query(`ALTER TABLE "finops"."billing_accounts" DROP COLUMN "customerId"`);
        await queryRunner.query(`ALTER TABLE "finops"."billing_accounts" ADD "tenantId" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`DROP TABLE "finops"."customers"`);
    }

}
