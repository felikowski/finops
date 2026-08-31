## 1. Sizing check

- [ ] 1.1 Implement a cheap pre-import volume estimate (source file size via S3 `HEAD`, or a fast line count) that runs before ingestion starts
- [ ] 1.2 Add a configurable threshold and document its rationale, linking to the spike's OOM/VPS-unresponsive findings

## 2. Routing

- [ ] 2.1 Under threshold: keep running the import in-process on the backend, unchanged
- [ ] 2.2 Over threshold: provision a disposable AWS compute instance (EC2 spot or Fargate, per the spike's proven pattern), run the import there, and tear it down automatically when done

## 3. Verification

- [ ] 3.1 Confirm the local (small-import) path has no added latency or complexity from the sizing check
- [ ] 3.2 Run at least one over-threshold import end-to-end and confirm the shared VPS is unaffected (no repeat of the spike's "VPS became unreachable" incident)
