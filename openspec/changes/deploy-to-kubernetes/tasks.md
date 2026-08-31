## 1. Base manifests

- [ ] 1.1 Write `k8s/base/` `Deployment`, `Service`, and `HorizontalPodAutoscaler` for the backend
- [ ] 1.2 Write `k8s/base/` `Deployment`, `Service`, and `HorizontalPodAutoscaler` for the frontend
- [ ] 1.3 Add `securityContext.runAsNonRoot`/`readOnlyRootFilesystem` and required `emptyDir` volumes (nginx `/tmp`, `/var/cache/nginx`)
- [ ] 1.4 Add liveness/readiness/startup probes against `GET /health` (backend) and `GET /` (frontend)
- [ ] 1.5 Set CPU/memory requests and limits for both containers

## 2. Overlays

- [ ] 2.1 Write `k8s/overlays/dev/` Kustomize patches (lower replicas, debug log level, dev cert issuer)
- [ ] 2.2 Write `k8s/overlays/staging/` and `k8s/overlays/production/` patches

## 3. Ingress, TLS, and secrets

- [ ] 3.1 Write the `Ingress` manifest using `ingressClassName: nginx`, no cloud-specific annotations
- [ ] 3.2 Install nginx Ingress controller + cert-manager via Helm (per-cluster, not app manifests)
- [ ] 3.3 Configure a `ClusterIssuer` for Let's Encrypt
- [ ] 3.4 Decide and wire the production secret-population mechanism (Sealed Secrets or External Secrets Operator against Infisical)

## 4. Tooling and rollout

- [ ] 4.1 Configure Skaffold + kind for a local development loop against the same overlays
- [ ] 4.2 Set up ArgoCD pointed at `k8s/overlays/production/`
- [ ] 4.3 Add `kube-prometheus-stack` via Helm for observability
- [ ] 4.4 Walk through the provider-portability checklist (no cloud-specific Ingress/StorageClass/cert-manager integrations in `base/`)
