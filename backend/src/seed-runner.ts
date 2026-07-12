import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { loadRemoteSecrets } from './config/secrets.bootstrap';
import { BillingAccount, BillingProvider } from './billing-accounts/entities/billing-account.entity';

/**
 * Dev/local fixture data — NOT meant for prod. Real billing accounts are
 * tenant configuration entered through the app itself (POST
 * /billing-accounts), not deploy-time fixtures (see issue #37). Bucket/key/
 * region are overridable via env vars in case you have a real test bucket to
 * point at; otherwise a pull against this account will simply fail (visible
 * in its pull log), which is fine for exercising the list/pull UI without a
 * real S3 source.
 */
const DEV_FIXTURE_DISPLAY_NAME = 'Dev Fixture (seed)';

function buildDevFixture(): Partial<BillingAccount> {
  return {
    displayName: DEV_FIXTURE_DISPLAY_NAME,
    provider: BillingProvider.AWS,
    sourceConfig: {
      bucket: process.env.SEED_BILLING_BUCKET ?? 'finops-dev-fixture-bucket',
      key: process.env.SEED_BILLING_KEY ?? 'focus/sample-billing-export.csv',
      region: process.env.SEED_BILLING_REGION ?? 'eu-central-1',
    },
    credentialRef: null,
    focusVersion: '1.2',
    enabled: true,
  };
}

/**
 * Applies dev fixture data against whichever database the environment points
 * at (local `.env` or, with SECRETS_SOURCE=infisical, a deployed Postgres) —
 * same secrets-loading path as migration-runner.ts. Kept separate from
 * migrations: this seeds data, not schema, and is never run automatically
 * (no migrationsRun equivalent) — invoke it deliberately via `pnpm run seed`.
 */
async function main(): Promise<void> {
  await loadRemoteSecrets();

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'finops',
    schema: process.env.DB_SCHEMA ?? 'finops',
    synchronize: false,
    entities: [BillingAccount],
  });

  await dataSource.initialize();
  try {
    const repo = dataSource.getRepository(BillingAccount);
    const existing = await repo.findOneBy({ displayName: DEV_FIXTURE_DISPLAY_NAME });
    if (existing) {
      console.log(`Skipped: "${DEV_FIXTURE_DISPLAY_NAME}" already exists (id=${existing.id}).`);
      return;
    }

    const created = await repo.save(repo.create(buildDevFixture()));
    console.log(`Created billing account fixture "${created.displayName}" (id=${created.id}).`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
