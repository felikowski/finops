## 1. Scope the identity

- [ ] 1.1 Audit the current machine identity's project role; confirm/restrict it to `/postgres/*` and `/aws/finops/*` paths and only the environments it serves
- [ ] 1.2 Create a separate machine identity for prod (distinct from the dev identity); ensure the prod client secret is never present on a dev machine

## 2. Make the secret non-portable / short-lived

- [ ] 2.1 Enable IP allowlisting on each identity, restricted to the VPS IP (and dev machine IP for local testing)
- [ ] 2.2 Set a Client Secret TTL and document the rotation procedure
- [ ] 2.3 Tighten Access Token TTL / max uses
- [ ] 2.4 Document how to review Infisical audit logs and what an "unexpected IP" alert should trigger

## 3. Store secret zero properly

- [ ] 3.1 Add `.env` to `.dockerignore`
- [ ] 3.2 Change the prod deployment to inject `INFISICAL_CLIENT_SECRET` as a Docker/orchestrator secret rather than a file in the image or a plain compose env var

## 4. Document the long-term path

- [ ] 4.1 Write up migrating from Universal Auth to a platform-native auth method (Kubernetes Auth or AWS Auth/IRSA) as a documented follow-up, without implementing it yet
