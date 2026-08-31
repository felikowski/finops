# secrets-management Specification

## Purpose
Fetch database, AWS, and other runtime secrets from a managed secrets store at boot instead of keeping them in plaintext `.env` files, while keeping local development simple.

## Requirements

### Requirement: Pluggable secrets source
The backend SHALL support a `SECRETS_SOURCE` switch read before the Nest application is constructed: `local` (default) loads `backend/.env` via `@nestjs/config`; `infisical` authenticates to a self-hosted Infisical instance and injects fetched values into `process.env` before config is read.

#### Scenario: Local development
- **WHEN** `SECRETS_SOURCE` is unset or `local`
- **THEN** the app reads configuration exclusively from `backend/.env`, with no Infisical dependency

#### Scenario: Remote/deployed boot
- **WHEN** `SECRETS_SOURCE=infisical` and the five bootstrap `INFISICAL_*` variables are present in the environment
- **THEN** the app authenticates via Infisical Universal Auth (machine identity), fetches the explicit `MANAGED_ENV` list of secrets, and populates `process.env` with them before `ConfigService` is built

### Requirement: Explicit managed-secret list, not a wildcard dump
The Infisical fetch path SHALL request an explicit, named list of secret path+key → env var mappings (`MANAGED_ENV`) rather than dumping every secret the machine identity can see.

#### Scenario: A secret not in MANAGED_ENV exists in the vault
- **WHEN** Infisical holds a secret at a path not listed in `MANAGED_ENV`
- **THEN** that secret is never fetched or exposed to the running process

### Requirement: Startup-only fetch
Secret fetching from Infisical SHALL happen once at process startup, not per-request, so Infisical is a boot-time dependency only.

#### Scenario: Infisical is unreachable after successful boot
- **WHEN** the backend has already started successfully with `SECRETS_SOURCE=infisical`
- **THEN** a later Infisical outage does not affect already-established database connections or already-loaded config values
