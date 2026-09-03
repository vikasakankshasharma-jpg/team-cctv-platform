# Production Truth & Credential Tracking

> **Rule:** Never mark a credential as `ROTATED` or `VERIFIED` based solely on local files. Evidence from the actual deployment/environment is mandatory.

> [!CAUTION]
> **BREACH STILL LIVE:** The Firebase Admin private key is fully recoverable from git history (commit `d8f5699`). Deleting the file from the working tree does NOT remove it from history. The key must be **revoked in Google Cloud Console** AND the git history must be **scrubbed** before this breach is closed.

## Immediate Operator Actions Required

### 1. Revoke the Firebase Admin Key (HIGHEST PRIORITY)
1. Go to **Google Cloud Console → IAM & Admin → Service Accounts**
2. Find `firebase-adminsdk-fbsvc@team-cctv-live-8294.iam.gserviceaccount.com`
3. Click → **Keys** tab → **Delete** the compromised key
4. Generate a **new** key → download JSON
5. Set the new `FIREBASE_ADMIN_PRIVATE_KEY` value in **Vercel Environment Variables only** (never commit it)
6. Redeploy the Vercel app so it picks up the new key

### 2. Scrub Git History
After revoking the old key (so the scrub isn't a race against time):
```bash
# Option A: BFG Repo-Cleaner (recommended, simpler)
bfg --delete-files staging-firebase-adminsdk.json
bfg --delete-files push-vercel-env.js
bfg --delete-files push-vercel-env.ps1
bfg --delete-files fix-keys.js
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force

# Option B: git filter-repo (if BFG unavailable)
git filter-repo --invert-paths --path staging-firebase-adminsdk.json --path push-vercel-env.js --path push-vercel-env.ps1 --path fix-keys.js
git push --force
```

### 3. Restrict API Keys
- `NEXT_PUBLIC_FIREBASE_API_KEY` → GCP Console → API Restrictions → HTTP referrer: `cctvquotation.com`, `*.cctvquotation.com`, `localhost:3000`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → same referrer restrictions

## Credential Lifecycle Status

| Credential | Purpose | Repo Status | Cloud Status | Required Action |
| :--- | :--- | :---: | :---: | :--- |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Service Account backend access | **EXPOSED IN GIT HISTORY** (commit `d8f5699`) | Active (Project: `team-cctv-live-8294`) | **REVOKE NOW** in GCP Console, generate new, set in Vercel only. |
| `FIREBASE_CLIENT_EMAIL` | Service Account identifier | **EXPOSED** | Active | Rotate with service account key. |
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

