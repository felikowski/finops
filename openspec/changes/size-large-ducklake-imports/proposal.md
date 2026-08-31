## Why

The `ducklake-experiment` spike confirmed a real capacity problem: a 145M-row DuckLake import
OOM-killed a 4GB VPS outright, and even a later attempt on the shared production VPS — with
`nice`/`choom` process-priority safeguards — made the whole VPS unreachable (SSH and HTTPS both
down) for several minutes, requiring a manual reboot. `implement-billing-analytics-store` (#49)
needs a deliberate answer to "where does a given import actually run," rather than assuming every
import happens in-process on the backend's shared VPS container. Tracked separately from #49 since
it's a distinct problem (compute sizing/placement), not part of the SQL push-down design itself.

## What Changes

- Before running a billing import job, cheaply estimate its row count/volume (source file size, a
  fast line count, or a provider-reported row count) without fully reading the file.
- Compare the estimate against a configurable threshold: under threshold → run in-process on the
  existing backend (expected to cover the common case, since real periodic FOCUS pulls are far
  smaller than the spike's 200M-row synthetic benchmark); over threshold → automatically provision a
  short-lived, disposable AWS compute instance (EC2 spot or Fargate — the spike already proved a
  working Fargate pattern) to run the import, then tear it down.
- Accept occasional disposable-compute cost as a known, acceptable ongoing cost model (AWS costs
  from the spike's experimentation were negligible).

## Capabilities

### Modified Capabilities
- `billing-analytics-store`: ingestion gains a pre-flight sizing check that routes large imports to
  disposable remote compute instead of always running in-process.

## Impact

- `backend/src/billing-accounts/billing-accounts.service.ts` (`runPull`) gains a pre-flight sizing
  step and a branch to a remote-execution path.
- New automation for provisioning/tearing down disposable AWS compute (EC2 spot or Fargate).
