# postgres-hosting Specification

## Purpose
Provide the control-plane relational database for the FinOps app — app/tenant metadata, billing account registry, and (pre-DuckLake) billing line items — hosted with least-privilege role separation.

## Requirements

### Requirement: Self-hosted control-plane database
The system SHALL use a self-hosted PostgreSQL instance (Docker, on the project's Hostinger VPS) as the control-plane database, rather than a managed cloud database service.

#### Scenario: Backend connects to the VPS-hosted Postgres
- **WHEN** the backend starts with `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` pointing at the VPS Postgres container
- **THEN** the connection succeeds and the app serves requests against it

### Requirement: Dedicated schema and least-privilege roles
The database SHALL use a dedicated `finops` schema (not `public`) and separate `finops_owner` (DDL-capable) and `finops_app` (CRUD-only) roles, so runtime traffic never runs with schema-owner privileges longer than necessary.

#### Scenario: Runtime connection uses the app role after migrations replace synchronize
- **WHEN** schema migrations are applied via `finops_owner` in a deploy step
- **THEN** the running application connects and performs CRUD as `finops_app`, which has no DDL privileges

#### Scenario: Application writes land in the finops schema
- **WHEN** any entity is persisted via TypeORM
- **THEN** the corresponding table is created and read under the `finops` schema, not `public`
