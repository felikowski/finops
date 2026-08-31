# containerization Specification

## Purpose
Package the backend and frontend as production-ready container images that run identically across local Docker Compose, staging, and production.

## Requirements

### Requirement: Multi-stage, non-root container images
Each service SHALL build via a multi-stage Dockerfile that installs workspace dependencies, builds only that package, and produces a minimal runtime image. The backend runtime SHALL run as a non-root user.

#### Scenario: Backend image build
- **WHEN** `docker build -f backend/Dockerfile .` runs from the repo root
- **THEN** it produces a `node:lts-alpine`-based image containing only the built backend and its production dependencies, running `dist/main.js` as a non-root `appuser`

#### Scenario: Frontend image build
- **WHEN** `docker build -f frontend/Dockerfile .` runs from the repo root
- **THEN** it produces an `nginx:alpine`-based image serving the production Angular build with the project's `nginx.conf`

### Requirement: Built-in health checks
Each image SHALL declare a Docker `HEALTHCHECK` that verifies the service is actually serving traffic, not just that the process is running.

#### Scenario: Backend health check
- **WHEN** the backend container is running
- **THEN** Docker considers it healthy only while `GET /health` on `127.0.0.1:3000` succeeds

#### Scenario: Frontend health check
- **WHEN** the frontend container is running
- **THEN** Docker considers it healthy only while `GET /` on `127.0.0.1:80` succeeds
