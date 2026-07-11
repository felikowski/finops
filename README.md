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
