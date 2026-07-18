# 6. Columnar analytics store for billing line items

- **Status:** Accepted
- **Date:** 2026-07-05 (proposed), decided 2026-07-18
- **Related:** issue #4, ADR-0001, ADR-0005

## Context

Billing line items are append-heavy, wide, and queried analytically (aggregations, group-bys
over large row counts) — a workload columnar engines handle far better than row-store
Postgres. Postgres (ADR-0001) is well-suited to the control plane / OLTP data but may not be
the right home for analytics-scale FOCUS data as volume grows.

Candidates evaluated:

- **ClickHouse** — mature, very fast columnar OLAP; separate system to operate.
- **DuckDB + Quack** (client-server protocol) — beta until ~v2.0 (fall 2026).
- **DuckLake** — GA since April 2026. A lakehouse format: SQL catalog in Postgres + Parquet
  in object storage; stateless compute.

## Decision

Adopt **DuckLake**. A standalone spike (repo `ducklake-experiment`, kept separate from this
repo) proved the architecture end-to-end: a DuckDB CLI process attaches a dedicated Postgres
database as the DuckLake catalog and an S3 bucket as the Parquet data path, writes/reads work,
and views persist in the catalog across independent process runs (DuckLake explicitly does not
support persisting macros/functions, only tables and views).

This decision is made on architectural fit plus the working spike, not a completed
quantitative bake-off — the fuller benchmark matrix originally scoped in issue #4 (Postgres
baseline at 1M/100M rows, ClickHouse, DuckDB+Quack) was not run. DuckLake wins on reusing
existing Postgres infrastructure (ADR-0001) and stateless/embedded compute (fits the ELT
push-down direction of ADR-0005) rather than on measured performance superiority over
ClickHouse. If a workload later surfaces where DuckLake's performance is insufficient,
re-open this ADR with real numbers before switching.

## Consequences

**Positive**
- Analytical queries over billing data become dramatically faster and cheaper than Postgres
  at scale.
- Keeps Postgres focused on OLTP/control-plane; separates concerns by workload.
- Reuses Postgres as the catalog and needs no separate database server to operate (unlike
  ClickHouse) — compute is stateless/embedded DuckDB, which also fits a multi-replica K8s
  deployment model well.

**Negative / trade-offs**
- A second data store (conceptually) to operate, and a data-movement/sync path from ingestion
  into it.
- Split-brain risk: application/control data in Postgres, analytics in DuckLake — queries
  spanning both need care.
- DuckLake's snapshot/time-travel model means storage doesn't shrink automatically on
  `DROP TABLE`/deletes — orphaned Parquet files need an explicit cleanup policy
  (`expire_snapshots`-style), confirmed in the spike.
- No performance number vs. ClickHouse at real billing-data scale exists yet — decision carries
  that risk.

**Follow-ups**
- Production implementation tracked separately (see issue tracker) — dedicated catalog DB,
  IAM-scoped S3 bucket, `@duckdb/node-api` integration, ingestion push-down, snapshot cleanup.
- Multi-tenant DuckLake catalog isolation tracked separately, extending issue #8.
