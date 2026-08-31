## ADDED Requirements

### Requirement: Multi-cloud FOCUS ingestion read path
The DuckLake ingestion read path SHALL support reading a FOCUS CSV from AWS S3, Azure Blob Storage, and Google Cloud Storage, selecting the correct DuckDB secret type and path scheme based on the billing account's provider.

#### Scenario: Ingesting from Azure Blob Storage
- **WHEN** a pull is triggered for an Azure-provider billing account
- **THEN** `DuckLakeBillingRepository` creates an `azure`-typed DuckDB secret and reads the source via an `azure://` path

#### Scenario: Ingesting from Google Cloud Storage
- **WHEN** a pull is triggered for a GCP-provider billing account
- **THEN** `DuckLakeBillingRepository` reads the source via DuckDB's S3-compatible GCS support using HMAC-keyed credentials

### Requirement: FOCUS mapping and dedup remain provider-agnostic
The FOCUS column-mapping and `MERGE INTO` deduplication logic SHALL remain unchanged by the source provider — only the file-read path varies.

#### Scenario: Ingesting the same FOCUS schema from different providers
- **WHEN** ingestion runs against AWS-, Azure-, and GCP-sourced FOCUS exports with equivalent data
- **THEN** all three produce identically-mapped rows via the same `focus-column-mapping.ts` logic and the same dedup key computation
