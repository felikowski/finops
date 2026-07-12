import 'reflect-metadata';
import { DataSource } from 'typeorm';

/**
 * DataSource for the TypeORM CLI (`migration:generate`, and `migration:run` /
 * `migration:revert` if invoked directly via the CLI binary).
 *
 * The CLI requires a synchronously-exported DataSource, so this only reads
 * plain env vars (`node --env-file=.env` or a shell env) — it does not
 * support SECRETS_SOURCE=infisical, since that fetch is async. Use the
 * `migration:run` / `migration:revert` package scripts (backed by
 * migration-runner.ts) to apply migrations against a deployed database.
 */
export default new DataSource({
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
