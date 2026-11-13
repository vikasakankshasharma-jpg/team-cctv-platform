# Phase 3 — Real Snapshot + Differential Triage

## Status
Phase 3 tooling is an implementation candidate. It is **not frozen** until a real production Firestore export validates successfully and the resulting differential report is reviewed.

## 1. Real Firestore snapshot export
`snapshot-certify.ts` now supports both the existing JSON-source mode and a live Firestore mode.

### Live Firestore mode
```bash
npm run cert:phase3:snapshot -- \
  --firestore \
  --out certification/snapshot-20261111 \
  --project-id <firebase-project-id> \
  --collections products,addons,addon_rules,geo_rules,promoters,app_config \
  --git-commit <secure-easy-git-sha> \
  --business-rules <business-rules-version> \
  --harness PHASE-3.0
```

Authentication uses `FIREBASE_SERVICE_ACCOUNT_JSON` when supplied, otherwise Firebase Admin Application Default Credentials. `FIREBASE_PROJECT_ID` / `GCLOUD_PROJECT` can supply the project id when `--project-id` is omitted.

The exporter writes `firestore-source.json`, then feeds that source through the existing frozen-snapshot builder and validator. The resulting `CERTIFICATION_SNAPSHOT_BUNDLE.json` remains the authoritative bundle consumed by differential certification.

## 2. Snapshot validation gate
Do not run differential certification against a bundle whose validation contains `CRITICAL` or `ERROR` findings. Warnings are review items and are preserved in evidence.

## 3. Differential certification
```bash
npm run cert:phase2b:diff -- \
  --repo . \
  --snapshot certification/snapshot-20261111/CERTIFICATION_SNAPSHOT_BUNDLE.json \
  --out certification/snapshot-20261111/differential-report.json \
  --seed 20261111 \
  --cases 25
```

## 4. Triage
```bash
npm run cert:phase3:triage -- \
  --report certification/snapshot-20261111/differential-report.json \
  --out certification/snapshot-20261111/differential-triage.json
```

Triage categories are deliberately evidence-oriented: `CLASSIFICATION`, `GST`, `BOM`, `LINE_ITEM`, `PRICING`, `POLICY`, `PRODUCTION_EXECUTION`, and `OTHER`. The tool does not silently mark a discrepancy as fixed or valid; it preserves the original case classification and finding evidence.

## 5. Review order
1. `INVALID` — verify production rejects/blocks the same impossible requirement.
2. `MANUAL_QUOTE` — verify production enters manual-quote policy at the same boundaries.
3. `VALID` — resolve pricing/BOM/tax/line-item discrepancies.
4. Re-run the same seed and corpus after every production fix.
5. Use `minimalCase` from the differential report as the regression fixture for the confirmed defect.

## Important
The independent Oracle remains the reference model. Production code must be changed only after a discrepancy is classified as a genuine production defect rather than a snapshot-data mismatch, stale business rule, or intentional production behavior.
