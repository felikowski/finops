# production-promotion Specification

## Purpose
Let a human deliberately promote a specific, already-released version to production — never an arbitrary commit — behind a required-approval gate.

## Requirements

### Requirement: Version-pinned, manually triggered deploy
Production deploys SHALL only be triggerable manually (`workflow_dispatch`) with a semver `version` input identifying an already-published release; there SHALL be no path to deploy an arbitrary commit SHA to production.

#### Scenario: Dispatching a production deploy
- **WHEN** a maintainer runs `deploy-prod.yml` with `version: 0.1.0`
- **THEN** the workflow verifies both `finops-backend:0.1.0` and `finops-frontend:0.1.0` exist in GHCR, fails loudly if either is missing, and otherwise deploys them pinned via `IMAGE_TAG`

### Requirement: Required-reviewer approval gate
The production deploy SHALL run under a GitHub Environment (`production`) that requires an approving reviewer before the job executes.

#### Scenario: Triggering a production deploy
- **WHEN** `deploy-prod.yml` is dispatched
- **THEN** the job pauses for approval from a designated required reviewer before it runs any deployment steps

### Requirement: Isolated production deployment credentials
Production deployment SHALL use its own dedicated SSH keypair and its own VPS-resident secret-zero file, separate from staging's and from the human debug key.

#### Scenario: A staging credential leaks
- **WHEN** the staging deploy SSH key is compromised
- **THEN** production deployment is unaffected, since it authenticates with a different, dedicated keypair
