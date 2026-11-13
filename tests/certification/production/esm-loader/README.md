# Certification-only Node 24 ESM seam

Run the certification process with `node --import ./tests/certification/production/esm-loader/register.mjs ...` and set `CERT_REPO_ROOT` to the secure-easy root.

The hook resolves:
- `@/*` aliases
- extensionless relative TypeScript modules
- `.ts` / `.tsx` source through `typescript.transpileModule`
- `next/server`
- `firebase-admin`, `firebase-admin/firestore`, and `firebase-admin/app`
- relative `cached-catalog` / `cached-settings` modules

Production source is not modified. The shims are certification-only and must never be imported by `lib/*` or `app/*` directly.
