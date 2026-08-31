## 1. Source configuration

- [ ] 1.1 Extend `SourceConfig` into a discriminated union: `AwsSourceConfig`, `AzureSourceConfig` (storage account, container, blob path), `GcpSourceConfig` (GCS bucket, object, project)
- [ ] 1.2 Extend per-provider `sourceConfig` validation in `billing-accounts.service.ts` for Azure and GCP shapes

## 2. Credential resolution

- [ ] 2.1 Add Azure credential resolution (connection string / SAS token / service principal)
- [ ] 2.2 Add GCP credential resolution (service account key / HMAC keys)

## 3. Ingestion read path

- [ ] 3.1 Extend `DuckLakeBillingRepository.upsertFromCsv` (or a per-provider adapter) to build the correct DuckDB secret + `read_csv()` path scheme for Azure (`azure://`, `TYPE azure`) and GCP (S3-compatible GCS, HMAC keys)
- [ ] 3.2 Confirm `focus-column-mapping.ts` and the `MERGE INTO` logic require no changes

## 4. Verification

- [ ] 4.1 Ingest at least one real Azure FOCUS export end-to-end against real infrastructure
- [ ] 4.2 Ingest at least one real GCP FOCUS export end-to-end against real infrastructure
- [ ] 4.3 Confirm malformed per-provider `sourceConfig`s are rejected with a clear error, matching today's AWS behavior
- [ ] 4.4 Regression-check the existing AWS ingestion path is unaffected
