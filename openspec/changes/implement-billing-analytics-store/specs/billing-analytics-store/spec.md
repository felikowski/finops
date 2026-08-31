## Purpose
Store and query FOCUS billing line items in DuckLake (DuckDB + Postgres catalog + S3 Parquet) instead of row-store Postgres, so analytical aggregation stays fast and cheap as billing volume grows into hundreds of millions of rows.

## ADDED Requirements

### Requirement: Production DuckLake catalog and data path
The system SHALL attach a production DuckLake catalog backed by a dedicated Postgres database and role (separate from the app's control-plane database) and an S3 bucket scoped by least-privilege IAM as the Parquet data path.

#### Scenario: Backend attaches DuckLake
- **WHEN** the backend needs to run a DuckLake query for the first time in a process's lifetime
- **THEN** it lazily attaches the catalog using `DUCKLAKE_DB_*`/`DUCKLAKE_S3_*` configuration and memoizes the connection for subsequent calls

### Requirement: DuckLake access is isolated behind a repository boundary
All DuckLake-specific SQL SHALL live behind `DuckLakeBillingRepository` (or an equivalent boundary); no controller or unrelated service SHALL construct DuckDB/DuckLake SQL directly.

#### Scenario: Adding a new analytics query
- **WHEN** a new aggregation query is needed
- **THEN** it is added as a method on the DuckLake repository, not inlined into a controller or a one-off service

### Requirement: Ingestion writes via SQL push-down, not row-by-row inserts
FOCUS billing CSV ingestion SHALL write into DuckLake via SQL push-down (`read_csv()` + `MERGE INTO`), not by loading rows into the application heap and inserting them one batch at a time.

#### Scenario: Pulling a billing account
- **WHEN** a billing account pull is triggered
- **THEN** the CSV is read and merged directly by DuckDB from S3, without every row passing through Node.js application code

### Requirement: Natural-key deduplication on re-import
The system SHALL derive a deterministic line-item key from FOCUS natural-key columns and use it as the `MERGE INTO` match condition, so re-importing the same export updates existing rows instead of duplicating them.

#### Scenario: Re-pulling an unchanged export
- **WHEN** the same billing account's source file is pulled twice without changes
- **THEN** the second pull updates the matched rows in place and inserts no duplicates

### Requirement: Bounded storage growth from the snapshot model
The system SHALL have a documented (and where practical, automated) policy for reclaiming Parquet files orphaned by DuckLake's snapshot/time-travel model, so storage does not grow unbounded from deletes/overwrites.

#### Scenario: A table is dropped or rewritten
- **WHEN** a DuckLake table is dropped or a `MERGE`/overwrite leaves old Parquet files unreferenced
- **THEN** a documented cleanup process (manual runbook or automated job) exists to reclaim that storage on a known cadence
