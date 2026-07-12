# 9. Publish container images to GHCR, built once on `main` and promoted for releases

- **Status:** Accepted
- **Date:** 2026-07-12
- **Related:** issue #25, issue #38, issue #29

## Context

`backend/Dockerfile` and `frontend/Dockerfile` produce production-shaped images, and
`.github/workflows/ci.yml` already builds both on every pull request for validation, but
nothing publishes a reusable artifact — every environment would otherwise have to rebuild
from source. Issue #29 (deploy to the Hostinger VPS) and any future environment need a
built-once, promoted-everywhere image to pull instead.

There is no release process yet. The chosen model: a release tag is just a marker on
`main`'s history, not a separate build — tagging a commit on the mainline already includes
every prior merge, so "promoting a release" should mean *pointing new tags at an image that
already exists*, never re-running the build for that commit.

## Decision

Three workflows, each single-purpose:

- **`publish-images.yml`** — `push: branches: [main]` only. The one place either image is
  actually built. Publishes, via `docker/metadata-action`:
  - `sha-<full 40-char sha>` — immutable, every push.
  - `main` (the branch name).
  - `latest`.

  Multi-arch (`linux/amd64`, `linux/arm64`) via `docker/setup-qemu-action` + Buildx, with
  SBOM and build provenance attestation (`docker/build-push-action`'s `sbom`/`provenance`
  inputs), and GHA layer caching (scoped `backend`/`frontend`, shared with the existing
  PR-time image-build job in `ci.yml`).

- **`release.yml`** — `workflow_dispatch` only, with a single `version` input (e.g. `1.4.0`).
  Checks out `main`'s current tip explicitly (regardless of what ref the dispatch defaulted
  to), validates the version format, rejects an already-existing tag, then creates and
  pushes an annotated `vX.Y.Z` tag. `contents: write` is scoped to this one job — no other
  workflow in this repo can push to the repository.

- **`promote-release.yml`** — `push: tags: ["v*"]`. Never rebuilds. Resolves the tagged
  commit's already-published `sha-<sha>` image and copies it to `vX.Y.Z`/`X.Y` tags with
  `docker buildx imagetools create` (a manifest copy, preserving the multi-arch manifest
  list as-is). First inspects the source tag and fails with an explicit error if it's
  missing — i.e. if someone tags a commit that was never built and published from `main`.

Fork pull requests never reach any of this: none of the three workflows trigger on
`pull_request`, so there is no path where a fork's token could carry `packages: write` or
`contents: write` against this repository.

Cosign keyless signing is **not** included yet — deferred until this base workflow has run
for a while, per the originating issue. Package retention/cleanup is tracked separately as
issue #38 — publishing a new SHA tag on every merge to `main` is unbounded growth without it.

## Consequences

**Positive**
- "Cut a release" is one Actions button + a version number — no local git tag/push steps,
  no separate versioning tool.
- Build-once-promote is structural, not just documented convention: `promote-release.yml`
  has no build step at all, so a release image is provably the exact bytes that were
  already validated on `main`, not a fresh (and possibly non-identical) rebuild.
- Issue #29 (and any future environment) can `docker pull` a specific, already-built,
  attested image instead of rebuilding from source per environment.
- SBOM/provenance ship from day one rather than being bolted on later.

**Negative / trade-offs**
- Releasing a commit that hasn't reached `main` yet (or whose `main` build failed/is still
  running) is impossible by design — `promote-release.yml` errors out rather than falling
  back to a rebuild. Considered a feature, not a gap.
- `latest` silently moves on every merge to `main`; anyone pulling `latest` for anything
  other than "whatever's newest" should pin a SHA or semver tag instead.
- No image signing yet — build provenance attestation is not the same guarantee as a
  signed image; accepted gap until Cosign lands.
- Every push to `main` grows GHCR storage (new SHA tag, plus untagged attestation
  manifests) until issue #38's retention workflow exists.

**Follow-ups**
- Issue #38: scheduled cleanup of untagged and old SHA-tagged package versions.
- Issue #29: point the VPS deploy workflow at these published images instead of rebuilding.
- Add Cosign keyless signing once this workflow has proven stable.
