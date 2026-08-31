## ADDED Requirements

### Requirement: Per-tenant DuckLake catalog and data path resolution
The system SHALL resolve each request's DuckLake catalog attachment and data path from the caller's tenant/customer, rather than a single fixed environment-wide configuration.

#### Scenario: Two tenants query billing data concurrently
- **WHEN** requests for customer A and customer B are handled
- **THEN** each is served from that customer's own resolved DuckLake catalog/data path, not a shared one

### Requirement: Automated tenant DuckLake provisioning
Provisioning a new tenant's DuckLake isolation (bucket/prefix, IAM/STS scoping, catalog schema or database) SHALL be automated, not a manual sequence of AWS CLI commands.

#### Scenario: Onboarding a new tenant
- **WHEN** a new tenant is provisioned
- **THEN** its DuckLake isolation is created by running an automated script or IaC apply, and its resolved data path/catalog location is recorded in the tenant registry

### Requirement: Verified cross-tenant unreachability
A second tenant's billing data SHALL be verifiably unreachable from another tenant's DuckDB session, proven by a negative test rather than only "it was never queried."

#### Scenario: Attempting cross-tenant access
- **WHEN** a DuckDB session attached for tenant A's catalog/data path attempts to read tenant B's data
- **THEN** the read fails or returns no rows, because tenant A's session has no credential or catalog attachment reaching tenant B's storage
