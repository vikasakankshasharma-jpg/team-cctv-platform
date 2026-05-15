# Disaster Recovery Runbook: TEAM CCTV Platform
Version: 1.0.0
Classification: INTERNAL / CONFIDENTIAL

## 1. Overview
This document outlines the procedures for restoring the TEAM CCTV platform in the event of a catastrophic failure (e.g., regional outage, data loss, account compromise).

## 2. Core Infrastructure Components
| Component | Provider | Backup Method |
|-----------|----------|---------------|
| Database (Firestore) | Firebase | Automated Daily Backups + Monthly CSV Exports |
| Auth (Firebase) | Firebase | Immutable UID mappings |
| Files (Storage) | Firebase | Versioning Enabled |
| Logic (Next.js) | Vercel | Git-based Version Control |
| Cache (Redis) | Upstash | Global Replication |

## 3. Recovery Procedures

### 3.1 Firestore Data Restoration
In the event of accidental data deletion or corruption:
1. **Identify the Point-in-Time (PIT)**: Determine the last known good state.
2. **Execute Restore**: Use the `gcloud firestore import` command from the latest backup bucket.
3. **Audit Verification**: Run `npm run test:data-integrity` to ensure critical catalog items (1,732 nodes) are intact.

### 3.2 Authentication Recovery
If Firebase Auth becomes inaccessible:
1. **Switch to Backup SMS Provider**: Update `lib/auth-server.ts` to use Twilio fallback if standard Firebase OTP fails.
2. **Reset Admin Access**: Use the Firebase Admin SDK via `scripts/reset-admin.ts` to manually re-grant `super_admin` claims.

### 3.3 Domain/DNS Failure
If the primary domain (`cctvquotation.com`) is hijacked or down:
1. **Activate Standby Mirror**: Redirect Vercel traffic to `backup.teamcctv.com`.
2. **Update API Gateways**: Point Cashfree and Resend webhooks to the new mirror.

## 4. Continuity of Operations (COOP)
- **Primary Contact**: CTO / Lead Developer
- **Escalation**: System Architect
- **Emergency Channel**: Slack #ops-emergency
