Phase 3 — Real Firestore Snapshot + Differential Triage

This phase adds live Firestore snapshot export and deterministic discrepancy triage on top of the frozen Phase 2B harness.

Flow:
1. Export production Firestore into a JSON source.
2. Build and validate the canonical FrozenContext.
3. Freeze the snapshot bundle as evidence.
4. Run the existing Oracle-vs-production differential corpus.
5. Triage findings into classification, GST, BOM, line-item, pricing, policy, execution, or other categories.
6. Fix production only after the finding is proven to be a production defect.

Phase 3 is NOT frozen by tooling alone.
