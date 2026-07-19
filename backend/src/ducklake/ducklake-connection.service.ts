import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Lazily attaches the DuckLake catalog (Postgres metadata + S3 Parquet data)
 * on first use and memoizes the connection — NOT eager on module init. Local
 * dev has no DuckLake credentials configured (only one environment exists so
 * far, see docs/runbooks/ducklake-catalog-provisioning.md), so an eager
 * attach at Nest bootstrap would break `pnpm start:dev` for anyone not
 * actively working on this.
 */
@Injectable()
export class DuckLakeConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(DuckLakeConnectionService.name);
  private connectionPromise: Promise<DuckDBConnection> | null = null;

  constructor(private readonly config: ConfigService) {}

  async getConnection(): Promise<DuckDBConnection> {
    if (!this.connectionPromise) {
      this.connectionPromise = this.connect().catch((err) => {
        // Don't cache a failed attempt — a later call should retry rather
        // than permanently fail for the process lifetime.
        this.connectionPromise = null;
        throw err;
      });
    }
    return this.connectionPromise;
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.connectionPromise) return;
    const connection = await this.connectionPromise.catch(() => null);
    connection?.closeSync();
  }

  private async connect(): Promise<DuckDBConnection> {
    // Read + validate all config up front, before any network I/O, so a
    // missing value fails fast without attempting INSTALL/ATTACH.
    const host = this.config.getOrThrow<string>('DUCKLAKE_DB_HOST');
    const port = this.config.getOrThrow<string>('DUCKLAKE_DB_PORT');
    const database = this.config.getOrThrow<string>('DUCKLAKE_DB_NAME');
    const user = this.config.getOrThrow<string>('DUCKLAKE_DB_USER');
    const password = this.config.getOrThrow<string>('DUCKLAKE_DB_PASSWORD');
    const bucket = this.config.getOrThrow<string>('DUCKLAKE_S3_BUCKET');
    const region = this.config.getOrThrow<string>('DUCKLAKE_S3_REGION');
    const accessKeyId = this.config.getOrThrow<string>('DUCKLAKE_AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.getOrThrow<string>('DUCKLAKE_AWS_SECRET_ACCESS_KEY');

    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();

    await connection.run('INSTALL ducklake; INSTALL postgres; INSTALL httpfs;');

    await connection.run(`
      CREATE OR REPLACE SECRET ducklake_s3 (
        TYPE s3,
        KEY_ID ${sqlLiteral(accessKeyId)},
        SECRET ${sqlLiteral(secretAccessKey)},
        REGION ${sqlLiteral(region)},
        SCOPE ${sqlLiteral(`s3://${bucket}`)}
      );
    `);

    // ATTACH only accepts a string literal, not an expression — confirmed in
    // the ducklake-experiment spike (getenv()/concatenation inside ATTACH
    // itself throws a parser error) — so the connection string is fully
    // assembled here in JS, not composed via SQL. The libpq-style conninfo
    // string below isn't itself quote-escaped (unlike the CREATE SECRET
    // fields above): host/database/user are our own chosen names, and the
    // password is generated as alphanumeric-only (see the provisioning
    // runbook), so none of them can contain a space or quote that would
    // need libpq's own conninfo escaping.
    const attachTarget = `ducklake:postgres:dbname=${database} host=${host} port=${port} user=${user} password=${password}`;
    await connection.run(`ATTACH ${sqlLiteral(attachTarget)} AS lake (DATA_PATH ${sqlLiteral(`s3://${bucket}/`)});`);
    await connection.run('USE lake;');

    this.logger.log(`Attached DuckLake catalog "lake" (database=${database}, bucket=${bucket})`);
    return connection;
  }
}
