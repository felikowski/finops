## 1. P0 — before allowing multiple untrusted users

- [ ] 1.1 Keep Auth0 signup disabled/invite-only until deployed tenant authorization exists
- [ ] 1.2 Merge, release, and deploy customer scoping (depends on `implement-multi-tenant-isolation` and `manage-customer-memberships-and-roles`)
- [ ] 1.3 Include `sourceBillingAccountId` in the DuckLake `lineItemKey`/`MERGE` match condition
- [ ] 1.4 Add tests covering same-account dedup idempotency and cross-account/customer isolation
- [ ] 1.5 Remove `credentialRef` from the public billing-account DTO; bind credential identity and S3 location to the account server-side
- [ ] 1.6 Remove the global AWS fallback identity for tenant-created accounts
- [ ] 1.7 Validate exact S3 object keys; reject glob patterns
- [ ] 1.8 Put pull execution behind a bounded queue: per-customer quota, per-account concurrency lock, execution timeout, explicit DuckDB memory limit, container CPU/memory/PID limits
- [ ] 1.9 Replace shared-root SSH deploy access with a constrained, per-environment deployment identity
- [ ] 1.10 Verify and document Postgres listener exposure, firewall rules, `pg_hba.conf`, and TLS policy

## 2. P1 — production hardening

- [ ] 2.1 Require explicit organization/application membership in Auth0 (or via `manage-customer-memberships-and-roles`), not just disabled signup
- [ ] 2.2 Run migrations as `finops_owner` in a separate deploy step; run the app as `finops_app`
- [ ] 2.3 Remediate reachable advisories from `pnpm audit --prod` (multer, brace-expansion, @nestjs/core, typeorm, file-type, uuid, qs, body-parser)
- [ ] 2.4 Install a global Nest validation pipe with unknown-field rejection; add runtime validation decorators to `CreateBillingAccountDto`
- [ ] 2.5 Add API rate limiting
- [ ] 2.6 Restrict production CORS to explicitly configured frontend origins
- [ ] 2.7 Add Helmet middleware with a tested CSP/security-header policy; add CSP/HSTS/Permissions-Policy headers in nginx
- [ ] 2.8 Pin SSH host keys instead of accepting live `ssh-keyscan` output during deploy
- [ ] 2.9 Pin GitHub Actions and container base images to immutable digests/SHAs instead of mutable tags
- [ ] 2.10 Sign container images and verify signatures/digests before deployment
- [ ] 2.11 Add container filesystem read-only mode, dropped capabilities, `no-new-privileges`, resource/PID limits, and log rotation to Compose files
- [ ] 2.12 Create a read-only DuckLake/BI credential path for DBeaver access, replacing the owner-credential runbook
- [ ] 2.13 Set local secret-zero file permissions to `0600`
- [ ] 2.14 Minimize infrastructure metadata (bucket names, object keys, credential paths) leaked in pull error responses and pull history

## 3. P2 — VPS operations and resilience (some overlap with `harden-deploy-and-backup-reliability`)

- [ ] 3.1 Document and test PostgreSQL backup/restore
- [ ] 3.2 Document DuckLake catalog/S3 recovery and snapshot cleanup (also tracked in `implement-billing-analytics-store`)
- [ ] 3.3 Document patching/upgrade procedures for host and shared services
- [ ] 3.4 Add monitoring/alerting for capacity, service health, TLS expiry, and backup failures
- [ ] 3.5 Add log retention and security-audit guidance
- [ ] 3.6 Add incident-response and credential-rotation runbooks
- [ ] 3.7 Define a VPS rebuild/disaster-recovery procedure
- [ ] 3.8 Reassess whether staging, production, secrets management, and databases should remain on one shared host
- [ ] 3.9 Detect and document how to assign legacy `billing_accounts` rows with `customerId IS NULL`
