## 1. Deploy workflow resilience

- [ ] 1.1 Add a post-deploy smoke test (poll `/config.json` + `/api/*` with retry/backoff in a bounded window) to `deploy-staging.yml`
- [ ] 1.2 Add the same post-deploy smoke test to `deploy-prod.yml`
- [ ] 1.3 Add explicit `timeout-minutes` at the job level to both workflows
- [ ] 1.4 Add retry/backoff around SSH and `docker compose pull` steps in both workflows

## 2. Rollback

- [ ] 2.1 Document and verify the prod rollback path (re-run promote with the previous version tag)
- [ ] 2.2 Decide and document staging's rollback approach (e.g. temporarily pin to the previous `sha-` tag, since staging tracks mutable `:main`)

## 3. Failure visibility

- [ ] 3.1 Add a failure notification for a failed production deploy (e.g. email via existing SMTP credentials)
- [ ] 3.2 Extend `ci.yml` to boot the stack with dummy secrets and hit health endpoints, not just validate `docker compose config`

## 4. Backup pipeline resilience

- [ ] 4.1 Add failure alerting to `backup-n8n.sh` and `backup-postgres.sh` (failure email or a dead-man's-switch/heartbeat ping)
- [ ] 4.2 Add an automated integrity check (non-empty, GPG-decryptable) immediately after each backup upload
- [ ] 4.3 Add a periodic (e.g. monthly) full restore-and-boot smoke test
