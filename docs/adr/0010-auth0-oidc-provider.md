# 10. Auth0 as the OIDC identity provider, integrated provider-agnostically

- **Status:** Accepted
- **Date:** 2026-07-12
- **Related:** issue #20, issue #19, issue #8

## Context

The app had no authentication. Once the billing-accounts UI (#19) is reachable outside
localhost, that's a real exposure — anyone with the URL could list accounts, trigger pulls,
and eventually see cost/billing data. Issue #20 asked for an OIDC identity provider, explicitly
without assuming Auth0 — the project has otherwise favored self-hosted open source over SaaS
(Infisical over a managed secrets service), so self-hosted alternatives (Keycloak, Zitadel, Ory,
Authentik, Logto, SuperTokens) were evaluated too, not just Auth0.

## Decision

**Provider: Auth0 (managed).** Weighed primarily on VPS RAM headroom (~2.2GB free alongside
Infisical/n8n at the time), fit with the future multi-tenant model (#8), and ops burden:

- Keycloak was ruled out outright — its JVM footprint (realistically 1–2GB+) doesn't fit the
  VPS's remaining headroom.
- Zitadel was the strongest self-hosted contender (single Go binary, ~100–512MB, native
  multi-tenancy that maps well to #8, could reuse the existing Postgres instance) — but the
  decision prioritized setup speed and zero ops burden over staying consistent with the
  project's self-host-by-default pattern.
- Auth0 wins on setup speed and SDK/doc maturity for both Angular and NestJS, and offloads
  security hardening (rate limiting, brute-force protection, anomaly detection) that a
  self-hosted option would otherwise put on us to configure and keep patched.

**Accepted trade-off:** this breaks from the self-host precedent Infisical set. Revisit if
Auth0's pricing/MAU limits become a problem at scale, or if the self-host-everything preference
outweighs velocity later — see below for why that revisit wouldn't mean starting over.

**Integration is provider-agnostic wherever it costs nothing to be:**
- Frontend (`frontend/src/app/auth/`): `angular-oauth2-oidc`, a generic OIDC client — not
  Auth0's own Angular SDK. Configured purely from runtime values (issuer, client ID, audience)
  fetched from the backend's `GET /config.json` at startup (`auth-init.ts`, an
  `APP_INITIALIZER`-style provider), never hardcoded. Authorization Code + PKCE flow
  (`responseType: 'code'`); a route guard (`auth.guard.ts`) redirects to login if there's no
  valid access token; a functional HTTP interceptor (`auth.interceptor.ts`) attaches the token
  only to calls against the app's own API, never to the IdP's own endpoints.
- Backend (`backend/src/auth/`): `passport-jwt` + `jwks-rsa`, validating `iss`/`aud`/RS256
  signature against the configured issuer's JWKS endpoint — not an Auth0-specific NestJS
  package. `JwtAuthGuard` (`AuthGuard('jwt')`) protects `BillingAccountsController`; nothing
  Auth0-specific appears outside `jwt.strategy.ts`'s two config reads (`AUTH0_DOMAIN`,
  `AUTH0_AUDIENCE`).
- Connection config (`AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_AUDIENCE`) is Infisical-managed
  like the Postgres/AWS values (`/auth0` path, see `docs/infisical.md`), with a plain-env
  fallback in `backend/.env.example` for `SECRETS_SOURCE=local`.

This makes the login/JWT-validation *mechanics* swappable by configuration alone if the
provider is revisited. It does **not** make a future migration free: user data lives in Auth0's
own store (`sub` values, invites) and Auth0-specific admin tooling (Actions/Rules) wouldn't
carry over — that's an inherent cost of any IdP choice, not something abstraction avoids.

**Deliberately not done yet:**
- Authorization/roles beyond "is this a valid, authenticated user" — that's the tenant-mapping
  work in #8, layered on top of the identity this ADR establishes.

## Consequences

**Positive**
- No more anonymous access path to `/billing-accounts` or the UI.
- Zero ops burden and no VPS RAM cost — Auth0 runs entirely off-box.
- Swapping providers later touches config and two small, already-isolated modules
  (`frontend/src/app/auth/`, `backend/src/auth/`), not application code that calls them.

**Negative / trade-offs**
- Ongoing SaaS dependency and cost as usage grows, inconsistent with the Infisical precedent.
- User identities live outside our infrastructure; migrating away means re-provisioning users.
- `AUTH0_AUDIENCE` (and Auth0's `audience` login parameter, passed via `customQueryParams` in
  `auth-init.ts`) is an Auth0-ism, not a universal OIDC concept — the one place a future
  provider swap would need more than a config value.

**Follow-ups**
- #8: map the authenticated user to a tenant; add role/authorization checks beyond "valid JWT".
- Document deployed callback/logout/origin URLs per environment once #29/#30 exist.
