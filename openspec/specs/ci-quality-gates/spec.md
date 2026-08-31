# ci-quality-gates Specification

## Purpose
Catch build, test, and deployment-config regressions on every pull request before they reach `main`.

## Requirements

### Requirement: Required backend and frontend build/test checks
Every pull request SHALL run the backend and frontend build and unit test suites as required checks.

#### Scenario: A PR breaks a unit test
- **WHEN** a pull request is opened with a failing backend or frontend test
- **THEN** the corresponding CI job fails and the PR is blocked from merging

### Requirement: Deployment manifest validation
CI SHALL validate that the root, staging, and production `docker-compose.yml` files are syntactically and referentially valid (`docker compose config`), using dummy secret-zero files so the check needs no real credentials.

#### Scenario: A compose file references an undefined variable
- **WHEN** a PR introduces a `docker-compose.yml` change with a broken `env_file` reference or invalid interpolation
- **THEN** the `docker compose config` validation step fails

### Requirement: Container images build in CI
CI SHALL build (without pushing) the backend and frontend Docker images on every PR, so a broken Dockerfile is caught before merge.

#### Scenario: A Dockerfile change breaks the build
- **WHEN** a PR changes `backend/Dockerfile` or `frontend/Dockerfile` in a way that fails to build
- **THEN** the corresponding CI image-build step fails
