## Purpose
Give an authenticated customer a minimal, real view of their own ingested FOCUS cost data — cost over time and by category/provider — proving the ingestion pipeline delivers visible value.

## ADDED Requirements

### Requirement: Cost-over-time view
The system SHALL provide an aggregated total-cost-over-time view, selectable as daily or monthly, scoped to the caller's own billing accounts.

#### Scenario: Viewing monthly cost
- **WHEN** an authenticated customer requests `GET /reporting/cost-by-month`
- **THEN** the response contains one aggregated cost figure per month, computed only from that customer's billing accounts

#### Scenario: Viewing daily cost for a month
- **WHEN** an authenticated customer requests `GET /reporting/cost-by-day` for a given month
- **THEN** the response contains one aggregated cost figure per day within that month

### Requirement: Category and provider breakdown
The system SHALL provide a cost breakdown grouped by FOCUS charge category and then by provider, optionally scoped to a specific month.

#### Scenario: Viewing the breakdown for a month
- **WHEN** an authenticated customer requests `GET /reporting/cost-by-category-provider?month=YYYY-MM`
- **THEN** the response groups that month's cost by category, then by provider within each category

#### Scenario: Invalid month format
- **WHEN** the `month` query parameter is not in `YYYY-MM` format
- **THEN** the request is rejected with `400 Bad Request`

### Requirement: Reporting is customer-scoped and auth-gated
Every reporting endpoint SHALL require a valid JWT and resolved customer context, and SHALL only ever aggregate over billing accounts owned by the caller's customer.

#### Scenario: Unauthenticated request
- **WHEN** a reporting endpoint is called without a valid JWT
- **THEN** it is rejected with `401 Unauthorized`

#### Scenario: Two customers request the same report
- **WHEN** customer A and customer B each call `GET /reporting/cost-by-month`
- **THEN** each receives figures computed only from their own billing accounts, never the other's

### Requirement: No general-purpose query builder in v1
The reporting capability SHALL stay a small, fixed set of aggregation views; it SHALL NOT include filtering/drill-down UI, date-range pickers, export, or a general-purpose query builder in this iteration.

#### Scenario: Looking for a custom filter or export button
- **WHEN** a user is on the reporting dashboard
- **THEN** no ad-hoc filter builder or export feature is present — only the fixed daily/monthly and category/provider views
