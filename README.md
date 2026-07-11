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
