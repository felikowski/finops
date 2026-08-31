## ADDED Requirements

### Requirement: Pre-flight import size estimation
The system SHALL estimate a billing import's volume before starting ingestion, without fully reading the source file.

#### Scenario: Triggering a pull
- **WHEN** a billing account pull is triggered
- **THEN** a cheap size/row-count estimate of the source is obtained before any DuckDB read of the file begins

### Requirement: Threshold-based execution placement
The system SHALL compare the estimated volume against a configurable threshold and run the import in-process when under it, or on disposable remote compute when at or over it.

#### Scenario: A small periodic FOCUS pull
- **WHEN** the estimated row count is under the configured threshold
- **THEN** the import runs in-process on the existing backend, exactly as today, with no added latency

#### Scenario: An unusually large import
- **WHEN** the estimated row count is at or over the configured threshold
- **THEN** the system provisions a disposable AWS compute instance, runs the import there, and tears the instance down automatically once it completes

### Requirement: Shared infrastructure is never put at risk by a large import
No billing import, regardless of size, SHALL be permitted to run in a way that can exhaust the shared VPS's memory or make it unreachable.

#### Scenario: An import estimated over threshold
- **WHEN** the sizing check determines an import exceeds the safe in-process threshold
- **THEN** it is never executed in-process on the shared VPS backend, only on disposable compute
