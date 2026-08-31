# billing-account-registry Specification

## Purpose
Register billing data sources (cloud provider export location + credentials) as first-class, manageable control-plane records, instead of accepting an ad-hoc bucket/key on every ingestion request.

## Requirements

### Requirement: Billing accounts as control-plane records
The system SHALL persist each registered billing source as a `billing_accounts` row with a provider, display name, provider-specific `sourceConfig`, an optional `credentialRef`, a FOCUS version, and an `enabled` flag.

#### Scenario: Registering a new billing account
- **WHEN** an authenticated caller `POST`s a billing account with `displayName` and a valid `sourceConfig` for the given provider
- **THEN** the account is created and returned with a generated id

#### Scenario: Missing required fields
- **WHEN** the request omits `displayName` or an invalid `sourceConfig` for the provider
- **THEN** the request is rejected with `400 Bad Request`

### Requirement: Only AWS is currently a supported provider
The system SHALL accept `aws`, `azure`, and `gcp` as declared provider values but SHALL reject ingestion for any provider other than `aws` until that provider's ingestion path is implemented.

#### Scenario: Creating or pulling an Azure/GCP account today
- **WHEN** a caller registers or triggers a pull for a billing account with `provider: azure` or `provider: gcp`
- **THEN** the request is rejected with a clear "not yet implemented" error

### Requirement: Per-account credential resolution
The system SHALL resolve AWS credentials for a pull independently per billing account: a `credentialRef` set on the account is resolved from Infisical at that path (cached briefly); an account with no `credentialRef` falls back to a single global AWS identity.

#### Scenario: Account with a dedicated credential path
- **WHEN** a billing account has `credentialRef` set and `SECRETS_SOURCE=infisical`
- **THEN** the pull fetches `access_key_id`/`secret_access_key` from that Infisical path rather than using the global fallback identity

#### Scenario: Account without a credential reference
- **WHEN** a billing account has `credentialRef: null`
- **THEN** the pull uses the backend's global `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`
