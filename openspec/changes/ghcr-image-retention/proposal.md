## Why

Every push to `main` publishes a new commit-SHA-tagged image for both `finops-backend` and
`finops-frontend` to GHCR (`release-pipeline`), and each build also produces untagged manifests as
SBOM/provenance attestation byproducts. Without a cleanup process, GHCR storage grows unbounded and
there's no defined rule for what's safe to delete — GHCR has no built-in retention policy for
non-Enterprise-org repositories, so this must be built explicitly. Tracked by issue #38.

## What Changes

- Add a separate, scheduled GitHub Actions workflow (weekly cron + `workflow_dispatch` for manual
  runs) that prunes old package versions from both GHCR packages.
- Delete untagged image versions immediately (never referenced by a running deployment).
- Keep only the most recent N (default 20) commit-SHA-tagged images per package.
- Always keep semver release tags and `latest`.
- Log what was deleted for auditability; use least-privilege `packages: write` scoped to this job.

## Capabilities

### Modified Capabilities
- `release-pipeline`: adds a retention/cleanup policy for the images it publishes.

## Impact

- New `.github/workflows/ghcr-cleanup.yml` (or similar), using an existing action
  (`dataaxiom/ghcr-cleanup-action` or `actions/delete-package-versions`).
- README documentation of the retention policy and rationale.
