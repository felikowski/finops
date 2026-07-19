import { ConfigService } from '@nestjs/config';
import { DuckDBInstance } from '@duckdb/node-api';
import { describe, expect, it } from 'vitest';
import { DuckLakeConnectionService } from './ducklake-connection.service';

describe('DuckLakeConnectionService', () => {
  // Proves the run/read pattern the service relies on works, without going
  // anywhere near the service's own INSTALL/ATTACH logic — no network, no
  // real Postgres/S3, so this stays fast and offline in CI.
  it('can run a trivial query against a plain :memory: instance', async () => {
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();

    const reader = await connection.runAndReadAll('SELECT 1 AS one;');

    expect(reader.getRowObjects()).toEqual([{ one: 1 }]);
    connection.closeSync();
  });

  // Config is read and validated before any DuckDBInstance/network I/O (see
  // the service), so a missing value rejects immediately — this test never
  // reaches a real INSTALL/ATTACH either.
  it('rejects with a clear error when required config is missing', async () => {
    const config = new ConfigService({});
    // Otherwise ConfigService falls back to the real process.env, which
    // could accidentally contain DUCKLAKE_* values and make this test flaky.
    config.skipProcessEnv = true;
    const service = new DuckLakeConnectionService(config);

    await expect(service.getConnection()).rejects.toThrow(/DUCKLAKE_DB_HOST/);
  });
});
