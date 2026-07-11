# 7. Billing source registry with per-account, runtime-resolved credentials

- **Status:** Accepted
- **Date:** 2026-07-12
- **Related:** ADR-0003, ADR-0004, issue #16, issue #8, issue #10

## Context

Before this change, `POST /billing/ingest` took a raw `{ bucket, key }` in the request
body, and `S3Adapter` built one `S3Client` at startup from a single global AWS identity
(`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`, fetched once via Infisical — ADR-0004). There
was no server-side notion of which buckets are legitimate billing sources, and only one
AWS identity could ever be represented — multiple billing accounts / clouds couldn't be
modeled.

ADR-0004 already flagged this as a known gap: *"Per-source AWS credentials don't fit a
single global env var — they must become runtime resolution once multiple billing
accounts exist (issue #16)."* This ADR is that follow-up.

## Decision

- A `billing_accounts` control-plane table (Postgres, `finops` schema) registers every
  billing data source: `provider` enum (`aws`/`azure`/`gcp`, only `aws` implemented so
  far), `source_config` jsonb (provider-specific — `{ bucket, key, region }` for AWS),
  `credential_ref`, `focus_version`, `enabled`, and pull-status fields
  (`last_ingested_at`, `last_rows_inserted`). A placeholder `tenant_id` (plain integer,
  default `1`, no FK yet) is included ahead of issue #8's tenant model so that issue
  won't need a follow-up migration under `synchronize`.
- `POST /billing/ingest` (raw bucket/key) is removed. Ingestion goes through
  `POST /billing-accounts/:id/pull`, which resolves bucket/key/region from the row.
- **The row holds a credential *reference*, never the secret** — `credential_ref` is an
  Infisical path (e.g. `/aws/finops/<account>-s3-reader`). This extends ADR-0003's
  control-plane-vs-secrets-store split down to the per-account level.
- **Per-account credentials resolve at pull time, not startup.** This is the first
  exception to ADR-0004's "boot-time-only Infisical dependency": `CredentialResolverService`
  (`src/billing-accounts/credential-resolver.service.ts`) fetches `access_key_id` /
  `secret_access_key` from Infisical at the account's `credential_ref` path when a pull
  runs, TTL-caches the result (5 min) in memory, and reuses the same authenticated
  Infisical client the startup fetch already established
  (`src/config/infisical-client.ts`). DB credentials and other startup config are
  unaffected — they keep the ADR-0004 startup-fetch pattern; only billing-source
  credentials move to runtime resolution, scoped narrowly because they're inherently
  per-row rather than singleton.
- Accounts without a `credential_ref` fall back to the existing global AWS identity
  (`/aws/finops/billing-s3-reader`, still startup-fetched) — the pre-#16 behavior is
  preserved as a default, not replaced.
- `source_config` uses single object `key` (same granularity as the pre-#16 ingest
  endpoint), not a `prefix` + `ListObjectsV2` listing. Issue #16 left this as an
  explicitly open/deferred decision; multi-object pulls are a follow-up, not built here.

## Consequences

**Positive**
- Different S3 buckets (and eventually Azure/GCP sources) are added via configuration
  (`POST /billing-accounts`), not code changes or redeploys.
- Each account can carry its own AWS identity, least-privilege-scoped to its bucket.
- Control-plane rows never contain secret material — only pointers — consistent with
  ADR-0003.

**Negative / trade-offs**
- Introduces a **runtime** dependency on Infisical for accounts using `credential_ref`
  (mitigated by the TTL cache and the global-identity fallback — a pull for such an
  account degrades to using the global identity rather than failing outright if the
  fallback path is reachable, but a first, uncached resolution still requires Infisical
  to be reachable).
- `tenant_id` is a placeholder column with no FK or enforcement; issue #8 may need to
  revisit its type/constraints once the real tenant model exists.
- Multi-object (`prefix`) ingestion per account is not yet supported.

**Follow-ups**
- Issue #8: give `tenant_id` a real FK once the tenant model lands.
- Issue #10: once migrations replace `synchronize`, the `billing_accounts` table (and any
  future `tenant_id` FK/constraint change) needs an explicit migration.
- Consider `prefix` + `ListObjectsV2` support if a source needs multiple objects per pull.
