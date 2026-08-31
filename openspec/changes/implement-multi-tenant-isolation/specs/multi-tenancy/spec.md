## Purpose
Ensure every tenant-owned resource in the control-plane database belongs to exactly one customer and is unreachable by any other customer, using shared-schema row-level scoping rather than physical database-per-tenant separation.

## ADDED Requirements

### Requirement: Every tenant-owned row has an authoritative owner
Every table holding customer-specific data SHALL carry a `customerId` foreign key, and that column SHALL NOT be nullable for rows created after this requirement lands.

#### Scenario: Creating a new tenant-owned resource
- **WHEN** a billing account, or any future customer-owned resource, is created
- **THEN** it is persisted with the requesting caller's resolved `customerId` set

### Requirement: All reads and writes are scoped by the caller's customer
Every service method that lists, reads, updates, or deletes a tenant-owned resource SHALL filter by the caller's resolved customer id; there SHALL be no unscoped "list all" or "get by id" path reachable by an authenticated non-admin caller.

#### Scenario: Listing billing accounts
- **WHEN** an authenticated customer A calls `GET /billing-accounts`
- **THEN** only billing accounts owned by customer A are returned, never customer B's

#### Scenario: Acting on another customer's resource by id
- **WHEN** customer A calls an endpoint with a resource id that belongs to customer B
- **THEN** the request is rejected (404 or 403), not served

### Requirement: Physical database-per-tenant is explicitly out of scope for now
The system SHALL rely on service-layer row scoping within a single shared Postgres database/schema for tenant isolation; a dedicated control-plane service and per-tenant database provisioning are not part of this capability.

#### Scenario: Onboarding a new tenant
- **WHEN** a new customer is provisioned
- **THEN** no new database, schema, or service deployment is required — only a new `customers` row and associated scoped resources
