## Purpose
Model application users, their external login identities, and their per-customer roles inside the FinOps database, so that a valid OIDC token proves identity only — not automatic access to any customer's data.

## ADDED Requirements

### Requirement: Local identity decoupled from the IdP
The system SHALL maintain a local `User` record and a separate `(issuer, subject)`-keyed identity record per login method, so authorization never depends on IdP-controlled attributes such as email or provider metadata.

#### Scenario: Resolving a caller's identity
- **WHEN** a request carries a validated JWT with issuer `I` and subject `S`
- **THEN** the backend resolves the local `User` by the unique `(issuer, subject)` pair, not by email

### Requirement: No automatic customer provisioning on first login
The system SHALL NOT create a `Customer` or grant any membership automatically when a previously-unseen identity presents a valid JWT.

#### Scenario: First login of an identity with no membership
- **WHEN** a valid JWT is presented for an `(issuer, subject)` with no corresponding `User`, or a `User` with no active `customer_membership`
- **THEN** the request is rejected with `403 Forbidden`, and no `Customer`, `User`, or membership row is created as a side effect

### Requirement: Role-scoped customer membership
The system SHALL grant access to a customer's resources only through an active `customer_membership` row carrying a role of `viewer`, `operator`, or `admin`, and SHALL enforce the required role per operation in backend guards/services.

#### Scenario: Viewer attempts to trigger an ingestion pull
- **WHEN** a user whose only membership for a customer has role `viewer` calls the pull-trigger endpoint for that customer
- **THEN** the request is rejected with `403 Forbidden`

#### Scenario: Admin manages billing accounts
- **WHEN** a user with an `admin` membership for a customer creates or modifies a billing account owned by that customer
- **THEN** the request succeeds

#### Scenario: Membership is revoked
- **WHEN** a customer_membership's `status` is set to inactive
- **THEN** subsequent requests by that user against that customer are rejected with `403 Forbidden`, without requiring the user's JWT to be reissued or revoked

### Requirement: Authorization enforced server-side only
Access control decisions SHALL be enforced in backend guards/services; frontend route visibility SHALL NOT be relied upon as a security boundary.

#### Scenario: A viewer bypasses the frontend route guard
- **WHEN** a user with only `viewer` access calls an admin-only API endpoint directly (bypassing the Angular UI)
- **THEN** the backend still rejects the request with `403 Forbidden`
