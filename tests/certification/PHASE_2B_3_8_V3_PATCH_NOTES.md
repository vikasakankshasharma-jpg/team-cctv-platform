# Phase 2B.3–2B.8 V3 Patch Notes

## Blocking fixes

1. **Archive layout** — certification files are packaged directly at ZIP root; no `p23/` wrapper.
2. **Differential CLI TypeScript** — `firstExisting()` now maps `resolve()` with an explicit single-argument callback.
3. **Differential CLI named flags** — `--repo`, `--snapshot`, `--out`, `--seed`, and `--cases` are explicitly accepted.
4. **Wireless corpus enum** — replaced invalid `wifi` with canonical `indoor_fixed`.
5. **Offline WhatsApp evidence** — the adapter captures outbound JSON payloads from both stubbed `fetch` bodies and simulated `console.warn` payloads, returning them as `outboundPayloads`; the integration test asserts non-empty payload evidence and rejects the no-match fallback.

## Verification intent

This patch is intentionally **not a phase freeze**. Real-repo verification must still establish:

- certification TypeScript typecheck passes;
- all Phase 2B.3–2B.8 self-tests pass with zero skips when the real repository is present;
- differential CLI accepts named flags and executes against the supplied snapshot bundle;
- no live WhatsApp/Meta/MSG91 network call is permitted during certification.
