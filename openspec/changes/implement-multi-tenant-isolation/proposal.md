## Why

Issue #8 originally proposed a database-per-tenant silo model with a dedicated control-plane
service. Since that issue was opened, the team already started down a lighter path: a `customers`
table plus row-level `customerId` scoping on `billing_accounts` (in progress on
`feat/billing-accounts-per-customer`), and issue #63 proposes a concrete local
users/identities/customer-memberships/roles model that removes the need for a separate control
plane entirely. Issue #61/#62's security review found the current row-scoping is real but
incomplete (DuckLake dedup can cross customer boundaries; provisioning has a race). This proposal
reconciles #8 with that actual direction rather than building the originally-proposed
database-per-tenant control plane, and records why. See `design.md` for the full reasoning.

## What Changes

- Adopt **shared-schema, row-level tenancy** (one Postgres database and schema, every tenant-owned
  table scoped by a `customerId` foreign key) as the isolation model for the control-plane
  database, superseding #8's original database-per-tenant proposal.
- Formalize tenant/customer identity and membership via issue #63's model (tracked as its own
  change, `manage-customer-memberships-and-roles`) rather than a separate control-plane service.
- Require every tenant-scoped query path (billing accounts, reporting, future resources) to filter
  by the resolved customer/tenant id at the service layer — closing the gaps #61/#62 found.
- Explicitly defer database-per-tenant / dedicated control-plane service: revisit only if a
  concrete driver emerges (a customer requiring physical data separation for compliance, or
  provisioning volume that a shared schema can't sustain).
- DuckLake-side tenant isolation (catalog/data-path separation) is tracked separately as
  `isolate-ducklake-catalog-per-tenant` (issue #50), since it operates on a different store with
  different isolation trade-offs.

## Capabilities

### New Capabilities
- `multi-tenancy`: cross-cutting requirement that every tenant-owned resource and query in the
  control-plane database is scoped to its owning customer, with no code path that can return or
  mutate another customer's rows.

## Impact

- `backend/src/customers/`, `backend/src/billing-accounts/`, `backend/src/reporting/` — every
  service resolving or filtering by customer.
- Supersedes the "database-per-tenant + control-plane service" architecture originally proposed in
  issue #8; that repository structure (`control-plane/` app) is not being built.
- Depends on `manage-customer-memberships-and-roles` (#63) for how a caller's tenant is resolved,
  and is a prerequisite input to `isolate-ducklake-catalog-per-tenant` (#50).
