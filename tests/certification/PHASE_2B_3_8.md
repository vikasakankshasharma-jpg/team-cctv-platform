# Phase 2B.3–2B.8

## Status
Wiring overlay under active verification. It is not a frozen certification milestone until the real secure-easy repository passes typecheck, integration smoke tests, and differential certification.

## Scope
1. Deterministic corpus and async shrinker
2. Semantic Oracle/production comparator
3. Snapshot-backed production adapters
4. Six real-repo integration smoke tests
5. Differential runner + discrepancy report
6. Firestore ephemeral write overlay
7. Offline WhatsApp dispatch safety
8. CLI support for snapshot bundles and named arguments

## CLI
```text
npm run cert:phase2b:diff -- --repo <secure-easy> --snapshot <CERTIFICATION_SNAPSHOT_BUNDLE.json> --out <report.json> --seed 20261111 --cases 25
```

The CLI also accepts the legacy positional form `<repo> <snapshot> <out>` and environment variables `CERT_REPO_ROOT`, `CERT_SNAPSHOT`, `CERT_OUT`, `CERT_SEED`, and `CERT_CASES`.

## Snapshot format
The CLI accepts either a raw `FrozenContext` JSON file or `CERTIFICATION_SNAPSHOT_BUNDLE.json`; when a bundle is supplied, `context` is used as the frozen context.

## Direct adapter execution
All production adapters install the snapshot shim inside `execute()`, so direct calls are deterministic and do not depend on `runProductionAdapter()` being used first. `runProductionAdapter()` remains the preferred runner because it standardizes case IDs and evidence.
