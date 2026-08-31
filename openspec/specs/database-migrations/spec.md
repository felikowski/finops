# database-migrations Specification

## Purpose
Manage the Postgres schema for the control-plane database through explicit, versioned TypeORM migrations instead of runtime auto-sync, so schema changes are reviewable and safe to run against real data.

## Requirements

### Requirement: Explicit migrations replace synchronize
The system SHALL disable TypeORM's `synchronize` option in every environment and manage schema changes exclusively through versioned migration files under `backend/src/migrations/`.

#### Scenario: App boots without synchronize
- **WHEN** the backend starts against a Postgres database with `synchronize: false`
- **THEN** the schema is not auto-generated from entity metadata; it must already match a run migration

### Requirement: Migrations run automatically at boot
The system SHALL apply any pending migrations automatically on application startup (`migrationsRun: true`) before serving requests.

#### Scenario: New migration ships in a deploy
- **WHEN** a deploy includes a new migration file not yet applied to the target database
- **THEN** the migration runs during startup before the app begins accepting traffic, and the app fails to start if the migration fails
