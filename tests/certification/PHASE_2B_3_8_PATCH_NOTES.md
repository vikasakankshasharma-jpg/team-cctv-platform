# Phase 2B.3–2B.8 Patch Notes — V2

This overlay addresses the seven concrete failures found during the real `secure-easy` dry-run of the previous `phase2b-3-8-complete.zip`.

## Fixes
1. Deterministic corpus TypeScript access to optional `cable_type` is guarded.
2. WhatsApp offline wrapper accepts synchronous or asynchronous production handlers.
3. Removed illegal `total_cable_length_meters` from canonical corpus generation and shrink candidates.
4. Integration smoke skip logic is corrected; real-repo tests no longer skip when `lib/` and `app/` are present.
5. `DVR-001` now includes both `channel_capacity: 4` and `channels: 4`; smoke assertions reject zero-value/degraded execution and HTTP 400 responses.
6. Semantic comparator unwraps `calculatePricing`, selects Oracle `lines` instead of the nested `bom` summary, and maps Oracle/production totals to a unified semantic vocabulary.
7. Direct production adapter execution installs the frozen snapshot shim; quote-generate and WhatsApp bindings use translated production inputs.
8. Differential CLI accepts `--repo`, `--snapshot`, `--out`, `--seed`, and `--cases`, supports legacy positional arguments, and unwraps `CERTIFICATION_SNAPSHOT_BUNDLE.json.context`.
9. Phase 2B.3–2B.8 documentation is refreshed to remove stale 2B.1/2B.2 and unwired claims.

## Verification boundary
This package is an overlay and must be layered on the locked Phase 1 + Phase 2A v4-fixed + Phase 2B.1/2B.2 v5 base. The real `secure-easy` repository is required for final production integration verification.
