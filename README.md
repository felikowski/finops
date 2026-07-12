# finops

FinOps workspace with a NestJS backend and Angular frontend.

## Getting started

```bash
pnpm install
pnpm start
```

## Fully isolated local stack

Docker Compose runs the backend and the nginx-served frontend without using the
host's Node.js installation. The backend reads its Infisical bootstrap
credentials from `backend/.env`, then loads the PostgreSQL connection and other
managed values from Infisical:

```bash
pnpm docker:up
```

Open http://localhost:4200. The backend and its database-aware health check are
available at http://localhost:3000 and http://localhost:3000/health.

Stop the stack with `pnpm docker:down`.

## Database migrations

The backend uses TypeORM migrations, not schema auto-sync — `synchronize: false` in
`backend/src/app.module.ts`. Schema changes are committed as migration files under
`backend/src/migrations/` and applied explicitly.

A fresh database needs its schema built from migrations before (or via) starting the
backend:

```bash
pnpm --filter backend migration:run          # local DB (reads backend/.env directly)
pnpm --filter backend migration:run:remote   # SECRETS_SOURCE=infisical, e.g. a deployed DB
```

`migrationsRun: true` also means a normal backend boot applies any pending migrations
itself, so `migration:run` is mainly useful to apply/verify migrations without starting
the server (e.g. in CI/CD before a rollout).

Other commands, all run from `backend/`:

```bash
pnpm run migration:revert          # undo the last migration (local DB)
pnpm run migration:revert:remote   # undo the last migration (SECRETS_SOURCE=infisical)
pnpm run migration:generate src/migrations/<Name>   # diff entities vs. a local DB, local only
```

`migration:generate` needs a synchronously-configured `DataSource` (`backend/src/data-source.ts`),
which only reads plain env vars — it doesn't support `SECRETS_SOURCE=infisical`. Generate new
migrations against a local Postgres, commit the result, then apply it anywhere with
`migration:run` / `migration:run:remote`.

## Dev fixture data

`pnpm --filter backend seed:dev` (or `seed:dev:remote` for a Infisical-backed DB) inserts a single
`billing_accounts` fixture row, so you can exercise the accounts list / pull UI without
registering a real account by hand first. It's idempotent — running it again is a no-op if the
fixture already exists.

**Dev/local only.** Unlike migrations, this is never run automatically. Real billing accounts are
tenant configuration entered through the app itself (`POST /billing-accounts`), not deploy-time
fixtures — don't run this against prod.

## Continuous integration

Every pull request and every push to `main` runs the [`Pull request checks`](.github/workflows/ci.yml)
workflow, which builds the backend and frontend, runs the frontend test suite,
validates the Docker Compose configuration, and builds both container images —
all without any Infisical, database, or AWS credentials.

To block merges on a red or pending build, configure these as required status
checks under **Settings → Branches → Branch protection rules** for `main`:

- `Backend build and unit tests`
- `Frontend build and unit tests`
- `Compose config and container image builds`
