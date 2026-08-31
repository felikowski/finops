## 1. Decide the isolation model

- [ ] 1.1 Write an ADR comparing bucket-per-tenant vs. shared-bucket-with-prefix + scoped STS sessions
- [ ] 1.2 Write an ADR comparing database-per-tenant vs. schema-per-tenant for the DuckLake catalog

## 2. Registry and provisioning

- [ ] 2.1 Add a tenant registry table (or extend the `customers` table) storing each tenant's resolved DuckLake data path + catalog location
- [ ] 2.2 Automate provisioning of a new tenant's DuckLake isolation (script or IaC), replacing the manual AWS CLI steps the spike used

## 3. Backend resolution

- [ ] 3.1 Change `DuckLakeConnectionService` to resolve per-tenant connection parameters based on the caller's resolved customer, instead of one fixed set of env vars
- [ ] 3.2 Verify a second tenant can be provisioned and its billing data is verifiably unreachable from the first tenant's DuckDB session (negative test)

## 4. Stretch (non-blocking)

- [ ] 4.1 Explore at least one tenant running behind an isolated Kubernetes deployment + subdomain, as a learning goal informing whether to generalize this later
