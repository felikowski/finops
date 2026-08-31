# release-pipeline Specification

## Purpose
Build each container image exactly once and promote that same artifact through releases, instead of rebuilding from source at every stage — so what gets tagged as a release is provably the same bytes that were tested.

## Requirements

### Requirement: Build once on every merge to main
The system SHALL build and publish both `finops-backend` and `finops-frontend` images to GHCR on every push to `main`, tagged with the commit SHA (`sha-<full-sha>`), `main`, and `latest`.

#### Scenario: A PR merges to main
- **WHEN** a commit lands on `main`
- **THEN** `publish-images.yml` builds and pushes both images tagged with that commit's SHA

### Requirement: Releases tag and retag, never rebuild
Cutting a release SHALL tag the current tip of `main` as `vX.Y.Z`, generate a GitHub Release with auto-generated notes, and retag the already-published `sha-`-tagged image with the version tag via a manifest copy (`docker buildx imagetools create`) — never a fresh build.

#### Scenario: Cutting a release
- **WHEN** a maintainer dispatches `release.yml` with a semver `version` input
- **THEN** `main`'s tip is tagged `vX.Y.Z`, a GitHub Release is created with generated notes, and the exact `sha-`-tagged image already in GHCR is retagged with `vX.Y.Z` — confirmed by an identical image digest

#### Scenario: Promotion is triggered reliably regardless of token identity
- **WHEN** `release.yml` runs
- **THEN** it invokes the retag step as a reusable `workflow_call` (passing the exact commit SHA and version explicitly), so the promotion happens even though GitHub Actions does not fire `push` events for tags created by the default `GITHUB_TOKEN`
