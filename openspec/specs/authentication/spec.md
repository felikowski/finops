# authentication Specification

## Purpose
Authenticate human users of the deployed frontend/API against an OIDC identity provider, kept provider-agnostic so the IdP can be swapped later.

## Requirements

### Requirement: OIDC login via a managed identity provider
The system SHALL authenticate users through Auth0 as the OIDC identity provider, using the Authorization Code flow with PKCE from the Angular SPA and RS256 JWT validation on the backend.

#### Scenario: Unauthenticated API request
- **WHEN** a request to a protected endpoint carries no valid JWT
- **THEN** the backend rejects it with `401 Unauthorized`

#### Scenario: Valid login
- **WHEN** a user completes the Auth0 Authorization Code + PKCE flow in the frontend
- **THEN** the frontend receives an access token and attaches it to subsequent API requests, which the backend's JWT strategy validates against Auth0's issuer, audience, and signing keys (RS256 only)

### Requirement: No public self-signup
The system SHALL NOT allow public account self-registration. New users are provisioned directly by the administrator via the Auth0 Dashboard.

#### Scenario: Someone attempts to register
- **WHEN** a visitor reaches the Auth0-hosted login/signup page without an admin-created account
- **THEN** no signup path is available; only an admin-provisioned account can authenticate

### Requirement: Provider-agnostic integration
The authentication integration SHALL be implemented against generic OIDC libraries and config-driven environment variables (`AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_AUDIENCE`), not an Auth0-specific SDK, so the identity provider can be replaced without rewriting the auth module.

#### Scenario: Backend serves runtime auth config
- **WHEN** the frontend requests `GET /config.json`
- **THEN** the backend returns the OIDC configuration needed to initialize the frontend's auth client, sourced from environment variables rather than hardcoded values
