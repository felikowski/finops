## 1. Production infrastructure

- [x] 1.1 Provision production `ducklake_catalog` Postgres DB + dedicated role on the VPS (not reusing `finops_owner`/`finops_app`) — documented in `docs/runbooks/ducklake-catalog-provisioning.md`
- [x] 1.2 Provision production S3 bucket + least-privilege IAM for the DuckLake data path

## 2. Backend integration

- [x] 2.1 Integrate `@duckdb/node-api`; add `DuckLakeConnectionService` (lazy attach, memoized connection)
- [x] 2.2 Add `DuckLakeBillingRepository` as the sole boundary for DuckLake SQL
- [x] 2.3 Add `focus-column-mapping.ts` for FOCUS-to-DuckLake column mapping (provider-agnostic of *how* the file is read)

## 3. Ingestion push-down

- [x] 3.1 Change `billing-accounts.service.ts`'s pull path to write via `DuckLakeBillingRepository.upsertFromCsv` (`read_csv()` + `MERGE INTO`) instead of row-by-row Postgres insert
- [x] 3.2 Drop `billing_line_items` and the old `BillingService`/`billing.module.ts` Postgres path (migration `DropBillingLineItems`)
- [x] 3.3 Natural-key dedup via `lineItemKey`, matched in the `MERGE INTO` (see `harden-tenant-security` for the outstanding cross-account dedup gap)

## 4. Outstanding acceptance criteria

- [ ] 4.1 Decide and document (or automate) a snapshot/orphaned-Parquet-file cleanup policy
- [ ] 4.2 Document the migration/backfill decision for any pre-cutover `billing_line_item` Postgres data (one-time backfill vs. accept the cutover as the effective start of DuckLake history)
- [x] 4.3 Prove a production analytics query against DuckLake is sanity-checked for performance at ingested volume (delivered by `cost-reporting-dashboard`, #58)
- [ ] 4.4 Write up the decision/rollout doc explicitly linking to the `ducklake-experiment` spike as reference
