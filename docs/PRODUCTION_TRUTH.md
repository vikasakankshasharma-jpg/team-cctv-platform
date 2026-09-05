# Production Truth & Credential Tracking

> **Rule:** Never mark a credential as `ROTATED` or `VERIFIED` based solely on local files. Evidence from the actual deployment/environment is mandatory.

> [!NOTE]
> **GIT HISTORY SCRUBBED:** The Git history across all branches was scrubbed using `git-filter-repo` on 2026-09-05. Leaked scripts and credential-bearing files (`push-vercel-env.js`, `push-vercel-env.ps1`, `fix-keys.js`, `scripts/read-otp.mjs`, `lint_results.json`, `lint_results.txt`, `add-demo-addons.mjs`, `scripts/add-firebase-domain.mjs`, `scripts/check-api-key.mjs`) have been purged from all historical commits, and the sanitized tree was force-pushed to `master`. Operators must still ensure the key is revoked in GCP Console.

## Immediate Operator Actions Required

### 1. Revoke the Firebase Admin Key in Google Cloud Console
1. Go to **Google Cloud Console → IAM & Admin → Service Accounts**
2. Find `firebase-adminsdk-fbsvc@team-cctv-live-8294.iam.gserviceaccount.com`
3. Click → **Keys** tab → **Delete** the old key
4. Generate a **new** key → download JSON
5. Set the new `FIREBASE_ADMIN_PRIVATE_KEY` value in **Vercel Environment Variables only** (never commit it)
6. Redeploy the Vercel app so it picks up the new key

### 2. Git History Scrub Complete
The git history has been purged and verified:
- Cleaned with `git-filter-repo`
- Sanitized `master` pushed to origin
- Zero raw private key matches remain in historical commits

### 3. Restrict API Keys
- `NEXT_PUBLIC_FIREBASE_API_KEY` → GCP Console → API Restrictions → HTTP referrer: `cctvquotation.com`, `*.cctvquotation.com`, `localhost:3000`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → same referrer restrictions

## Credential Lifecycle Status

| Credential | Purpose | Repo Status | Cloud Status | Required Action |
| :--- | :--- | :---: | :---: | :--- |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Service Account backend access | **PURGED FROM GIT HISTORY** | Active (Project: `team-cctv-live-8294`) | Revoke old key in GCP Console, set new key in Vercel only. |
| `FIREBASE_CLIENT_EMAIL` | Service Account identifier | **PURGED FROM LEAKED SCRIPTS** | Active | Rotate with service account key. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web Client Auth/DB | Public (by design) | Active | Restrict to allowed domains in GCP. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Geolocation & Pincode routing | Public (by design) | Active | Restrict HTTP referrer to `cctvquotation.com`. |
| `RAZORPAY_KEY_ID` | Payment gateway public identifier | Env-only | Active | Verify matching production/test environment. |
| `RAZORPAY_KEY_SECRET` | Payment order generation | Env-only | Active | Keep strictly server-side (no `NEXT_PUBLIC_`). |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature HMAC | Env-only | **Hardcoded fallback REMOVED** | Verify set correctly in Vercel dashboard. |
| `CASHFREE_*` | Cashfree API (RETIRED) | **Deleted from code** | Decommission | Remove from Vercel env vars. |

## Production Mutating Guardrails
1. No destructive deletes on production collections (`quotes`, `leads`, `products`, `users`).
2. No automated cloud credential rotation from local scripts.
3. Developer runs test transactions using test mode API keys before live mode toggle.
4. All code pushes go to a feature branch, never direct to `master` — reviewed before merge.

