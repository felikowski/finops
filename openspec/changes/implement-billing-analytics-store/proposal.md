## Why

Billing line items were stored and queried in PostgreSQL's row-store `billing_line_items` table
(see `billing-ingestion`). As FOCUS billing volume grows into hundreds of millions of rows,
analytical aggregation (cost by period/provider/service/tag) becomes the dominant bottleneck — the
original motivation for the columnar-store evaluation in issue #4. That evaluation concluded with
**DuckLake** (ADR-0006, Accepted), validated end-to-end by a standalone spike
(`ducklake-experiment`). Issue #49 is the production follow-through. Substantial implementation
already exists on `feat/billing-accounts-per-customer` (PRs #53/#54/#56); this proposal formalizes
the remaining scope.

## What Changes

- Provision a production `ducklake_catalog` Postgres database on the VPS, separate from the
  `finops` app database/schema, with its own owner/app role split (mirrors ADR-0002's pattern).
- Provision a production S3 bucket as the DuckLake `DATA_PATH`, with least-privilege IAM scoped to
  that bucket only.
- Integrate `@duckdb/node-api` into the backend and add a `DuckLakeBillingRepository` boundary so
  DuckLake-specific SQL does not spread through services.
- Change FOCUS billing ingestion to write line items into DuckLake via SQL push-down
  (`read_csv()` + `MERGE INTO`) instead of the row-by-row Postgres insert path, replacing
  `billing_line_items` entirely (dropped via migration).
- Decide and implement/document a cleanup policy for DuckLake's snapshot/time-travel model, since
  `DROP TABLE` (and presumably deletes/updates) leaves orphaned Parquet files in S3 until an
  explicit cleanup runs.
- Decide and document the migration strategy for any pre-existing `billing_line_item` Postgres data.
- Prove at least one production analytics query is measurably faster against DuckLake than the
  equivalent Postgres query at the tested volume (delivered by `cost-reporting-dashboard`, #58).

## Capabilities

### New Capabilities
- `billing-analytics-store`: the production DuckLake catalog/bucket, the DuckDB connection and
  repository boundary, and FOCUS ingestion writing into it via SQL push-down with natural-key dedup.

## Impact

- Removes `backend/src/billing/` (Postgres-based `BillingService`, `billing_line_items` entity) —
  superseded by `backend/src/ducklake/`.
- `backend/src/billing-accounts/billing-accounts.service.ts` — `runPull` now delegates to the
  DuckLake repository instead of `BillingService.ingestFromS3`.
- New production infra: `ducklake_catalog` Postgres DB + role, production S3 bucket + IAM.
- Supersedes issue #4 (the original columnar-store evaluation, now decided).
