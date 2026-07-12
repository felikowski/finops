import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { loadRemoteSecrets } from './config/secrets.bootstrap';

/**
 * Applies/reverts migrations against whichever database the environment
 * points at (local `.env` or, with SECRETS_SOURCE=infisical, a deployed
 * Postgres) — the same secrets-loading path main.ts uses at boot. Kept
 * separate from data-source.ts because the TypeORM CLI needs a
 * synchronously-exported DataSource, and this needs to `await
 * loadRemoteSecrets()` first.
 */
async function main(): Promise<void> {
  const action = process.argv[2];
  if (action !== 'run' && action !== 'revert') {
    throw new Error('Usage: ts-node src/migration-runner.ts <run|revert>');
  }

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
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
  });

  await dataSource.initialize();
  try {
    if (action === 'run') {
      const applied = await dataSource.runMigrations();
      console.log(
        applied.length
          ? `Applied ${applied.length} migration(s): ${applied.map((m) => m.name).join(', ')}`
          : 'No pending migrations.',
      );
    } else {
      await dataSource.undoLastMigration();
      console.log('Reverted the last migration.');
    }
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
