# 3. Infisical (self-hosted) as the secrets manager

- **Status:** Accepted
- **Date:** 2026-07-05 (recorded retroactively)
- **Related:** issue #3, ADR-0004, issues #11, #17

## Context

Secrets (DB credentials, AWS keys) were stored in plaintext `.env` files — fine for local
dev, unsuitable for production (trivially exfiltrated, no versioning/audit/rotation). We need
a real secrets manager. Constraints: **open-source and self-hostable** (consistent with
ADR-0001), avoiding both source-available-but-not-OSI licenses and pure SaaS.

Options considered:
- **HashiCorp Vault** — now **BSL-licensed** (source-available, not OSI open source). Rejected
  on license grounds. (Its MPL fork **OpenBao** exists but adds significant operational
  complexity — HA Raft, unseal management, policy authoring.)
- **Doppler** — polished, but **fully SaaS**; secrets leave our infrastructure boundary.
- **Infisical** — **MIT-licensed, self-hostable** via Docker.

## Decision

Adopt **Infisical**, self-hosted via Docker on the same VPS, as the secrets manager.

## Consequences

**Positive**
- MIT + self-hosted: secrets stay within our infrastructure; fits the open-source preference.
- Web UI with versioning/audit, machine-identity auth, per-environment secrets.

**Negative / trade-offs**
- We operate it (another Docker stack to run, back up, and upgrade).
- Introduces the **"secret zero"** problem — a machine-identity credential must be supplied
  out-of-band to bootstrap access (see ADR-0004 and issue #17).
- Interim connectivity hairpins through Infisical's public URL until an internal Docker
  network lands (#11).

**Follow-ups**
- ADR-0004: how the app consumes Infisical at runtime.
- Issue #17: harden the machine identity (scoping, IP allowlist, rotation, native auth).
- Issue #11: internal Docker network between app and Infisical.
