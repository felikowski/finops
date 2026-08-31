# billing-ingestion Specification

## Purpose
Pull a FOCUS-formatted billing export from a registered source into the control-plane database, deduplicating re-imported rows and recording every attempt for observability.

## Requirements

### Requirement: FOCUS CSV ingestion into billing_line_items
The system SHALL stream a FOCUS 1.0/1.2-formatted CSV from the account's configured S3 source, map its columns onto the `billing_line_items` schema, and insert it in batches.

#### Scenario: Successful pull
- **WHEN** `POST /billing-accounts/:id/pull` is called for an enabled account with a reachable, valid CSV source
- **THEN** the CSV rows are parsed, mapped, and persisted, and the response reports the number of rows inserted

#### Scenario: Disabled account
- **WHEN** a pull is requested for an account with `enabled: false`
- **THEN** the request fails with `409 Conflict` and no ingestion is attempted

### Requirement: Idempotent re-pull via natural-key deduplication
The system SHALL compute a deterministic `lineItemKey` from the FOCUS natural-key columns (provider, account, billing/charge period, charge/resource/service identifiers, etc.) and upsert on that key, so re-pulling the same export updates existing rows instead of duplicating them.

#### Scenario: Re-pulling the same export
- **WHEN** the same billing account is pulled twice against an unchanged source file
- **THEN** the second pull updates the existing rows (matched by `lineItemKey`) rather than inserting duplicates

### Requirement: Persisted pull attempt log
The system SHALL record every pull attempt — start time, finish time, status (`success`/`error`), rows inserted, and error message when applicable — as a `billing_account_pulls` row, and expose it per account.

#### Scenario: Viewing pull history
- **WHEN** `GET /billing-accounts/:id/pulls` is called
- **THEN** it returns the account's pull attempts ordered most-recent-first, including failed attempts with their error message

#### Scenario: A pull fails
- **WHEN** ingestion throws (bad credentials, unreachable source, malformed CSV)
- **THEN** a pull record with `status: error` and the failure reason is still persisted, and the account's `lastIngestedAt`/`lastRowsInserted` are left unchanged
