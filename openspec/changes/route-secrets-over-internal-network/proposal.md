## Why

The backend and self-hosted Infisical run as separate Docker Compose stacks on the same VPS with no
shared Docker network, so the backend currently reaches Infisical via its **public URL** — a
hairpin (container → bridge → host → public IP/reverse proxy → back into Infisical) even though
both containers live on the same machine. Traffic is TLS-encrypted so this is acceptable as an
interim measure, but it depends on the public reverse proxy being up, exposes the app↔secrets path
on the public interface, and adds a public round-trip per fetch. Tracked by issue #11.

## What Changes

- Create a shared external Docker network (`finops-shared`) and attach both the backend and
  Infisical stacks to it, alongside their existing default networks.
- The backend resolves Infisical by its internal Docker service name (e.g. `http://infisical:8080`)
  instead of the public HTTPS URL.
- Infisical's port no longer needs to be published publicly for the backend's own consumption (its
  web UI can remain reachable separately, e.g. still behind Traefik).

## Capabilities

### Modified Capabilities
- `secrets-management`: the machine-identity fetch now resolves Infisical over an internal Docker
  network path instead of the public URL.

## Impact

- `docker-compose.yml` for both the backend deployment and the Infisical stack on the VPS.
- The `INFISICAL_URL`-equivalent bootstrap variable used by `secrets.bootstrap.ts` for
  `SECRETS_SOURCE=infisical` boots on the VPS.
