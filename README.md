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

## Authentication (Auth0)

The app requires a logged-in user (issue #20) — the frontend redirects to login before showing
the billing-accounts UI, and the backend rejects unauthenticated requests to `/billing-accounts`
with 401. Both sides talk to the IdP through standard OIDC only (a generic OIDC client library
on the frontend, JWT/JWKS validation on the backend) — no Auth0-specific SDK or package — so
swapping the IdP later is a configuration change, not a rewrite. See
[ADR-0010](docs/adr/0010-auth0-oidc-provider.md) for the provider decision and
[issue #20](https://github.com/felikowski/finops/issues/20) for the full rationale/AC.

**One-time Auth0 dashboard setup** (per environment — dev/staging/prod each get their own tenant
or at least their own Application/API):

1. Create an Auth0 tenant if you don't have one yet.
2. **Application** → create a **Single Page Application**:
   - Allowed Callback URLs: `http://localhost:4200` (add your deployed frontend origin later)
   - Allowed Logout URLs: `http://localhost:4200`
   - Allowed Web Origins: `http://localhost:4200`
3. **APIs** → create an API (this becomes the `audience`), e.g. identifier `https://finops.api`.
   Signing algorithm RS256 (default).

**Environment variables** (`backend/.env` locally, `SECRETS_SOURCE=local`; see `.env.example`):

```
AUTH0_DOMAIN=your-tenant.eu.auth0.com   # no https://, no trailing slash
AUTH0_CLIENT_ID=<the SPA application's Client ID>
AUTH0_AUDIENCE=<the API identifier from step 3>
```

With `SECRETS_SOURCE=infisical`, these come from Infisical instead — `domain`/`client_id`/
`audience` at `/auth0` (see `backend/docs/infisical.md`), same pattern as the Postgres values.

The frontend never reads these directly — it fetches them at runtime from the backend's
`GET /config.json` (the same mechanism `apiBaseUrl` already uses), so there's nothing to bake
into the frontend image at build time.

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

## Container images

Images are **built once on `main` and promoted, never rebuilt** for a release. Three workflows
cover this:

- [`Publish container images`](.github/workflows/publish-images.yml) — every push to `main`
  builds both images and publishes them to GitHub Container Registry:
  - `ghcr.io/felikowski/finops-backend`
  - `ghcr.io/felikowski/finops-frontend`
- [`Cut a release`](.github/workflows/release.yml) — manual (`workflow_dispatch`, under the
  Actions tab). Give it a plain version like `1.4.0`; it tags `main`'s current tip as `v1.4.0`
  and pushes the tag. Because it's a normal git tag on the mainline, it already covers every
  commit merged before it — there's nothing else to "include".
- [`Promote release images`](.github/workflows/promote-release.yml) — reacts to the `v*` tag
  push above and copies the image already published for that commit's SHA to the release tags,
  via `docker buildx imagetools create` (a manifest copy, not a rebuild). Fails loudly if that
  commit's SHA was never built and published from `main` in the first place.

Pull requests build the same images (see [Continuous integration](#continuous-integration)) but
never push — publishing only happens on trusted `push`/tag events, so a fork's pull request can
never publish a package.

**Tags:**

- `sha-<full commit sha>` — immutable, published for every build from `main`
- `main` — always the latest build from the default branch
- `latest` — alias for the latest default-branch build
- `<semver>` / `<major>.<minor>` — published only by the release/promote flow above, pointing at
  the exact same image bytes as that commit's `sha-` tag

```bash
docker pull ghcr.io/felikowski/finops-backend:latest
docker run --rm -p 3000:3000 --env-file backend/.env ghcr.io/felikowski/finops-backend:latest
```

Both images are multi-arch (`linux/amd64`, `linux/arm64`) and ship an SBOM and build provenance
attestation, generated once at build time and attached to the image digest — release tags point
at that same digest, so they carry the same SBOM/provenance without a second build. Old/
unreferenced package versions are pruned per [#38](https://github.com/felikowski/finops/issues/38).
