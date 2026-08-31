## 1. Formalize the isolation rule

- [ ] 1.1 Write an ADR documenting the shared-schema/row-scoping decision over database-per-tenant (supersedes issue #8's original proposal)
- [x] 1.2 `customers` table exists, auto-provisioned from the Auth0 `sub` on first request
- [x] 1.3 `billing_accounts.customerId` scoping exists and is applied on list/create/pull paths
- [x] 1.4 `reporting` queries are scoped by the caller's resolved customer id

## 2. Close known isolation gaps (tracked in detail under `harden-tenant-security`)

- [ ] 2.1 Make DuckLake dedup respect the owning billing account, not just FOCUS fields (#61)
- [ ] 2.2 Make first-login customer provisioning race-safe (#61)
- [ ] 2.3 Backfill/assign legacy `billing_accounts` rows with `customerId IS NULL`

## 3. Formalize identity and roles

- [ ] 3.1 Implement issue #63's local membership/roles model (tracked as its own change: `manage-customer-memberships-and-roles`)

## 4. Testing

- [ ] 4.1 Add an integration test asserting a request scoped to customer A cannot read or mutate customer B's billing accounts or reporting data
