# TODO

## Security
- [ ] Integrate a secrets manager for production credentials (e.g. HashiCorp Vault for provider-agnostic self-hosted, or Doppler as a simpler SaaS alternative). Current `.env` approach is fine for development only.

## Database
- [ ] **[NEEDS EVALUATION]** Consider ClickHouse as the primary database for billing data — aligns naturally with FOCUS 1.2's append-only correction model, excellent analytical performance, open source, K8s-native, one instance per tenant. However, evaluate carefully before committing:
  - ClickHouse is optimized for analytical/billing data but may not be the best fit for future non-billing features (e.g. user management, configs, workflows) which require frequent UPDATEs and transactional guarantees
  - Consider whether a hybrid approach (ClickHouse for billing data + PostgreSQL for app data) or a different database entirely makes more sense as the feature set grows beyond billing ingestion
  - Evaluate DELETE/UPDATE limitations in the context of future non-billing requirements
- [ ] If staying with PostgreSQL: migrate from local Docker instance to CockroachDB Serverless for cloud deployment (provider-agnostic, multi-tenant ready, PostgreSQL-compatible).

## Infrastructure
- [ ] Add Dockerfile for backend and frontend once first real feature (FOCUS ingestion) is working — low effort now, avoids a painful containerization sprint later.
- [ ] Deploy to Kubernetes (K8s) for provider-agnostic scaling. App architecture (stateless NestJS + Angular + external DB) is already K8s-ready by design.

## Multi-tenancy
- [ ] Design and implement multi-tenant architecture (schema-per-tenant or DB-per-tenant) when onboarding real customers.
