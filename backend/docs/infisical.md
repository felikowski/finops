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
```

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

## Machine-identity permissions

The identity must have **read** access to the paths above in the environments it serves.
Keep it least-privilege — do not grant org-wide or write access. Use a **separate identity
per environment** so a leaked dev credential cannot read prod. (See issue #17.)