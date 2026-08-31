## Why

The deploy pipeline (`release-pipeline`/`staging-deployment`/`production-promotion`) and the
nightly backup pipeline (n8n + Postgres → Google Drive, GPG-encrypted, set up outside issue
tracking) both work end-to-end, but neither is resilient to failure modes that actually happen: a
hung SSH session, a transient registry timeout, a container that starts but never becomes healthy,
or a cron job that silently stops working. All of these fail *quietly* today — the only way to
notice is to happen to check the Actions tab or SSH into the VPS and read a log by hand. As real
production traffic starts flowing, a silent deploy or backup failure gets more expensive over time.
Tracked by issue #47. Explicitly out of scope: full infra-as-code/one-command VPS bootstrap
(Terraform/Ansible) — the current hand-provisioned VPS setup is a known gap, not addressed here.

## What Changes

- Add a post-deploy smoke test to `deploy-staging.yml`/`deploy-prod.yml` (poll `/config.json` and
  `/api/*` behind the relevant Traefik hostname with retry/backoff in a bounded window) so the job
  fails if the stack doesn't come up healthy.
- Add explicit `timeout-minutes` and retry/backoff around SSH and `docker compose pull` steps in
  both deploy workflows.
- Document and verify a rollback path for prod (re-run promote with the previous version tag) and
  decide/document one for staging (which tracks the mutable `:main` tag).
- Add a failure notification for a failed prod deploy beyond "check the Actions tab" (e.g. reusing
  existing SMTP credentials).
- Extend `ci.yml` to actually boot the stack with dummy secrets and hit health endpoints, not just
  validate `docker compose config`.
- Add failure alerting to the backup scripts (`backup-n8n.sh`, `backup-postgres.sh`) and an
  automated integrity check (non-empty, GPG-decryptable) immediately after upload.

## Capabilities

### New Capabilities
- `deployment-reliability`: post-deploy health verification, bounded/retried deploy steps,
  documented rollback paths, failure notifications, and backup integrity checks.

### Modified Capabilities
- `staging-deployment`: gains a post-deploy health check, timeout, and retry/backoff.
- `production-promotion`: gains a post-deploy health check, timeout, retry/backoff, rollback
  documentation, and failure notification.

## Impact

- `.github/workflows/deploy-staging.yml`, `deploy-prod.yml`, `ci.yml`.
- VPS-resident `backup-n8n.sh`, `backup-postgres.sh`, and their cron entries.
- README/runbook documentation for rollback procedures.
