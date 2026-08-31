# dev-seed-data Specification

## Purpose
Provide repeatable, environment-aware fixture data for exercising the app locally or against a deployed database, without conflating fixtures with schema migrations or real tenant configuration.

## Requirements

### Requirement: Explicit, idempotent seed script
The system SHALL provide a seed script (`pnpm run seed:dev` / `seed:dev:remote`), invoked deliberately (never automatically at boot or via `migrationsRun`), that inserts a dev fixture billing account only if one does not already exist.

#### Scenario: First run
- **WHEN** the seed script runs against a database with no existing dev fixture
- **THEN** a "Dev Fixture (seed)" billing account is created

#### Scenario: Re-running the seed script
- **WHEN** the seed script runs again against a database that already has the fixture
- **THEN** it logs that the fixture already exists and makes no changes

### Requirement: Same secrets-loading path as the app
The seed script SHALL resolve its database connection through the same `SECRETS_SOURCE` mechanism as the main application (`local` vs `infisical`), so it can target either a local `.env`-configured database or a deployed one via `seed:dev:remote`.

#### Scenario: Seeding a remote environment
- **WHEN** `pnpm run seed:dev:remote` is invoked with the appropriate Infisical bootstrap variables set
- **THEN** the script fetches the same managed secrets the deployed app would use and seeds that database
