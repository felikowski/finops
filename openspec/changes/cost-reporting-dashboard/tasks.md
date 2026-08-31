## 1. Backend aggregation queries

- [x] 1.1 Add `getCostByMonth` to `DuckLakeBillingRepository`
- [x] 1.2 Add `getCostByDay` to `DuckLakeBillingRepository`
- [x] 1.3 Add `getCostByCategoryAndProvider` to `DuckLakeBillingRepository`, scoped to a selected month

## 2. Reporting endpoints

- [x] 2.1 Add `ReportingController`/`ReportingService` with `GET /reporting/cost-by-month`, `/cost-by-day`, `/cost-by-category-provider`
- [x] 2.2 Scope every query to the caller's resolved customer's billing account ids
- [x] 2.3 Guard the endpoints with `JwtAuthGuard` + `CustomerContextGuard`, consistent with the rest of the API

## 3. Frontend dashboard

- [x] 3.1 Add a reporting page with a daily/monthly cost view toggle
- [x] 3.2 Add the category/provider breakdown table, scoped to the daily month and grouped by FOCUS category then provider
- [x] 3.3 Pin the cost-over-time chart to a fixed baseline and show month-over-month change

## 4. Close out #49's outstanding criterion

- [ ] 4.1 Record a sanity-checked performance comparison (dashboard query vs. equivalent Postgres query at current ingested volume) as the concrete proof for `implement-billing-analytics-store`'s outstanding acceptance criterion
