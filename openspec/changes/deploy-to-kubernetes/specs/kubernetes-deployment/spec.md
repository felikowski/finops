## Purpose
Run the backend and frontend on any conformant Kubernetes cluster (EKS/GKE/AKS or self-managed) with zero-downtime rolling deploys, autoscaling, and automatic TLS, without cloud-specific manifests.

## ADDED Requirements

### Requirement: Provider-agnostic base manifests
The Kubernetes manifests under `k8s/base/` SHALL contain no cloud-specific Ingress controller annotations, StorageClass names, or certificate-manager integrations; all provider-specific configuration SHALL live only in per-environment overlays.

#### Scenario: Deploying to a different cloud
- **WHEN** `k8s/base/` combined with a new overlay is applied to a cluster on a different cloud provider
- **THEN** the application deploys and serves traffic without modifying any `base/` manifest

### Requirement: Zero-downtime rolling deploys
Each service's `Deployment` SHALL run at least 2 replicas with a `RollingUpdate` strategy (`maxUnavailable: 0`, `maxSurge: 1`) and pinned, non-`latest` image tags.

#### Scenario: Deploying a new version
- **WHEN** a new image tag is rolled out via the `Deployment`
- **THEN** at all times at least the original replica count remains available to serve traffic

### Requirement: Health-gated traffic and autoscaling
Each service SHALL declare liveness, readiness, and startup probes against an HTTP health endpoint, and a `HorizontalPodAutoscaler` targeting CPU utilization.

#### Scenario: Backend fails its readiness probe
- **WHEN** the backend pod's `GET /health` readiness probe fails (e.g. lost DB connectivity)
- **THEN** the pod is removed from the Service's endpoints and receives no traffic until it recovers

#### Scenario: Load increases
- **WHEN** backend CPU utilization exceeds the HPA's target threshold
- **THEN** additional replicas are scheduled automatically, up to the configured maximum

### Requirement: Automatic TLS via cert-manager
Public ingress SHALL use the nginx Ingress controller with cert-manager issuing and rotating TLS certificates automatically; no cloud-specific certificate manager SHALL be used.

#### Scenario: A new Ingress host is added
- **WHEN** an `Ingress` resource is created with a `cert-manager.io/cluster-issuer` annotation
- **THEN** a valid TLS certificate is provisioned automatically without manual intervention

### Requirement: Secrets sourced from an operator, not plain manifests
Production `Secret` values SHALL be populated by a secrets-management operator (Sealed Secrets or an External Secrets Operator syncing from Infisical), not committed as plain or base64-only Kubernetes `Secret` manifests.

#### Scenario: A production secret needs rotation
- **WHEN** a credential is rotated in the upstream secrets manager
- **THEN** the operator syncs the change into the cluster `Secret` without a manual `kubectl` edit
