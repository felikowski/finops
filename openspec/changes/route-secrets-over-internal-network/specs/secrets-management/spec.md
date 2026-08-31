## ADDED Requirements

### Requirement: Internal network path to the secrets store
When the backend and Infisical run on the same host, the backend SHALL reach Infisical over a shared internal Docker network by service name, not over Infisical's public URL.

#### Scenario: Backend and Infisical on the same VPS
- **WHEN** the backend fetches secrets with `SECRETS_SOURCE=infisical`
- **THEN** the request is resolved over the shared `finops-shared` Docker network to Infisical's internal service name, and never leaves the Docker bridge

#### Scenario: Public reverse proxy is down
- **WHEN** the public Traefik reverse proxy in front of Infisical is unreachable
- **THEN** the backend's secret fetch still succeeds, because it does not depend on the public route
