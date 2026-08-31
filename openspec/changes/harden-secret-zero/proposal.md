## Why

The backend's only credential for reading every managed secret is a single Infisical Universal Auth
machine identity (client id + client secret), supplied via the environment. That client secret is
"secret zero" — whoever holds it can read everything the identity is authorized for. Today it is
unscoped in practice, shared conceptually across environments, has no IP restriction, no TTL, and
`.env` is not guaranteed to be excluded from build contexts. A single leak currently has an
unbounded blast radius. Tracked by issues #3 (remaining hardening scope) and #17.

## What Changes

- Scope the machine identity's project role to only the paths it actually needs (`/postgres/*`,
  `/aws/finops/*`) and only the environments it serves — confirm it is not org-wide.
- Use a separate machine identity per environment (dev vs. prod); the prod client secret must never
  exist on a dev machine.
- Enable IP allowlisting on the identity, restricted to the VPS (and dev machine for local testing).
- Set a Client Secret TTL with a documented rotation procedure; document revocation on suspected leak.
- Tighten Access Token TTL / max uses; enable audit-log review for unexpected-IP auth.
- Add `.env` to `.dockerignore`; inject the prod client secret as an orchestrator/Docker secret,
  never as a file baked into an image.
- Document a follow-up path to a platform-native auth method (Kubernetes Auth once on K8s, or AWS
  Auth/IRSA) that would eliminate the static secret entirely — implementation may land later,
  alongside Kubernetes adoption.

## Capabilities

### Modified Capabilities
- `secrets-management`: adds identity-scoping, IP-allowlisting, secret-TTL/rotation, and
  secret-zero storage requirements on top of the existing Infisical fetch behavior.

## Impact

- Infisical machine-identity configuration (dashboard-side, not code) for dev and prod.
- `backend/.dockerignore` (or equivalent) and the prod deployment's secret-injection mechanism.
- Deployment documentation (rotation/revocation procedure).
