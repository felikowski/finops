## Why

Today, "who can do what" is not modeled at all: a valid Auth0 JWT auto-provisions a `Customer` row
on first sight (`CustomersService.resolveForAuth0User`) and that's the entire authorization
decision — there is no membership, no role, and no way for the application to grant or revoke
access independent of Auth0. A valid OIDC token currently answers "who is this person" and the
app treats that as "they may use the application," which issue #62 flags as a real gap once
multiple untrusted users can log in. Issue #63 proposes moving membership, roles, and application
authorization into the FinOps database itself, so Auth0 (or any future OIDC provider) is
responsible only for authentication — not for deciding what a token holder is allowed to do.

## What Changes

- Add a `users` table (id, display_name, email, enabled, timestamps) as the local identity record,
  decoupled from any specific IdP.
- Add a `user_identities` table keyed by `(issuer, subject)` — the authoritative external-identity
  pair — so a user can later hold more than one login identity or migrate IdPs without changing
  their local user id. Email is never the identity key.
- Replace the current implicit "one `Customer` per Auth0 `sub`" model with `customer_memberships`
  (`user_id`, `customer_id`, `role`, `status`), with initial roles `viewer` / `operator` / `admin`.
- Change request authorization to: validate the JWT → resolve local identity by `(issuer, sub)` →
  reject unknown/disabled users with 403 → resolve the requested customer → load the active
  membership → check the required role → attach `User` + `Customer` context to the request.
- Do **not** auto-create a `Customer` for every new OIDC subject; a valid identity with no
  membership is `403`, not silently provisioned.
- Enforce authorization in backend guards/services only — Angular route visibility is UX, not a
  security boundary.

## Capabilities

### New Capabilities
- `customer-membership-roles`: local user identity, per-customer role-based membership, and the
  request authorization flow that enforces it — replacing the current auto-provisioned
  one-user-one-customer shortcut.

## Impact

- `backend/src/customers/` (`Customer` entity, `CustomersService`, `CustomerContextGuard`) — the
  auto-provisioning behavior is replaced by an explicit membership lookup.
- New `backend/src/users/` module (or similar) for `User`/`UserIdentity`.
- New migration(s) for `users`, `user_identities`, `customer_memberships`; a data migration for
  existing auto-provisioned `Customer` rows into the new model.
- Every guarded controller gains a role-check step, not just a customer-resolution step.
- Directly informs `implement-multi-tenant-isolation` (#8) and is a P0/P1 item in
  `harden-tenant-security` (#61/#62) — "authentication is not equivalent to membership."
