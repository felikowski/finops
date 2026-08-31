## ADDED Requirements

### Requirement: Scheduled GHCR image retention
The system SHALL run a scheduled workflow that deletes untagged image versions and commit-SHA tags beyond a configured retention count, while never deleting semver release tags or `latest`.

#### Scenario: Weekly cleanup run
- **WHEN** the scheduled cleanup workflow runs
- **THEN** all untagged package versions are deleted, and only the most recent N `sha-`-tagged versions per package are kept

#### Scenario: A release tag exists
- **WHEN** the cleanup workflow evaluates package versions for a package with a `vX.Y.Z` or `latest` tag
- **THEN** that version is never deleted regardless of age or `sha-` retention count

#### Scenario: Manual trigger
- **WHEN** a maintainer manually dispatches the cleanup workflow
- **THEN** it runs the same logic on demand, outside the weekly schedule
