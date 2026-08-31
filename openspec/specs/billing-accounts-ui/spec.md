# billing-accounts-ui Specification

## Purpose
Give an authenticated user a minimal way to see registered billing accounts and trigger an ingestion pull, without a full account-management UI.

## Requirements

### Requirement: List and trigger-pull page
The frontend SHALL provide a page that lists all billing accounts visible to the caller, shows each account's last pull outcome, and lets the user trigger a new pull for any account.

#### Scenario: Viewing the list
- **WHEN** an authenticated user opens the billing accounts page
- **THEN** the page loads and displays every visible billing account with its most recent pull result (rows inserted, or the last error)

#### Scenario: Triggering a pull
- **WHEN** the user clicks "pull" on an account
- **THEN** the UI shows a loading state, then either the number of rows inserted on success or the error message on failure, and refreshes the account list

### Requirement: No account-creation form in v1
The frontend SHALL NOT expose a UI for creating or editing billing accounts; registration happens out of band (API call or fixture/seed data) until a create flow is explicitly built.

#### Scenario: Looking for a "new account" button
- **WHEN** a user is on the billing accounts page
- **THEN** no create/edit affordance is present — only list and pull
