# 5. ELT push-down for billing ingestion; defer a Go worker

- **Status:** Accepted
- **Date:** 2026-07-05 (recorded retroactively)
- **Related:** issue #4, ADR-0001, ADR-0006

## Context

The current billing ingester pulls each CSV row into the Node/V8 heap (`mapRecord()` per row)
and inserts via TypeORM (`repo.insert(batch)`). This row-by-row, in-heap pattern is where
Node is weak at scale: a single JS thread, GC/object overhead, and no vectorization. As
billing volume grows this becomes the bottleneck. A polyglot split (NestJS control plane +
a dedicated Go ETL worker) was floated as the "performance" answer.

## Decision

- **Principle: ELT push-down, not app-layer ETL.** Stop transforming rows in the app layer;
  push the work into the engine (e.g. DuckDB `read_csv('s3://...')` + `COPY`) so rows never
  touch the JS heap. FOCUS normalization (renames, casts, coalesce, tag JSON) is almost
  entirely SQL-expressible.
- **No full Go rewrite.** Control-plane / CRUD / auth is where NestJS is productive. Use **Go
  for ETL only on a measured trigger** — transform logic DuckDB/SQL genuinely can't express,
  that is CPU-bound, at high volume (unlikely for FOCUS mapping). DuckDB is the actual
  performance engine and has a Node binding (`@duckdb/node-api`).
- Keep ETL behind a **job/worker boundary** so the worker implementation is swappable.

## Consequences

**Positive**
- Performance comes from the right engine (DuckDB/SQL, vectorized) rather than hand-written
  Node loops; avoids premature polyglot complexity.
- The worker boundary lets us swap implementations (Node→Go) later without touching callers.

**Negative / trade-offs**
- Transformation logic moves into SQL/DuckDB, which is a different authoring/testing model
  than TypeScript `mapRecord()`.
- Requires operating DuckDB (and, with ADR-0006, possibly DuckLake) alongside Postgres.

**Follow-ups**
- Keep the current ingester for now → build new/at-scale ETL as SQL/DuckDB push-down → measure
  → only extract a Go worker if profiling proves it (issue #4).
