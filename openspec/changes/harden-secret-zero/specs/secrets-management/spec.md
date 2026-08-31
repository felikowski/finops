## ADDED Requirements

### Requirement: Least-privilege, environment-separated machine identities
The Infisical machine identity used to fetch managed secrets SHALL be scoped to only the secret paths and environments it needs, and a separate identity SHALL exist per deployment environment (dev, prod).

#### Scenario: Auditing identity scope
- **WHEN** the machine identity's project role is inspected
- **THEN** it grants access only to `/postgres/*` and `/aws/finops/*` (or narrower) and only to the environments that identity actually serves — never org-wide

#### Scenario: Prod secret isolation
- **WHEN** a developer's local machine is compromised
- **THEN** the prod machine identity's client secret is not exposed, because it was never present there

### Requirement: Network- and time-bounded credential
The machine identity's Universal Auth configuration SHALL restrict authentication to an IP allowlist and enforce a client-secret TTL with a documented rotation procedure.

#### Scenario: Auth attempt from an unexpected IP
- **WHEN** a request to authenticate the machine identity originates from an IP outside the allowlist
- **THEN** Infisical rejects the authentication attempt

#### Scenario: Secret rotation
- **WHEN** the client secret TTL expires or a leak is suspected
- **THEN** an operator follows the documented rotation procedure to issue a new secret and revoke the old one without unplanned downtime

### Requirement: Secret zero is never a file baked into an image
The production client secret SHALL be injected as an orchestrator-managed secret at deploy/run time, never committed, and never copied into a built container image; `.env` SHALL be excluded from all Docker build contexts.

#### Scenario: Building the production image
- **WHEN** the backend Docker image is built
- **THEN** no `.env` file or plaintext Infisical client secret is present in the resulting image layers, because `.env` is listed in `.dockerignore`
