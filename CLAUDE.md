# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

```
finops/
├── backend/   # NestJS + TypeORM (SQLite) — runs on port 3000
└── frontend/  # Angular app
```

## Commands

Run all commands from the respective subfolder.

**Backend (`cd backend`):**
```bash
npm run start:dev   # Run in development mode (ts-node, no compile step)
npm run build       # Compile TypeScript → dist/
npm run start       # Run compiled production build
```

**Frontend (`cd frontend`):**
```bash
npm start           # Start Angular dev server
npm run build       # Build for production
```

No test or lint commands are currently configured for the backend.

## Architecture

### Backend

Minimal NestJS app with TypeORM (SQLite). The app listens on port 3000.

**Module structure:**
- `backend/src/main.ts` — bootstraps the app
- `backend/src/app.module.ts` — root module; configures TypeORM with SQLite (`data/finops.sqlite`, `synchronize: true`, `autoLoadEntities: true`)
- `backend/src/app.controller.ts` / `backend/src/app.service.ts` — single `GET /` endpoint returning a greeting

**Database:** SQLite file at `backend/data/finops.sqlite`. Schema is auto-synced from entities at startup (`synchronize: true`). New entities must be decorated with `@Entity()` and registered in a module using `TypeOrmModule.forFeature([...])` — they are picked up automatically via `autoLoadEntities`.

**Adding features:** Follow NestJS module pattern — create a dedicated module (e.g., `backend/src/costs/costs.module.ts`) with its own controller, service, and entity, then import the module in `AppModule`.

### Frontend

Angular app scaffolded with Angular CLI 21. Source lives in `frontend/src/`.