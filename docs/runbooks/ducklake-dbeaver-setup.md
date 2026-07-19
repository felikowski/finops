# Runbook: browsing DuckLake data in DBeaver

A plain Postgres client connected to the `ducklake` catalog database (see
[the provisioning runbook](./ducklake-catalog-provisioning.md)) only shows DuckLake's internal
metadata tables (snapshots, file paths, schema versions) — not the actual data, since the real
query execution requires DuckDB itself to resolve that metadata against the Parquet files in S3.
This runbook sets up DBeaver so it does that resolution automatically on every connect, giving
full DBeaver functionality (schema navigator, data grid, SQL editor, autocomplete) against real
DuckLake data — not just a bare `duckdb` CLI shell.

## 1. Add the DuckDB driver

1. New connection → search for and select the **DuckDB** driver.
2. On first connection test, DBeaver prompts to download the official DuckDB JDBC connector from
   Maven — accept it. (If not prompted: **Database → Driver Manager → DuckDB → Edit → Libraries
   tab → Download/Update**.)
3. Set the database path to **`:memory:`** — same as `DuckLakeConnectionService` uses; no local
   `.duckdb` file, all real data lives in the attached catalog/S3.

## 2. Configure bootstrap queries

DBeaver runs "bootstrap queries" automatically on every connect, before loading the navigator's
metadata — exactly what's needed to install extensions and `ATTACH` the catalog each session.

In the connection's **Connection Initialization Settings → Bootstrap Queries**, click
**Configure → Add**, and enter the following (semicolon-separated statements, one block):

```sql
INSTALL ducklake; INSTALL postgres; INSTALL httpfs;

CREATE OR REPLACE SECRET ducklake_s3 (
  TYPE s3,
  KEY_ID '<DUCKLAKE_AWS_ACCESS_KEY_ID>',
  SECRET '<DUCKLAKE_AWS_SECRET_ACCESS_KEY>',
  REGION '<DUCKLAKE_S3_REGION>',
  SCOPE 's3://<DUCKLAKE_S3_BUCKET>'
);

ATTACH 'ducklake:postgres:dbname=<DUCKLAKE_DB_NAME> host=<DUCKLAKE_DB_HOST> port=<DUCKLAKE_DB_PORT> user=<DUCKLAKE_DB_USER> password=<DUCKLAKE_DB_PASSWORD>' AS lake (DATA_PATH 's3://<DUCKLAKE_S3_BUCKET>/');
USE lake;
```

Fill in the placeholders from Infisical — same paths `secrets.bootstrap.ts`'s `MANAGED_ENV`
fetches for the backend, see [`backend/docs/infisical.md`](../../backend/docs/infisical.md):
`/postgres` (host/port), `/postgres/ducklake` (database), `/postgres/ducklake/ducklake_owner`
(user/password), `/aws/finops/ducklake` (access key id/secret/bucket/region).

Save and connect. The navigator should show `lake` with `billing_line_items` as a normal
browsable schema.

## Notes

- **Credentials end up in DBeaver's local connection config**, not centrally managed via
  Infisical — acceptable for a personal dev machine (same trust boundary as the local `.env`
  file already used for `SECRETS_SOURCE=local`), but don't share an exported DBeaver connection
  profile without stripping the bootstrap queries first.
- Bootstrap queries run on **every** connect and must stay fast — this is exactly the
  `INSTALL`/`ATTACH` sequence `DuckLakeConnectionService` runs lazily on first use, not extra
  work.
- If credentials rotate (a new access key, a changed catalog password), just update the
  bootstrap queries with the new values from Infisical — nothing else to change.
