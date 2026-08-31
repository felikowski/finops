## 1. Schema

- [ ] 1.1 Add `users` table (id, display_name, email, enabled, created_at, updated_at)
- [ ] 1.2 Add `user_identities` table (id, user_id, issuer, subject, created_at) with a unique constraint on `(issuer, subject)`
- [ ] 1.3 Add `customer_memberships` table (user_id, customer_id, role, status, created_at, updated_at) with a unique constraint on `(user_id, customer_id)`
- [ ] 1.4 Write a data migration mapping every existing `customers` row (keyed by Auth0 `sub`) into a `User` + `UserIdentity` + an `admin` `customer_membership`

## 2. Request authorization flow

- [ ] 2.1 Replace `CustomersService.resolveForAuth0User`'s auto-create behavior with a lookup by `(issuer, subject)` that returns 403 when no `User` exists
- [ ] 2.2 Add customer resolution + active-membership lookup to the guard chain, returning 403 when no active membership exists for the requested customer
- [ ] 2.3 Attach both `User` and `Customer` context to the request for controllers/services to read
- [ ] 2.4 Add a role-check mechanism (e.g. a `@RequireRole()` decorator/guard) usable per-endpoint

## 3. Apply roles to existing endpoints

- [ ] 3.1 Require at least `viewer` for reporting/read endpoints
- [ ] 3.2 Require at least `operator` for triggering a billing-account pull
- [ ] 3.3 Require `admin` for managing billing accounts and customer memberships

## 4. Testing

- [ ] 4.1 Test: a valid JWT with no matching `User` is rejected with 403, not auto-provisioned
- [ ] 4.2 Test: a valid `User` with no active membership for the requested customer is rejected with 403
- [ ] 4.3 Test: role checks correctly allow/deny each of viewer/operator/admin on representative endpoints
