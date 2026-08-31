## Why

The application (stateless NestJS backend + Angular SPA + external PostgreSQL) is already
well-suited to Kubernetes, but today it only runs via Docker Compose on a single shared VPS (see
`staging-deployment`/`production-promotion`). That gives no horizontal scaling, no rolling
zero-downtime deploys, and no provider portability. Issue #7 proposes a provider-agnostic K8s setup
that runs identically on EKS/GKE/AKS. This assumes `containerization` (#6, done) is in place.

## What Changes

- Add provider-agnostic Kustomize manifests (`k8s/base/`): `Deployment` (2+ replicas, rolling
  update, non-root, read-only root filesystem), `ClusterIP` `Service`, and `HorizontalPodAutoscaler`
  for both backend and frontend.
- Add `k8s/overlays/{dev,staging,production}/` Kustomize patches for image tags, replica counts,
  and resource limits.
- Add an nginx Ingress + cert-manager-issued TLS `Ingress` resource (no cloud-specific Ingress
  controllers or annotations in `base/`).
- Add `ConfigMap`/`Secret` wiring, with production secrets sourced from an External Secrets
  Operator or Sealed Secrets rather than plain base64 `Secret` manifests in Git.
- Add liveness/readiness/startup probes against a `GET /health` endpoint, and explicit CPU/memory
  requests and limits for both containers.
- Adopt Kustomize + Helm (third-party charts: nginx-ingress, cert-manager, kube-prometheus-stack)
  + ArgoCD (GitOps reconciliation) + Skaffold/kind (local inner dev loop) as the toolchain.

## Capabilities

### New Capabilities
- `kubernetes-deployment`: provider-agnostic Kubernetes manifests, ingress/TLS, secrets wiring,
  autoscaling, and health probes for running the backend and frontend on any conformant cluster.

## Impact

- New `k8s/` directory tree (manifests, overlays).
- Requires `GET /health` (exists today per the `containerization` Dockerfiles' healthchecks) to be
  reachable as a proper HTTP endpoint for K8s probes, not just the Docker `HEALTHCHECK` command.
- Depends on a secrets-manager operator (ties into `secrets-management` and issue #3/#17's
  platform-native-auth follow-up) for production `Secret` population.
