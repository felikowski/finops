# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

```
finops/
├── backend/   # NestJS + TypeORM (SQLite) — runs on port 3000
└── frontend/  # Angular app
```

## Commands

This is a **pnpm workspace** (packages: `backend`, `frontend`). pnpm is provided via
corepack and pinned in the root `packageManager` field — run `corepack enable` once.
Run scripts from the repo root with `pnpm --filter <pkg>`, or `cd` into a package and
run `pnpm <script>`.

**Root:**
```bash
pnpm install        # Install all workspace dependencies (backend + frontend)
pnpm run db         # Start PostgreSQL via Docker (required before backend)
pnpm start          # Start backend + frontend concurrently
```

**Backend:**
```bash
pnpm --filter backend start:dev   # Run in development mode (ts-node, no compile step)
pnpm --filter backend build       # Compile TypeScript → dist/
pnpm --filter backend start       # Run compiled production build
```

**Frontend:**
```bash
pnpm --filter frontend start      # Start Angular dev server
pnpm --filter frontend build      # Build for production
```

No test or lint commands are currently configured for the backend.

## Architecture

### Backend

Minimal NestJS app with TypeORM (SQLite). The app listens on port 3000.

**Module structure:**
- `backend/src/main.ts` — bootstraps the app
- `backend/src/app.module.ts` — root module; configures TypeORM with SQLite (`data/finops.sqlite`, `synchronize: true`, `autoLoadEntities: true`)
- `backend/src/app.controller.ts` / `backend/src/app.service.ts` — single `GET /` endpoint returning a greeting

**Database:** PostgreSQL. Connection is configured via environment variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) with localhost defaults for development. See `backend/.env.example`. Run locally with `npm run db` from the root (starts Docker container). Schema is auto-synced from entities at startup (`synchronize: true`). New entities must be decorated with `@Entity()` and registered in a module using `TypeOrmModule.forFeature([...])` — they are picked up automatically via `autoLoadEntities`.

**Adding features:** Follow NestJS module pattern — create a dedicated module (e.g., `backend/src/costs/costs.module.ts`) with its own controller, service, and entity, then import the module in `AppModule`.

### Frontend

Angular app scaffolded with Angular CLI 21. Source lives in `frontend/src/`.

## GitHub conventions

Same bilingual convention `AGENTS.md` defines for Codex applies to Claude Code too (confirmed
with the user 2026-07-18, not just a Codex-specific rule):

- Write the body of every GitHub issue, and every issue/PR comment, in both English and German:
  English first, then a horizontal rule, then a `## Deutsche Fassung` heading with the German
  version.
- End every such comment/issue with this disclosure:

  > *This issue/comment was drafted and posted by Claude Code on behalf of the repository owner. / Dieses Issue/dieser Kommentar wurde von Claude Code im Auftrag des Repository-Inhabers verfasst und veröffentlicht.*

- Commits and PR titles follow Conventional Commits (`type(scope): description`), per
  `AGENTS.md` — already existing repo practice.