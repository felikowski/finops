# Architecture Decision Records (ADRs)

This folder records the **significant architectural decisions** made for this project —
the *why* behind choices that are expensive to reverse or that a future contributor would
otherwise have to reconstruct from scattered issue comments.

## When to add one

Add an ADR whenever a **bigger architectural decision** is taken: choosing/replacing a
core technology, a data-model or boundary decision, a cross-cutting pattern, a
security/identity approach, etc. Small, local, easily-reversible choices don't need one.

## Format

Each ADR is a numbered Markdown file (`NNNN-short-title.md`) with:

- **Status** — `Proposed` · `Accepted` · `Superseded by ADR-XXXX` · `Deprecated`
- **Context** — the forces and constraints in play
- **Decision** — what was decided
- **Consequences** — the resulting trade-offs and follow-ups

ADRs are immutable once accepted: to change a decision, add a **new** ADR that supersedes
the old one (and update the old one's status), rather than editing history.

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](./0001-self-host-postgres-on-vps.md) | Self-host PostgreSQL on a VPS as the control-plane store | Accepted |
| [0002](./0002-finops-schema-least-privilege-roles.md) | Dedicated `finops` schema with least-privilege roles | Accepted |
| [0003](./0003-infisical-as-secrets-manager.md) | Infisical (self-hosted) as the secrets manager | Accepted |
| [0004](./0004-startup-config-fetch-via-explicit-map.md) | Fetch config/secrets at startup via an explicit map | Accepted |
| [0005](./0005-elt-pushdown-defer-go-worker.md) | ELT push-down for billing ingestion; defer a Go worker | Accepted |
| [0006](./0006-columnar-analytics-store.md) | Columnar analytics store for billing line items | Proposed |
| [0007](./0007-per-account-runtime-credential-resolution.md) | Billing source registry with per-account, runtime-resolved credentials | Accepted |

> ADRs 0001–0003 and 0005 were **backfilled on 2026-07-05** from decisions taken earlier in
> the project; the dates in those files reflect when they were recorded, not necessarily
> when the decision was first made.
