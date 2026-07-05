# 1. Self-host PostgreSQL on a VPS as the control-plane store

- **Status:** Accepted
- **Date:** 2026-07-05 (recorded retroactively)
- **Related:** issue #5, ADR-0002, ADR-0006

## Context

The application needs a primary transactional store for its control-plane / OLTP data
(configuration, billing-source registry, tenants, and — for now — billing line items).
An earlier idea (issue #5) was a managed/distributed SQL service (CockroachDB or a managed
cloud Postgres). The project has a strong preference for **open-source, self-hostable**
components and predictable low cost at this stage, and already runs a single Hostinger VPS.

## Decision

Run **PostgreSQL self-hosted on the Hostinger VPS via Docker** as the control-plane / OLTP
store. Do **not** adopt a managed cloud database or CockroachDB at this stage.

## Consequences

**Positive**
- Full control, no per-service SaaS cost, aligns with the open-source/self-host preference.
- Standard Postgres — portable, well-understood, rich ecosystem (TypeORM, extensions).
- Co-located with the rest of the stack on one VPS keeps latency and complexity low.

**Negative / trade-offs**
- Operational burden is on us: backups, upgrades, HA, monitoring, disk management.
- Vertical scaling ceiling of a single VPS; no built-in multi-region or automatic failover.

**Follow-ups**
- Issue #5 remains open to revisit a managed service if operational burden or scale demands it.
- Analytics-scale billing data may move to a columnar store (ADR-0006 / issue #4), leaving
  Postgres as the control plane.
- Connectivity/network hardening between app and dependencies is tracked in #11.