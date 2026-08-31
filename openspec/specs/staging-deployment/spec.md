# staging-deployment Specification

## Purpose
Continuously deploy every change that lands on `main` to a public staging environment, so the team can verify a build against real infrastructure before it is ever promoted to production.

## Requirements

### Requirement: Auto-deploy on successful image publish
The system SHALL deploy the newly published `:main` images to the staging environment automatically whenever `publish-images.yml` succeeds on `main`.

#### Scenario: A merge to main publishes successfully
- **WHEN** `publish-images.yml` completes successfully for a push to `main`
- **THEN** `deploy-staging.yml` fires via `workflow_run`, copies the staging compose file to the VPS, and runs `docker compose pull && up -d` under the `staging` GitHub Environment

### Requirement: Staging is publicly reachable behind TLS
Staging SHALL be exposed publicly behind the shared Traefik reverse proxy with a dedicated hostname and automatic TLS, distinct from any production router.

#### Scenario: Verifying a staging deploy
- **WHEN** the staging deploy completes
- **THEN** the staging hostname serves the app over HTTPS with a valid certificate, and its Traefik router/service name never collides with production's

### Requirement: Deploy touches only the deployment artifact, not the secret store
The deploy step SHALL copy only the compose file to the VPS and SHALL NOT touch the VPS-resident secret-zero file for that environment.

#### Scenario: Redeploying staging
- **WHEN** `deploy-staging.yml` runs
- **THEN** `/etc/finops/staging/infisical.env` on the VPS is left untouched by the deploy step
