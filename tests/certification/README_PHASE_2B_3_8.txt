Phase 2B.3–2B.8

Purpose
This phase wires the independent Phase 2A oracle to real secure-easy production surfaces and adds deterministic differential certification.

Production surfaces
- pricing-engine-v2
- variant-generator
- quotation-profit
- /api/quote/generate
- /api/build/calculate
- WhatsApp quote dispatch (offline/sandboxed)
- locked pricing-engine adapter retained from Phase 2B.2

Key guarantees
- Canonical inputs are translated at the production boundary; mixed camera requirements and technology_preference are preserved.
- Adapters install the frozen snapshot shim even when execute() is called directly.
- Firestore writes are ephemeral overlays; the frozen snapshot is not mutated.
- WhatsApp live outbound is disabled during certification.
- Differential shrinking re-runs oracle and production for each async candidate.
- Semantic comparison maps Oracle lines/totals to production calculatePricing mirror keys without treating Oracle bom summary objects as priced line arrays.

Run
- npm run cert:phase2b:3:typecheck
- npm run cert:phase2b:3:test
- npm run cert:phase2b:diff -- --repo <secure-easy> --snapshot <CERTIFICATION_SNAPSHOT_BUNDLE.json> --out <report.json>

Snapshot input may be raw FrozenContext JSON or a snapshot bundle; bundle.context is unwrapped automatically.

The phase is intentionally not frozen by this package alone. Real secure-easy typecheck, integration smoke tests, and differential results are required before lock.
