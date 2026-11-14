# TEAM CCTV Platform — Production Rollback Playbook & Disaster Recovery Protocol

**Document Version:** 1.0.0  
**Baseline Certification:** `TEAM-CCTV-CERT-V1`  
**Certified Commit SHA:** `c34cbb1`  
**Manifest Frozen Commit SHA:** `a58f4c3`  
**Status:** ACTIVE / MANDATORY PRODUCTION STANDARD  

---

## 1. Core Philosophy & Invariants

> **"Certification proves what was tested. Release Safety proves what is actually being deployed."**  
> **"Rollback is a deployment selection change, not a certification mutation."**

In the event of an unexpected regression, pricing discrepancy, or runtime crash in production, our primary mandate is restoring customer service deterministically while preserving auditability.

### The Five Invariants of Production Rollback
1. **Never Mutate the Certified Baseline:**  
   Emergency rollbacks must **NEVER** run `npm run cert:manifest` (manifest regeneration), modify `TEAM-CCTV-CERT-V1.json`, alter the oracle, touch snapshots, or patch `BUSINESS_RULES.md`.
2. **Deterministic SHA Anchoring:**  
   Rollback targets must always be concrete Git commit SHAs, never floating branches (`master`, `HEAD~1`) or moving tags.
3. **Decoupled Identity:**  
   The certification tag `TEAM-CCTV-CERT-V1` remains permanently bound to commit `c34cbb1`. New deployment releases receive distinct timestamps: `prod-YYYYMMDD-<sha>`.
4. **Mandatory Pre-Deployment Verification:**  
   Even during emergency rollbacks, manifest tamper verification (`npm run cert:manifest:verify`) and regression checks must pass before traffic is cut over.
5. **Zero Secrets in Deployment Metadata:**  
   Rollback execution must not expose or leak private keys, Firebase credentials, or payment secrets.

---

## 2. Incident Classification & Target Selection

When a production incident occurs, classify it into one of two tiers:

```text
                               Incident Detected
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        [ Tier 1: Infrastructure ]             [ Tier 2: Calculation / Pricing ]
        • Vercel edge runtime crash            • Unexpected totalPayable drift
        • Missing asset or bundle error        • Broken reverse GST reconciliation
        • Webhook timeout                      • Catalog SKU resolution anomaly
                    │                                     │
                    ▼                                     ▼
      Target: Previous Known-Good            Target: Certified Baseline Anchor
         Deployment Git SHA                         Commit: c34cbb1
    (e.g., prod-20261113-59c322b)               (TEAM-CCTV-CERT-V1)
```

### Known Anchors
| Role | Identifier / Git SHA | Tag | Notes |
|---|---|---|---|
| **Certified Baseline Anchor** | `c34cbb1` | `TEAM-CCTV-CERT-V1` | 100% verified baseline (Phase 5.3). 50/50 cases pass. |
| **Manifest Frozen Anchor** | `a58f4c3` | — | Frozen manifest baseline. |
| **Safety Boundary Release** | `59c322b` | — | Phase 6.1 runtime safety propagation. |
| **Observability Release** | `fbc4686` | — | Phase 6.2 telemetry & drift watcher. |

---

## 3. Step-by-Step Rollback Procedure

### Step 1: Incident Declaration & Triage
1. Record the incident details:
   - Active deployment version: `prod-YYYYMMDD-<sha>`
   - Triggering Request ID (`x-request-id`) or Quote ID (`quote_id`)
   - Telemetry event fingerprint (`calculationFingerprint`)
   - Observed error taxonomy code (`CALCULATION_ERROR`, `INFRASTRUCTURE_ERROR`, etc.)

### Step 2: Target Resolution
Run the rollback planner via the programmatic controller or select the target SHA manually:
- If rolling back to the **Certified Baseline Anchor**, select target SHA: `c34cbb1`.
- If rolling back to the **Previous Known-Good Release**, select its exact verified Git SHA.

### Step 3: Git & Deployment Execution
Execute the rollback via CI/CD pipeline or emergency CLI:

```bash
# 1. Fetch tags and target history
git fetch origin --tags

# 2. Checkout target immutable commit (detached HEAD, clean tree)
git checkout <TARGET_GIT_SHA>

# 3. Verify manifest integrity (Must exit 0)
npm run cert:manifest:verify

# 4. Verify certification regression (All 7 gates must PASS)
npm run cert:regression

# 5. Build production Next.js bundle
npm run build

# 6. Trigger production deployment stamped with:
#    prod-<YYYYMMDD>-<TARGET_SHORT_SHA>
```

---

## 4. Post-Rollback Automated Verification Checklist

Immediately following rollback traffic cutover, verify all 8 quality gates:

```text
[CHECK 1] Git SHA Match:
          Active Git commit SHA strictly matches target release SHA.

[CHECK 2] Certification Manifest Integrity:
          npm run cert:manifest:verify returns SUCCESS (0 exit code).

[CHECK 3] Production TypeScript Clean:
          npx tsc --noEmit and npm run cert:typecheck return 0 errors.

[CHECK 4] Critical Quotation Engine Smoke Test:
          Quotation engine calculates deterministic reference quotes without drift.

[CHECK 5] API Route Health:
          GET /api/release returns HTTP 200 with matching release metadata.
          POST /api/quotes returns HTTP 200 with valid QuoteDelivery.

[CHECK 6] Runtime Safety Boundary Active:
          validateMoneyIntegrity() blocks NaN/Infinity/negative totals.
          Error sanitization suppresses raw stack traces and [object Object].

[CHECK 7] Calculation Telemetry Active:
          Quotation calculations emit CalculationTelemetryEvent with valid SHA-256 fingerprints.

[CHECK 8] V1 Baseline Immutability:
          git status confirms tests/certification/manifest/TEAM-CCTV-CERT-V1.json is clean and unmodified.
```

---

## 5. Strict Prohibition List (What NEVER to Do)

❌ **NEVER** run `npm run cert:manifest` during an emergency rollback.  
❌ **NEVER** edit `tests/certification/manifest/TEAM-CCTV-CERT-V1.json` to force a build to pass.  
❌ **NEVER** move or delete the Git tag `TEAM-CCTV-CERT-V1`.  
❌ **NEVER** push unreviewed "quick fix" hotfix commits directly to `master` without certification regression.  
❌ **NEVER** bypass CI regression gates (`--no-verify`, skipping tests).  
❌ **NEVER** deploy an uncommitted local working tree (`git status` must be clean).  

---

## 6. Audit Trail & Post-Mortem

Following successful rollback:
1. Log the incident in CRM / engineering changelog with:
   - Faulty deployment version and rollback target deployment version.
   - Calculation fingerprint and request ID of the triggering anomaly.
   - Root cause analysis (catalog drift, infrastructure timeout, code regression).
2. If catalog data caused the incident:
   - Review `lib/observability/catalog-drift-watcher.ts` alerts.
   - Update `MARGIN_DRIFT_REGISTER.json` under Phase 5.3 governance if a commercial policy change was intended.
   - Mint a new release candidate `prod-YYYYMMDD-<newSha>` only after passing all 7 certification regression gates.
