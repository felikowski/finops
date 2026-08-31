## Purpose
Close the gaps between "authenticated" and "authorized/isolated" found by the #61/#62 security reviews, across application authorization, credential boundaries, ingestion safety, deployment access, and infrastructure exposure — so the app is safe to run with multiple untrusted tenants.

## ADDED Requirements

### Requirement: Tenant authorization is enforced before multi-tenant rollout
Released and deployed code SHALL NOT allow an authenticated user to list, create, pull, or read another customer's billing accounts or reporting data.

#### Scenario: Released code today
- **WHEN** the currently released version (`v0.1.0`/`main`, prior to this change) is evaluated
- **THEN** it is known to lack this enforcement — this requirement is not satisfied until customer scoping (`implement-multi-tenant-isolation`) ships to `main` and a release

#### Scenario: After remediation
- **WHEN** an authenticated user of customer A calls any billing-account or reporting endpoint with an id belonging to customer B
- **THEN** the request is rejected, and Auth0 signup remains disabled/invite-only until this holds in production

### Requirement: DuckLake deduplication is scoped by billing-account identity
The `MERGE INTO` match condition and line-item key SHALL include the owning billing account's identity, not only FOCUS natural-key fields, so two accounts importing the same underlying provider record never overwrite each other's row.

#### Scenario: Two accounts import an overlapping provider line item
- **WHEN** billing account X and billing account Y (potentially different customers) each import a line item with identical FOCUS fields
- **THEN** two independently-owned rows result, one per account — neither overwrites or reassigns the other's `sourceBillingAccountId`

#### Scenario: Re-importing the same account's data
- **WHEN** the same billing account's source file is re-pulled unchanged
- **THEN** dedup remains idempotent — no duplicate rows are created for that account

### Requirement: Credential paths are bound server-side, never caller-selected
The system SHALL NOT accept a caller-supplied Infisical path (or equivalent credential reference) that is later used server-side to fetch secrets; credential identity SHALL be bound to a billing account by an administrator action, not by request payload.

#### Scenario: Creating a billing account
- **WHEN** a caller submits a new billing account
- **THEN** the request body cannot specify which Infisical credential path the backend will use; that binding is established separately, server-side

#### Scenario: No global fallback for tenant-created accounts
- **WHEN** a tenant-created billing account has no explicitly bound credential
- **THEN** the pull fails closed rather than silently using a shared global AWS identity

### Requirement: Bounded and rate-limited ingestion execution
Ingestion pulls SHALL be subject to a per-customer quota, a per-account concurrency lock, an execution timeout, an explicit DuckDB memory limit, and container-level CPU/memory/PID limits; source object references SHALL be validated as exact keys, rejecting glob patterns.

#### Scenario: Rapid repeated pull requests
- **WHEN** a caller triggers many pulls for the same account in quick succession
- **THEN** requests beyond the concurrency/quota limit are rejected rather than queued unboundedly or run concurrently against the same account

#### Scenario: A glob-like S3 key
- **WHEN** a billing account's `sourceConfig.key` contains a wildcard character
- **THEN** the pull is rejected rather than passed through to DuckDB's `read_csv`, which would expand it into a multi-object scan

### Requirement: Race-safe customer provisioning
First-login customer/user provisioning SHALL handle concurrent requests for the same identity without surfacing a unique-constraint database error to the caller.

#### Scenario: Two concurrent first requests
- **WHEN** two requests for the same previously-unseen identity arrive concurrently
- **THEN** exactly one provisioning succeeds and the other resolves to the same resulting record, with neither request receiving a raw database error

### Requirement: Global request validation
The backend SHALL install a global validation strategy that rejects malformed payloads and unknown fields on every endpoint, including billing-account creation (name, provider, source configuration, credential reference, FOCUS version, field types, and length limits).

#### Scenario: Payload with an unexpected field
- **WHEN** a request body includes a field not defined on the target DTO
- **THEN** the request is rejected rather than silently ignoring the extra field

#### Scenario: Malformed billing-account payload
- **WHEN** `sourceConfig`, `provider`, or `focusVersion` fails its declared shape/type/length constraints
- **THEN** the request is rejected with a `400` naming the invalid field

### Requirement: Restrictive CORS and baseline HTTP hardening
Production SHALL restrict CORS to explicitly configured frontend origins (never accept every origin), and SHALL apply baseline HTTP security middleware (Helmet-equivalent headers, a tested CSP) and API rate limiting.

#### Scenario: A request from an unlisted origin
- **WHEN** a browser request in production originates from an origin not in the configured allowlist
- **THEN** the CORS policy rejects it

#### Scenario: Response headers
- **WHEN** any API or frontend response is inspected in production
- **THEN** it carries a CSP and standard security headers rather than defaults with none set

### Requirement: Legacy unowned resources are detected and resolved
The system SHALL provide a documented detection/backfill procedure for pre-existing rows left with a null owner (e.g. `billing_accounts.customerId IS NULL`) by a scoping migration, rather than letting them silently disappear from customer-scoped queries.

#### Scenario: Running the detection procedure
- **WHEN** an operator runs the documented procedure after a scoping migration
- **THEN** every unowned row is listed and can be explicitly assigned to a customer or deliberately archived

### Requirement: Least-privilege, environment-separated deployment access
Deployment SHALL use a constrained, per-environment deployment identity rather than shared root SSH access across staging and production on the same host.

#### Scenario: A staging deployment credential is compromised
- **WHEN** the staging deployment SSH key/identity is compromised
- **THEN** it does not grant host-level control over production, Postgres, the DuckLake catalog, Infisical, Traefik, or n8n

### Requirement: Verified database network exposure and transport security
PostgreSQL's network exposure, firewall rules, `pg_hba.conf`, and TLS posture SHALL be explicitly verified and documented, not left implicit.

#### Scenario: Auditing database exposure
- **WHEN** the database's network configuration is reviewed
- **THEN** documentation states whether the port is firewalled/IP-allowlisted, whether TLS is required, whether `pg_hba.conf` rejects arbitrary internet clients, and whether app traffic stays on an internal Docker network

### Requirement: Runtime database role is least-privilege
The running application SHALL connect as the least-privilege `finops_app` role at runtime; schema migrations SHALL run as `finops_owner` only in a separate, deliberate deployment step.

#### Scenario: Normal application startup
- **WHEN** the backend boots in a steady-state deployment (no pending migration)
- **THEN** its runtime database connection uses `finops_app`, which has no DDL capability

### Requirement: Dependency and supply-chain integrity
Production dependencies SHALL have no unremediated reachable known-vulnerability advisories, and CI/CD SHALL pin GitHub Actions and container base images to immutable digests, deploying only signed, verified images.

#### Scenario: A new high-severity advisory is published
- **WHEN** `pnpm audit --prod` reports a new high-severity advisory reachable from production code
- **THEN** it is remediated (upgrade or documented mitigation) rather than left indefinitely

#### Scenario: Deploying an image
- **WHEN** a release is deployed to production
- **THEN** the deployed image's digest is verified/signed, not merely a mutable semver tag pulled at deploy time

### Requirement: Container runtime hardening
Deployed containers SHALL run with a read-only root filesystem where practical, dropped Linux capabilities, `no-new-privileges`, and explicit resource/PID limits.

#### Scenario: Inspecting a running container's security context
- **WHEN** a deployed backend or frontend container is inspected
- **THEN** it runs as non-root, without excess Linux capabilities, and with resource/PID limits set — not the container engine's permissive defaults

### Requirement: Minimized credential exposure in developer tooling and error responses
Developer/BI tooling SHALL use read-only, scoped credentials rather than catalog-owner or bucket-write/delete identities, error responses and persisted pull history SHALL avoid disclosing internal infrastructure metadata, and local secret-zero files SHALL be permission-restricted to the owning user only.

#### Scenario: Setting up local DuckLake/BI access
- **WHEN** a developer configures DBeaver (or similar) against the DuckLake catalog
- **THEN** they are given a read-only role/identity, never the catalog-owner or write/delete-capable S3 credentials

#### Scenario: A pull fails
- **WHEN** an ingestion pull fails and the error is surfaced to the caller or persisted in pull history
- **THEN** internal details (bucket names, object keys, credential-reference paths) are minimized/sanitized rather than passed through verbatim

#### Scenario: Local secret file permissions
- **WHEN** `backend/.env` (or any file holding the Infisical machine-identity secret) is inspected on a developer machine
- **THEN** its permissions are `0600`, not group/world-readable
