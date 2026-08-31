## Context

The current `CustomerContextGuard` reads the JWT `sub`, and `CustomersService.resolveForAuth0User`
either finds or **creates** a `Customer` row for it — meaning authentication alone grants
application access and an implicit 1:1 user↔customer relationship. This was a reasonable bootstrap
shortcut (see `implement-multi-tenant-isolation`'s design.md) but issue #62 identifies it as a
concrete gap once Auth0 signup is anything other than fully admin-controlled: "authentication is
not equivalent to application membership." Issue #63 is the proposed fix, written with security as
the explicit design driver (see the issue's "Important security rules" section).

## Goals / Non-Goals

**Goals:**
- Make "may this user act as/within this customer" a first-class, application-owned decision,
  independent of what the IdP token says beyond identity.
- Support more than one login identity per user and more than one user per customer without a
  schema change.
- Keep the initial role set intentionally small (`viewer`/`operator`/`admin`) rather than building
  a full `roles`/`permissions`/`role_permissions` matrix before it's needed.

**Non-Goals:**
- Self-service signup or invitation flows — out of scope for this change (memberships are
  provisioned directly, mirroring today's admin-provisions-via-Auth0-Dashboard pattern for user
  creation, per `authentication`'s "no self-signup" requirement).
- A general-purpose permissions engine. Three fixed roles are enough until they demonstrably aren't.
- Auth0 Organizations. Deliberately kept out per the original OIDC decision (`authentication`
  capability) and per `implement-multi-tenant-isolation`'s decision to keep tenancy
  provider-independent and cheap.

## Decisions

**Decision: identity key is `(issuer, subject)`, never email.** Emails can change, be reused, or be
unverified depending on the IdP connection; `issuer + subject` is the only value an IdP guarantees
stable and unique for a given login.

**Decision: unknown or unmembered users are denied, not auto-provisioned.** This directly reverses
today's `resolveForAuth0User` behavior. A valid JWT proves authentication; it must not imply
authorization. This is the change's central security property and the reason the capability exists.

**Decision: authorization state lives in the FinOps database, not in Auth0 custom claims (yet).**
Custom JWT claims may be added later purely as a caching/latency optimization, but the database
stays the source of truth — avoids the trap of trusting client-editable or provider-side attributes
(e.g. Auth0 `app_metadata`/`user_metadata`) for authorization decisions.

**Decision: hostname/subdomain-based tenant routing (if ever added) does not replace membership
checks.** Even a tenant deployment with a fixed `CUSTOMER_ID` must still verify the caller has an
active membership for that customer — routing is a convenience, not a security boundary.

## Risks / Trade-offs

- **Migration of existing data:** every `Customer` row currently auto-provisioned from a bare Auth0
  `sub` needs a corresponding `User` + `UserIdentity` + `customer_membership` (likely `admin`, since
  they were the sole user of their own customer) created by a data migration — get this wrong and
  existing users are locked out.
- **Effective-immediately role changes are not free:** if access tokens are ever cached
  (e.g. a future custom-claims optimization), revoking a membership must still take effect promptly
  — the initial database-source-of-truth design sidesteps this by checking membership on every
  request, at the cost of a DB lookup per guarded request (acceptable at current scale; revisit if
  it becomes a latency concern).
