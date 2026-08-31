## Why

`implement-multi-tenant-isolation` (#8) settles on shared-schema row-level scoping for the
control-plane Postgres database, but DuckLake (`billing-analytics-store`, #49) is a different
storage engine with different isolation primitives. Today all customers' billing data lands in one
shared DuckLake catalog/bucket. Without per-tenant isolation there, tenant data is not guaranteed
unqueryable cross-tenant at the storage layer (defense in depth beyond the application-level
`customerId` filtering), and there is no clean way to delete a single tenant's data (GDPR) short of
surgically deleting rows out of a shared structure. The `ducklake-experiment` spike proved by hand
what provisioning one isolated DuckLake environment takes; this issue (#50) is about designing and
automating that as a repeatable step, once it's actually needed.

## What Changes

- Decide the isolation model via an ADR: shared bucket + tenant-prefixed path with scoped STS
  `AssumeRole` sessions, vs. a dedicated bucket + IAM user per tenant; and schema-per-tenant within
  a shared `ducklake_catalog` Postgres database, vs. full database-per-tenant.
- Add a tenant/customer registry entry (in the control-plane Postgres DB) storing each tenant's
  resolved DuckLake data path + catalog location.
- Automate provisioning of a new tenant's DuckLake isolation (script or IaC) rather than manual AWS
  CLI steps.
- Start with a shared backend process that resolves the caller's tenant to the correct DuckLake
  `ATTACH` per request — isolated per-tenant Kubernetes deployments/subdomains remain an explicit
  stretch/learning goal, not a functional requirement.

## Capabilities

### Modified Capabilities
- `billing-analytics-store`: adds per-tenant catalog/data-path resolution and provisioning on top
  of the existing single-tenant DuckLake integration.

## Impact

- `backend/src/ducklake/` — `DuckLakeConnectionService` needs to resolve tenant-specific
  connection parameters instead of one fixed set of env vars.
- New tenant registry columns/table for DuckLake data path + catalog location.
- Depends on `manage-customer-memberships-and-roles` (#63) for how a tenant/customer id is resolved
  per request, and on `implement-billing-analytics-store` (#49) as the base integration.
