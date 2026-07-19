import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { loadRemoteSecrets } from './config/secrets.bootstrap';
import { DuckLakeConnectionService } from './ducklake/ducklake-connection.service';
import { DuckLakeBillingRepository } from './ducklake/ducklake-billing.repository';

/**
 * One-off verification that the DuckLake catalog attach actually works
 * end-to-end against real infra (Infisical → DuckDB → Postgres catalog →
 * S3) — same secrets-loading path as migration-runner.ts/seed-runner.ts.
 * Not run automatically; invoke deliberately via `pnpm run ducklake:verify`.
 */
async function main(): Promise<void> {
  await loadRemoteSecrets();

  const config = new ConfigService();
  const connectionService = new DuckLakeConnectionService(config);
  const repository = new DuckLakeBillingRepository(connectionService);

  const tables = await repository.listCatalogTables();
  console.log(
    `Attached DuckLake catalog. Tables (${tables.length}): ${tables.join(', ') || '(none yet)'}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
