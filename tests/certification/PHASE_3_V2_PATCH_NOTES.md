# Phase 3 V2 Patch Notes

Fixes applied after Phase 3 V1 isolated verification:

1. `phase3-triage.test.ts` now supplies the required `CertificationReport.summary` fixture and adds deterministic triage/exporter coverage.
2. Firestore export uses Firebase Admin v13 modular CommonJS entry points through `createRequire`: `firebase-admin/app` and `firebase-admin/firestore`.
3. `.env.local` and `.env` are loaded without overriding explicit environment variables; `--env-file` is also supported. Split `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` credentials are supported with literal `\\n` decoding.
4. Firestore mapping follows production catalog/settings semantics: `products.is_addon=true` moves to `addons`, explicit addon docs take precedence, `geo_pricing_rules` is the default geo collection with `geo_rules` override support, recommendation/coverage collections are retained in the geo snapshot stream, and `settings/app_config` is the preferred settings base.
5. BOM triage now inspects serialized `expected` and `actual` values in addition to path/kind/message.

Phase 3 remains unfrozen until real Firestore snapshot export and production differential triage are independently verified.
