# TODO

## Security
- [ ] Integrate a secrets manager for production credentials (e.g. HashiCorp Vault for provider-agnostic self-hosted, or Doppler as a simpler SaaS alternative). Current `.env` approach is fine for development only.

## Database
- [ ] Migrate from local PostgreSQL (Docker) to CockroachDB Serverless for cloud deployment (provider-agnostic, multi-tenant ready, PostgreSQL-compatible).

## Infrastructure
- [ ] Add Dockerfile for backend and frontend once first real feature (FOCUS ingestion) is working — low effort now, avoids a painful containerization sprint later.
- [ ] Deploy to Kubernetes (K8s) for provider-agnostic scaling. App architecture (stateless NestJS + Angular + external DB) is already K8s-ready by design.

## Multi-tenancy
- [ ] Design and implement multi-tenant architecture (schema-per-tenant or DB-per-tenant) when onboarding real customers.
