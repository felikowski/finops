## Why

Two security reviews of the `feat/billing-accounts-per-customer` branch, `main`, and the released
`v0.1.0` tag found real gaps between what's authenticated and what's actually authorized or
isolated. Issue #61 is a narrower, code-level review (DuckLake dedup crossing customer boundaries,
a provisioning race, incomplete request validation, open CORS, silently orphaned legacy rows).
Issue #62 is a broader static review of the application, deployment workflows, and VPS
documentation, finding that **the released code (`main`/`v0.1.0`) enforces no tenant authorization
at all** (any authenticated user can list/create/pull/read any billing account), a
confused-deputy credential path (`credentialRef` is caller-supplied and used server-side against
Infisical), an unbounded ingestion DoS surface, shared-root SSH deploy access, undocumented
Postgres network/TLS posture, known dependency advisories, and incomplete CI/CD supply-chain and
container hardening. This proposal tracks the combined remediation.

## What Changes

Grouped by the reviews' own priority tiers:

**P0 — before allowing multiple untrusted users:**
- Keep Auth0 signup disabled/invite-only until deployed tenant authorization exists.
- Land, test, and deploy customer scoping (tracked by `implement-multi-tenant-isolation` and
  `manage-customer-memberships-and-roles`) before it reaches `main`/a release.
- Include the owning billing account in DuckLake's dedup/merge identity so cross-account imports
  cannot reassign a line item.
- Remove caller control over `credentialRef`; bind approved credentials/S3 locations to a specific
  account server-side; remove the global AWS fallback for tenant-created accounts; reject glob
  patterns in S3 keys.
- Put ingestion execution behind a bounded queue with quotas, per-account concurrency control,
  timeouts, and memory/resource limits.
- Replace shared-root deployment SSH access with constrained, environment-scoped deployment
  identities.
- Verify and document PostgreSQL's listener, firewall, `pg_hba.conf`, and TLS configuration.

**P1 — production hardening:**
- Require explicit organization/application membership for Auth0, not just disabled signup.
- Run migrations as `finops_owner` in a separate deploy step; run the app as `finops_app`.
- Remediate reachable production dependency advisories.
- Install a global validation pipe with unknown-field rejection; add API rate limiting; restrict
  production CORS origins; add Helmet with a tested CSP/security-header policy.
- Pin SSH host keys, GitHub Actions, and container base images to immutable digests; sign and
  verify images before deploy.
- Add container filesystem/capability/privilege/resource/PID/logging controls.
- Provide a read-only DBeaver/BI credential path; set local secret files to `0600`.

**P2 — VPS operations and resilience** (documentation/runbooks; some items overlap with
`harden-deploy-and-backup-reliability`, #47, which owns pipeline-level reliability specifically):
- Document/test Postgres and DuckLake/S3 backup-restore and disaster recovery.
- Document patching, firewall/SSH/`pg_hba.conf` hardening, monitoring/alerting, log retention,
  incident response, and credential rotation.
- Reassess whether staging, production, secrets, and databases should remain on one host.

## Capabilities

### New Capabilities
- `platform-security-hardening`: the authorization, credential-boundary, ingestion-safety,
  deployment-access, and infrastructure-hardening requirements raised by the #61/#62 reviews.

## Impact

- Backend: `ducklake/`, `billing-accounts/`, `customers/`, `main.ts` (CORS/Helmet/validation
  pipe/rate limiting), migration execution path.
- Deployment: SSH key provisioning per environment, GitHub Actions/base image pinning, image
  signing, container Compose hardening.
- Infrastructure: Postgres network/TLS posture, DuckLake/S3 backup-restore runbooks.
- Depends on / blocks `implement-multi-tenant-isolation` (#8) and
  `manage-customer-memberships-and-roles` (#63) for the P0 authorization item; relates to
  `harden-secret-zero` (#3/#17) and `harden-deploy-and-backup-reliability` (#47).
