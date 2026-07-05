# 2. Dedicated `finops` schema with least-privilege roles

- **Status:** Accepted
- **Date:** 2026-07-05 (recorded retroactively)
- **Related:** ADR-0001, issues #10, #12

## Context

Running the app against Postgres as a superuser or in the `public` schema is convenient but
unsafe: a compromised app could read/alter anything, and there's no separation between
schema ownership (DDL) and runtime data access (CRUD). We want least-privilege access from
the start, while `synchronize: true` (TypeORM auto-schema) is still in use during early
development.

## Decision

- Use a dedicated schema **`finops`** (TypeORM `schema: 'finops'` via `DB_SCHEMA`); the app
  writes there, not to `public`.
- Define two roles:
  - **`finops_owner`** — owns the schema and holds DDL rights.
  - **`finops_app`** — runtime CRUD only, no DDL.
- Lock down the `public` schema; keep the `postgres` superuser local-only.
- The app connects as **`finops_owner` for now**, because `synchronize: true` needs DDL.

## Consequences

**Positive**
- Clear separation of DDL vs. runtime privileges; smaller blast radius for the runtime role.
- `public` lockdown and local-only superuser reduce exposure.

**Negative / trade-offs**
- The app runs as `finops_owner` (broad DDL rights) until schema management stops relying on
  `synchronize` — so the least-privilege benefit isn't fully realized yet.
- Entity `id` uses `uuid_generate_v4()` (uuid-ossp, installed in `public`), so `finops_app`
  will need `USAGE` on `public` — or the app should move to built-in `gen_random_uuid()`.

**Follow-ups**
- Issue #10: replace `synchronize` with explicit migrations, then switch the app's runtime
  connection to **`finops_app`**.
- Issue #12: finalize role/database/least-privilege setup.
