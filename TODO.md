# TODO

## Security
- [ ] Integrate a secrets manager for production credentials (e.g. HashiCorp Vault for provider-agnostic self-hosted, or Doppler as a simpler SaaS alternative). Current `.env` approach is fine for development only.

## Database
- [ ] Migrate from local PostgreSQL (Docker) to CockroachDB Serverless for cloud deployment (provider-agnostic, multi-tenant ready, PostgreSQL-compatible).

## Multi-tenancy
- [ ] Design and implement multi-tenant architecture (schema-per-tenant or DB-per-tenant) when onboarding real customers.
