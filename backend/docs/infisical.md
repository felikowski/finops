# Infisical vault structure

The backend can load its configuration and secrets from [Infisical](https://infisical.com)
instead of a local `.env` file. This document describes the **folder/key layout the
app expects** in Infisical, and how each value maps onto an environment variable.

The authoritative source is the `MANAGED_ENV` table in
[`src/config/secrets.bootstrap.ts`](../src/config/secrets.bootstrap.ts) — if the two
ever disagree, the code wins. Keep this doc in sync when you change that table.

## How loading works

- `SECRETS_SOURCE=local` (default) → the app reads `.env` as usual; Infisical is not touched.
- `SECRETS_SOURCE=infisical` (set by the `start:remote` / `start:dev:remote` scripts) →
  before Nest boots, `loadRemoteSecrets()` authenticates with a **machine identity**
  (Universal Auth) and fetches each entry in `MANAGED_ENV`, injecting it into
  `process.env`. `ConfigService` then reads those values exactly as if they came from `.env`.

Infisical is used as a **combined secret + config store**, so not every value below is
strictly secret (e.g. `host`/`port`/`database`/`schema` are plain config).

## Bootstrap variables ("secret zero") — NOT stored in Infisical

These are how the app *reaches* Infisical, so they cannot come from it. They must be
supplied by the environment (local `.env` in dev; injected container env vars in prod).
See [`.env.example`](../.env.example) for the local template.

| Env var | Purpose |
| --- | --- |
| `INFISICAL_SITE_URL` | Base URL of the Infisical instance |
| `INFISICAL_PROJECT_ID` | Project (workspace) UUID |
| `INFISICAL_ENVIRONMENT` | Environment **slug** (e.g. `dev` — not `development`) |
| `INFISICAL_CLIENT_ID` | Machine-identity client id |
| `INFISICAL_CLIENT_SECRET` | Machine-identity client secret |

> ⚠️ The client secret is the crown jewel — scope the identity tightly, IP-allowlist it,
> and rotate it. Hardening is tracked in issue #17.

## Required folder / key layout

Create the following in **each environment** you run against (currently only `dev`):

```
/postgres
├── host                 →  DB_HOST
├── port                 →  DB_PORT
├── database             →  DB_NAME
└── schema               →  DB_SCHEMA

/postgres/finops/finops_owner
├── user                 →  DB_USER
└── password             →  DB_PASSWORD

/aws/finops/billing-s3-reader
├── access_key_id        →  AWS_ACCESS_KEY_ID
└── secret_access_key    →  AWS_SECRET_ACCESS_KEY

/auth0
├── domain               →  AUTH0_DOMAIN
├── client_id            →  AUTH0_CLIENT_ID
└── audience             →  AUTH0_AUDIENCE

/postgres/ducklake
└── database             →  DUCKLAKE_DB_NAME

/postgres/ducklake/ducklake_owner
├── user                 →  DUCKLAKE_DB_USER
└── password             →  DUCKLAKE_DB_PASSWORD

/aws/finops/ducklake
├── access_key_id        →  DUCKLAKE_AWS_ACCESS_KEY_ID
├── secret_access_key    →  DUCKLAKE_AWS_SECRET_ACCESS_KEY
├── bucket               →  DUCKLAKE_S3_BUCKET
└── region               →  DUCKLAKE_S3_REGION
```

> `/postgres`'s `host`/`port` are also re-injected as `DUCKLAKE_DB_HOST`/`DUCKLAKE_DB_PORT` (same
> values, second env var name) — see the note on `/postgres/ducklake` below. The DuckLake catalog
> was provisioned in issue #49's first slice
> ([provisioning runbook](../../docs/runbooks/ducklake-catalog-provisioning.md)) and is now fully
> wired into `MANAGED_ENV`, used by `src/ducklake/ducklake-connection.service.ts`.

Additionally, each `billing_accounts` row may set its own `credentialRef` pointing at a
path with the same `access_key_id`/`secret_access_key` shape, e.g.:

```
/aws/finops/<account-name>-s3-reader
├── access_key_id        →  fetched at pull time, not startup
└── secret_access_key    →  fetched at pull time, not startup
```

These per-account paths are **not** part of `MANAGED_ENV` — they're resolved at runtime by
`CredentialResolverService` (`src/billing-accounts/credential-resolver.service.ts`), TTL-cached,
using the same authenticated Infisical client as the startup fetch. See ADR-0007.

### Notes on individual paths

- **`/postgres`** — connection info shared across all DB roles (not role-specific), so it
  lives at the top level rather than under a role folder.
- **`/postgres/finops/finops_owner`** — the app connects as `finops_owner` for now because
  `synchronize: true` needs DDL rights. It will switch to `/postgres/finops/finops_app`
  (CRUD-only) once explicit migrations replace `synchronize` (issue #10).
- **`/aws/finops/billing-s3-reader`** — read-only S3 credentials for billing ingestion.
  Since the `billing_accounts` registry (issue #16) landed, this is the **global fallback**
  identity, used only for accounts that don't set their own `credentialRef`. Region is no
  longer stored here — it's per-account (`source_config.region`).
- **`/auth0`** — Auth0 tenant config for human login (issue #20): domain, SPA client id, and
  API audience. Not secret (all three are visible in the JWT/login redirect anyway) but kept
  here for one consistent config source across environments, same as `/postgres`.
- **`/postgres/ducklake`** / **`/postgres/ducklake/ducklake_owner`** — the DuckLake catalog
  database (issue #49), a separate database on the **same** Postgres instance as `/postgres`
  (host/port are shared — re-read into `DUCKLAKE_DB_HOST`/`DUCKLAKE_DB_PORT`, deliberately
  separate env vars from `DB_HOST`/`DB_PORT` so DuckLake config doesn't mix with the TypeORM
  config). One role, not an owner/app split like `finops` — DuckLake's own
  `ATTACH ... (TYPE ducklake)` does catalog DDL on essentially every write, so the
  least-privilege split doesn't map cleanly here.
- **`/aws/finops/ducklake`** — credentials for the DuckLake Parquet data bucket
  (`finops-ducklake`, `eu-central-1`), scoped to that one bucket only. Separate from
  `/aws/finops/billing-s3-reader`, which is for reading *source* FOCUS exports, not DuckLake's
  own storage.

## Machine-identity permissions

The identity must have **read** access to the paths above in the environments it serves.
Keep it least-privilege — do not grant org-wide or write access. Use a **separate identity
per environment** so a leaked dev credential cannot read prod. (See issue #17.)