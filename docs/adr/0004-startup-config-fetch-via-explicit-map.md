# 4. Fetch config/secrets at startup via an explicit map

- **Status:** Accepted
- **Date:** 2026-07-05
- **Related:** ADR-0003, issue #3, issue #16, PR #18

## Context

Having chosen Infisical (ADR-0003), we needed to decide *how* the app consumes it. Two axes:

1. **When** to fetch — once at startup vs. per request / continuously at runtime. The concern
   raised was rotation: "if I fetch at startup, don't I need to redeploy on every credential
   change?" But the DB credentials are consumed once, when the TypeORM **connection pool** is
   built; per-request fetching adds latency and an Infisical round-trip to the hot path
   without actually re-applying the value, and makes Infisical a hard runtime dependency.
2. **What** to fetch — a wildcard dump of all secrets vs. an explicit, declared set.

## Decision

- **Fetch once at startup**, before Nest builds its config, via `loadRemoteSecrets()`
  (`SECRETS_SOURCE=infisical`). This keeps Infisical a **boot-time-only dependency**.
- Fetch an **explicit `MANAGED_ENV` map** — each entry declares an Infisical `(path, key)` →
  `process.env` variable — so the **code is the source of truth** for what is fetched and
  where each value lands (not a wildcard `listSecrets`).
- Use Infisical as a **combined secret + config store**: non-secret config (e.g. `AWS_REGION`,
  DB host/port/name/schema) is fetched the same way, so per-environment values live in one
  place. Only the five `INFISICAL_*` bootstrap vars ("secret zero") stay outside Infisical.

## Consequences

**Positive**
- Explicit, reviewable, fails loudly on a missing value; no accidental reliance on unknown keys.
- Infisical outages can't break live request handling — only restarts.
- Single per-environment source of truth for config + secrets.

**Negative / trade-offs**
- Rotation requires a **process restart** (mitigated: a container restart re-runs the fetch;
  a Kubernetes operator can automate restart-on-change later).
- Using Infisical for config too loses the "plainly visible, git-versioned ConfigMap"
  separation — config now sits behind the same access controls as secrets.
- Per-source AWS credentials don't fit a single global env var — they must become **runtime**
  resolution once multiple billing accounts exist (issue #16), so the current AWS entries in
  `MANAGED_ENV` are a stopgap.

**Follow-ups**
- Issue #16: move per-account source credentials to runtime resolution keyed by a `credential_ref`.
- If no-restart rotation is ever needed (e.g. dynamic DB secrets), add a TTL-cached provider
  that rebuilds the pool — not per-request fetching.
