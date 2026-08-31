## Why

FOCUS billing ingestion currently only works for AWS, even though `BillingProvider` already
declares `AZURE`/`GCP` values and `billing-account-registry` explicitly documents that only `aws`
is implemented — `assertSupportedProvider` rejects both. FOCUS 1.0/1.2 is a FinOps Foundation
spec-level format, not AWS-specific: Azure Cost Management and GCP Billing both export
FOCUS-conformant data today. Since `implement-billing-analytics-store` (#49) landed, the actual
FOCUS column-mapping and dedup logic (`focus-column-mapping.ts`, the `MERGE INTO` itself) is already
provider-agnostic — it operates on the FOCUS CSV schema, not on how the file was read. The only
genuinely AWS-specific piece is the S3 read path (hardcoded `s3://` scheme and `CREATE SECRET
(TYPE s3, ...)`). This issue (#57) is scoped narrowly to that.

## What Changes

- Extend `SourceConfig` from a single `AwsSourceConfig` into a discriminated union: keep
  `AwsSourceConfig` (`bucket`/`key`/`region`), add an Azure shape (storage account, container, blob
  path) and a GCP shape (GCS bucket, object, project).
- Extend per-provider `sourceConfig` validation in `billing-accounts.service.ts` to validate each
  provider's shape.
- Extend `DuckLakeBillingRepository.upsertFromCsv` (or a small per-provider adapter it delegates to)
  to build the right DuckDB secret and `read_csv()` path scheme per provider — `azure://` via a
  `TYPE azure` secret, GCS via DuckDB's native S3-compatible HMAC-keyed GCS support — instead of the
  hardcoded `s3://`/`TYPE s3` path used today.
- Extend `CredentialResolverService` (or add sibling resolvers) for Azure (connection string / SAS
  token / service principal) and GCP (service account key / HMAC keys) credential shapes.
- No changes expected to `focus-column-mapping.ts` or the `MERGE INTO` logic itself; confirming that
  stays true is part of proving this is correctly scoped.

## Capabilities

### Modified Capabilities
- `billing-account-registry`: `SourceConfig` and its validation extend to Azure and GCP shapes.
- `billing-analytics-store`: the ingestion read path extends beyond S3 to Azure Blob Storage and GCS.

## Impact

- `backend/src/billing-accounts/entities/billing-account.entity.ts` (`SourceConfig` union)
- `backend/src/billing-accounts/billing-accounts.service.ts` (per-provider validation)
- `backend/src/billing-accounts/credential-resolver.service.ts` (or new sibling resolvers)
- `backend/src/ducklake/ducklake-billing.repository.ts` (`upsertFromCsv` read-path branching)
