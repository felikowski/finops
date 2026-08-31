## Why

FOCUS billing data now actually lands in DuckLake (`implement-billing-analytics-store`, #49), but
there was no way to see it — the frontend's only billing-related view was the billing-accounts
list/pull-trigger page. Cost visibility is the actual point of a FinOps tool; a working ingestion
pipeline nobody can look at doesn't deliver the product's core value yet. This is also the natural
place to close out #49's still-open "at least one production analytics query runs against DuckLake
and is measurably faster than the equivalent Postgres query" criterion — a real dashboard query is
that proof, rather than a synthetic benchmark. Substantially implemented already on
`feat/billing-accounts-per-customer`.

## What Changes

- Add a small, v1-scoped dashboard page in the Angular frontend: total cost over time (daily or
  monthly, chosen via a toggle) and a cost breakdown by FOCUS category then provider, scoped to a
  selected month, with a fixed baseline and month-over-month change.
- Add read-only backend endpoints (`GET /reporting/cost-by-month`, `/cost-by-day`,
  `/cost-by-category-provider`) that reuse `DuckLakeBillingRepository` as the query boundary — no
  ad-hoc DuckDB SQL scattered in a dashboard controller/service.
- Scope every reporting query to the caller's resolved customer's billing accounts.
- Auth-gate the endpoints the same way as the rest of the API (JWT guard + customer context guard).
- Explicitly out of scope for v1: filtering/drill-down UI, date-range pickers, export, or any
  general-purpose query builder.

## Capabilities

### New Capabilities
- `cost-reporting`: read-only cost aggregation endpoints and a frontend dashboard page, scoped per
  customer, backed by the DuckLake analytics store.

## Impact

- New `backend/src/reporting/` module (controller, service).
- `backend/src/ducklake/ducklake-billing.repository.ts` gains aggregation query methods
  (`getCostByMonth`, `getCostByDay`, `getCostByCategoryAndProvider`).
- New `frontend/src/app/reporting/` component, wired into the app's routes/nav.
- Delivers the outstanding analytics-query acceptance criterion from
  `implement-billing-analytics-store` (#49).
