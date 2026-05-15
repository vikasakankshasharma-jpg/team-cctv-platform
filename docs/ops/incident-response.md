# Incident Response Runbook: TEAM CCTV Platform
Version: 1.0.0
Classification: INTERNAL / CONFIDENTIAL

## 1. Detection & Identification
Indents are typically detected via:
- **Sentry Alerts**: Error rate spikes > 1%
- **Vercel Logs**: HTTP 5xx responses
- **Upstash Monitoring**: Rate limit triggers
- **User Reports**: Customer support escalations

## 2. Response Matrix

| Severity | Description | Response Time | Action |
|----------|-------------|---------------|--------|
| SEV-0 | Total Site Down / Data Breach | < 15 mins | Immediate rollback + CTO Escalation |
| SEV-1 | Auth Failure / Quote Calc Errors | < 1 hour | Hotpatch + Admin notification |
| SEV-2 | UI Glitch / Minor Bug | < 24 hours | Scheduled fix in next deploy |

## 3. Playbooks

### 3.1 Data Breach / Unauthorized Access
1. **Revoke Sessions**: Execute `adminAuth.revokeRefreshTokens(uid)` for all suspected accounts.
2. **Rotate Secrets**: Immediately update `FIREBASE_PRIVATE_KEY` and `RESEND_API_KEY` in Vercel.
3. **Lockdown Firestore**: Temporarily update `firestore.rules` to `allow read, write: if false` for sensitive collections.

### 3.2 Lead Routing Failure
1. **Manual Queue**: Route all incoming leads to the `Master Admin` pool.
2. **Re-sync Territories**: Run `scripts/revalidate-territories.ts` to rebuild the pincode mapping cache.

### 3.3 Pricing Discrepancy
1. **Freeze Quotations**: Disable the "Confirm Quote" button on the client.
2. **Audit Pricing Engine**: Verify `lib/pricing-engine.ts` against the latest Physical Reference Sheets.
3. **Bulk Recalculate**: Use `bulkUpdateProducts` to reset any corrupt margin values.

## 4. Post-Mortem Requirement
Every SEV-0 or SEV-1 incident requires a written post-mortem within 48 hours to prevent recurrence.
