# Runbook: provisioning a DuckLake catalog DB + S3 bucket

How the DuckLake catalog Postgres database and its S3 data bucket were provisioned for issue
#49 (production DuckLake implementation). No such runbook existed for the original
`finops`/`finops_owner` setup either (ADR-0002) — this doubles as the template for that too,
and for provisioning a second environment (staging/dev) later.

## 1. Postgres catalog database + role

Runs against the existing shared VPS Postgres instance (`srv1115517.hstgr.cloud:32768`, compose
project `postgresql-7iuy`, container `postgresql-7iuy-postgresql-1`) — **not** a new Postgres
server. Same instance the `finops` app database lives on.

```sh
ssh -i ~/.ssh/finops_vps_debug root@srv1115517.hstgr.cloud

# Read the container's own superuser credentials (Hostinger-generated, random name/password —
# do not hardcode them anywhere; read fresh each time).
CONTAINER=postgresql-7iuy-postgresql-1
SUPERUSER=$(docker exec "$CONTAINER" printenv POSTGRES_USER)
SUPERPASS=$(docker exec "$CONTAINER" printenv POSTGRES_PASSWORD)

# Generate a fresh password for the new role — never hand-type or hardcode one.
NEWPASS=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-32)

docker exec -e PGPASSWORD="$SUPERPASS" "$CONTAINER" psql -U "$SUPERUSER" -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE ROLE ducklake_owner WITH LOGIN PASSWORD '$NEWPASS';" \
  -c "CREATE DATABASE ducklake OWNER ducklake_owner;"

# Verify
docker exec -e PGPASSWORD="$NEWPASS" "$CONTAINER" psql -U ducklake_owner -d ducklake -c '\conninfo'
```

Naming: database `ducklake`, role `ducklake_owner` — **single role**, not an owner/app split
like ADR-0002's `finops_owner`/`finops_app`. DuckLake's own `ATTACH ... (TYPE ducklake)` does
catalog DDL (creating/altering its metadata tables) on essentially every write, so a
DDL-vs-CRUD split doesn't map cleanly onto it the way it does for a normal application schema.
Revisit only if a genuine lower-privilege consumer shows up later (e.g. a read-only BI role).

The existing `ducklake_catalog` database (owned by role `ducklake_experiment`) on this same
instance is the `ducklake-experiment` spike's — deliberately untouched, not reused.

No new host/port secret is needed: DuckLake's catalog DB shares the same Postgres
host/port as the `finops` app DB (`/postgres` in Infisical) — only `database`/`user`/`password`
differ, stored under `/postgres/ducklake` and `/postgres/ducklake/ducklake_owner`. See
[`backend/docs/infisical.md`](../../backend/docs/infisical.md).

## 2. S3 bucket + IAM user

```sh
aws s3api create-bucket --bucket finops-ducklake --region eu-central-1 \
  --create-bucket-configuration LocationConstraint=eu-central-1

aws s3api put-public-access-block --bucket finops-ducklake \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-encryption --bucket finops-ducklake \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws iam create-user --user-name finops-ducklake

aws iam put-user-policy --user-name finops-ducklake --policy-name finops-ducklake-bucket-access \
  --policy-document file://finops-ducklake-iam-policy.json   # see below

aws iam create-access-key --user-name finops-ducklake
```

`finops-ducklake-iam-policy.json` — least-privilege, scoped to the one bucket only (mirrors the
`ducklake-experiment` spike's policy shape):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "ListBucket", "Effect": "Allow", "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::finops-ducklake" },
    { "Sid": "ReadWriteObjects", "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::finops-ducklake/*" }
  ]
}
```

Verify the policy is neither too broad nor too narrow: `put`/`get`/`delete` a small test object
with the new (non-root) access key, and confirm the same key gets `AccessDenied` against an
unrelated bucket.

Credentials (access key id/secret) go to `/aws/finops/ducklake` in Infisical (see
[`backend/docs/infisical.md`](../../backend/docs/infisical.md)) — never committed, never
long-lived on any local disk beyond the one-time handoff.

## Not covered by this runbook

- Wiring these paths into `MANAGED_ENV`/`secrets.bootstrap.ts` (lands with the
  `@duckdb/node-api` integration — issue #49's next slice).
- DuckLake snapshot/orphaned-file cleanup policy.
- Repeating this for a second environment (staging/dev) — same steps, different
  bucket/role/Infisical-environment names.
- Browsing the actual data with a SQL client — see
  [the DBeaver setup runbook](./ducklake-dbeaver-setup.md).
