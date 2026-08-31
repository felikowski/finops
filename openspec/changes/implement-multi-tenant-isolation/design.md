## Context

Issue #8 (opened early) proposed the strongest possible isolation model for a FinOps SaaS:
database-per-tenant with a dedicated control-plane NestJS app owning tenant lifecycle, provisioning,
and routing. At the time it was written, no tenant/customer concept existed in the app at all.

Since then, real implementation happened on `feat/billing-accounts-per-customer` (not yet merged to
`main`): a `customers` table keyed by Auth0 `sub`, auto-provisioned on first login, with
`billing_accounts.customerId` and reporting queries scoped to it. Issue #63 goes further and
proposes a full local `users` / `user_identities` / `customer_memberships` (with `viewer`/
`operator`/`admin` roles) model, explicitly to avoid depending on paid Auth0 Organizations for
tenancy. Issue #61/#62 (security review) confirm the row-scoping mechanism is directionally right
but currently incomplete: DuckLake's dedup key doesn't include the owning billing account, so two
customers importing overlapping data can cross-contaminate; customer auto-provisioning has a
race; there's no membership/role concept yet, just an implicit 1:1 user-to-customer mapping.

The billing line items themselves have also moved to DuckLake (issue #49), which has its own
isolation story (S3 bucket/prefix + Postgres catalog) tracked separately in issue #50 — it does not
need to mirror whatever isolation model the control-plane database uses.

## Goals / Non-Goals

**Goals:**
- Give every tenant-owned row in the control-plane Postgres database an authoritative, enforced
  owner (`customerId`), checked on every read and write path.
- Keep the operational and provisioning cost of onboarding a new tenant low (no new database,
  no new service to deploy) while real customer count is small.
- Make the tenant model swappable/extensible later (e.g. adding organizations, multiple users per
  customer, per-resource sharing) without a storage migration, by centering it on `customerId`
  foreign keys rather than schema-per-tenant or database-per-tenant partitioning.

**Non-Goals:**
- Building the originally-proposed `control-plane/` NestJS application, tenant registry, or
  cross-tenant provisioning API. Not pursued unless a concrete driver emerges.
- Physical database separation per tenant. The isolation guarantee here is enforced at the query/
  service layer, not at the credential/network layer that database-per-tenant would provide.
- Solving DuckLake-side (analytics) tenant isolation — that's `isolate-ducklake-catalog-per-tenant`
  (#50), which can adopt a different isolation model than the control-plane database.

## Decisions

**Decision: shared schema + row-level `customerId` scoping, not database-per-tenant.**
Rationale: the project is pre-revenue with a small, known customer count; database-per-tenant's
main payoffs (SOC 2 story, GDPR-by-`DROP DATABASE`, blast-radius isolation from ORM bugs) are real
but not yet worth the operational cost of a second service, per-tenant connection pooling, and
cross-tenant migration orchestration that issue #8 itself flags as required. The trade-off being
made explicitly: a bug in a service-layer filter can, in principle, leak another tenant's row —
mitigated by treating "every tenant-scoped repository method takes and applies a customer id" as a
hard rule (see `platform-security-hardening`'s remediation of the current gaps) and by tests that
assert cross-customer isolation, rather than by relying on infrastructure-level separation.

**Decision: tenant/customer identity comes from issue #63's local membership model, not Auth0
Organizations.** Auth0 Organizations' native multi-tenancy needs the paid B2B tier; a locally-owned
`users`/`user_identities`/`customer_memberships` model keeps authorization provider-independent
(consistent with issue #20's original decision to keep Auth0 to authentication only) and cheap.

**Decision: DuckLake isolation is tracked and decided independently (#50).** The control-plane
database's row-scoping model does not need to be replicated onto DuckLake's catalog/bucket
architecture — that is a different storage engine with different isolation primitives (S3 prefix/
bucket, Postgres catalog schema) and a different threat model (bulk analytical data, not
transactional CRUD).

## Risks / Trade-offs

- **Row-scoping is only as strong as its weakest query path.** Any new tenant-owned resource or
  reporting query must remember to filter by customer id; there is no infrastructure backstop.
  Mitigation: the `platform-security-hardening` change (#61/#62) closes the currently-known gaps,
  and future resources should be reviewed against this same requirement.
- **Revisiting database-per-tenant later is a migration, not a config change**, if a customer ever
  requires physical isolation (e.g. contractual data-residency terms). Accepted as a future cost in
  exchange for not over-building isolation infrastructure the product doesn't need yet.
