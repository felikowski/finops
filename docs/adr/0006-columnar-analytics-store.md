# 6. Columnar analytics store for billing line items

- **Status:** Proposed (under evaluation — gated on the benchmark in issue #4)
- **Date:** 2026-07-05
- **Related:** issue #4, ADR-0001, ADR-0005

## Context

Billing line items are append-heavy, wide, and queried analytically (aggregations, group-bys
over large row counts) — a workload columnar engines handle far better than row-store
Postgres. Postgres (ADR-0001) is well-suited to the control plane / OLTP data but may not be
the right home for analytics-scale FOCUS data as volume grows.

## Decision (proposed)

Evaluate moving billing line items to a **columnar analytics store**, while Postgres remains
the control-plane / OLTP store. Candidates:

- **ClickHouse** — mature, very fast columnar OLAP; separate system to operate.
- **DuckDB + Quack** (client-server protocol) — beta until ~v2.0 (fall 2026).
- **DuckLake** — GA since April 2026. A lakehouse format: SQL catalog in Postgres + Parquet
  in object storage; stateless compute. **Currently leading**, because it is GA and reuses
  the existing Postgres as its catalog (fits ADR-0001 and the ELT push-down direction of
  ADR-0005).

The final choice is **gated on the benchmark in issue #4** and is not yet accepted.

## Consequences

**Positive (expected)**
- Analytical queries over billing data become dramatically faster and cheaper.
- Keeps Postgres focused on OLTP/control-plane; separates concerns by workload.
- DuckLake specifically reuses Postgres as the catalog and object storage for data —
  minimal new stateful infrastructure.

**Negative / trade-offs**
- A second data store to operate, and a data-movement/sync path from ingestion into it.
- Split-brain risk: application/control data in Postgres, analytics in the columnar store —
  queries spanning both need care.

**Follow-ups**
- Run the benchmark (issue #4), then supersede this ADR with an `Accepted` decision naming the
  chosen engine.
