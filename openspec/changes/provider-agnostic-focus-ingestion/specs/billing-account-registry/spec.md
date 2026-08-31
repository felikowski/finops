## RENAMED Requirements

- FROM: `### Requirement: Only AWS is currently a supported provider`
- TO: `### Requirement: AWS, Azure, and GCP are supported providers`

## MODIFIED Requirements

### Requirement: AWS, Azure, and GCP are supported providers
The system SHALL accept and validate provider-specific `sourceConfig` shapes for `aws`, `azure`, and `gcp`, each rejecting malformed configuration for that provider with a clear error.

#### Scenario: Creating or pulling an Azure/GCP account today
- **WHEN** a caller registers or triggers a pull for a billing account with `provider: azure` or `provider: gcp`
- **THEN** the request is accepted and ingested via that provider's read path, no longer rejected as unimplemented

#### Scenario: Missing required fields
- **WHEN** the request omits `displayName` or supplies a `sourceConfig` missing required fields for the declared provider (AWS, Azure, or GCP)
- **THEN** the request is rejected with `400 Bad Request` naming the missing field(s)

### Requirement: Per-account credential resolution
The system SHALL resolve credentials for a pull according to the billing account's provider: AWS access-key pairs, Azure connection string/SAS token/service principal, or GCP service-account key/HMAC keys — each independently per account, with the same Infisical-path-or-fallback pattern as AWS today.

#### Scenario: Account with a dedicated credential path
- **WHEN** a billing account has `credentialRef` set and `SECRETS_SOURCE=infisical`
- **THEN** the pull fetches that provider's shaped credentials (AWS access-key pair, Azure connection string/SAS/service principal, or GCP service-account/HMAC key) from that Infisical path rather than using the global fallback identity

#### Scenario: Account without a credential reference
- **WHEN** a billing account has `credentialRef: null`
- **THEN** the pull uses the backend's global fallback identity for that provider (AWS today; Azure/GCP fallback behavior follows the same pattern)

#### Scenario: Azure account with a dedicated credential path
- **WHEN** an Azure-provider billing account has `credentialRef` set
- **THEN** the pull fetches Azure-shaped credentials from that Infisical path rather than an AWS-shaped fallback

#### Scenario: GCP account with a dedicated credential path
- **WHEN** a GCP-provider billing account has `credentialRef` set
- **THEN** the pull fetches GCP-shaped credentials from that Infisical path
