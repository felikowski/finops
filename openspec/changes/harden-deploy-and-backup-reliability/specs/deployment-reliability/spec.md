## Purpose
Make deploy and backup failures visible and bounded instead of silent, so a hung SSH session, a crash-looping container, or a broken cron job is caught within minutes or days, not discovered by accident.

## ADDED Requirements

### Requirement: Post-deploy health verification
Every deploy workflow SHALL poll the deployed stack's health/config and API endpoints with retry/backoff in a bounded window after `docker compose up -d`, and SHALL fail the job if the stack does not become healthy within that window.

#### Scenario: A deploy starts containers that crash-loop
- **WHEN** `docker compose up -d` exits 0 but the containers crash-loop afterward
- **THEN** the deploy job's post-deploy health check fails, and the workflow run is marked failed

### Requirement: Bounded, retried deploy steps
Deploy jobs SHALL declare explicit `timeout-minutes` and SHALL retry transient SSH/registry-pull failures with backoff rather than failing outright on the first blip.

#### Scenario: A hung SSH session
- **WHEN** an SSH connection during deploy hangs
- **THEN** the job fails within its configured timeout rather than running until GitHub's default job cap

#### Scenario: A transient registry timeout
- **WHEN** `docker compose pull` fails once due to a transient network blip
- **THEN** the step retries with backoff before failing the job

### Requirement: Documented rollback path
A rollback procedure SHALL be documented and verified for production, and a rollback approach SHALL be decided and documented for staging.

#### Scenario: A bad production deploy needs reverting
- **WHEN** a production deploy is found to be bad shortly after release
- **THEN** an operator can follow the documented rollback procedure (re-promote the previous version tag) without improvising

### Requirement: Failure notification beyond the Actions tab
A failed production deploy SHALL produce a notification visible outside GitHub's Actions UI.

#### Scenario: A production deploy fails
- **WHEN** `deploy-prod.yml` fails for any reason
- **THEN** a notification (e.g. email) is sent, not just a red X in the Actions tab

### Requirement: CI boots the stack, not just validates its config
CI SHALL boot the Docker Compose stack with dummy secrets and verify health endpoints respond, in addition to validating `docker compose config`.

#### Scenario: A PR introduces a missing required env var
- **WHEN** a PR changes configuration in a way that would break container startup (missing env var, broken healthcheck)
- **THEN** CI catches it by actually booting the stack, before merge

### Requirement: Backup failures are visible and verified
Backup scripts SHALL emit a failure signal reachable outside the VPS's own log files, and SHALL verify each upload is non-empty and successfully GPG-decryptable immediately after upload.

#### Scenario: A nightly backup silently breaks
- **WHEN** `backup-n8n.sh` or `backup-postgres.sh` fails
- **THEN** a signal (failure email or heartbeat/dead-man's-switch) is produced, and the failure is detectable within days, not months

#### Scenario: A backup uploads a corrupted file
- **WHEN** a backup archive is uploaded but is empty or fails GPG decryption
- **THEN** the integrity check run immediately after upload detects and flags it
