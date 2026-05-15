# Disaster Recovery Runbook: TEAM CCTV Platform

This document outlines the procedures for data preservation, restoration, and service continuity in the event of a catastrophic failure.

## 1. Firestore Data Preservation

Firestore backups are managed via Google Cloud CLI (`gcloud`).

### Periodic Manual Backup
Run this command from a machine with `gcloud` authenticated as a project owner:

```bash
gcloud firestore export gs://[YOUR_BACKUP_BUCKET_NAME] --project [YOUR_PROJECT_ID]
```

### Emergency Restoration
To restore a specific backup to the production database:

```bash
gcloud firestore import gs://[YOUR_BACKUP_BUCKET_NAME]/[BACKUP_ID]/ --project [YOUR_PROJECT_ID]
```

> [!CAUTION]
> Importing a backup will overwrite existing documents with the same ID. Ensure you have analyzed the data discrepancy before performing a full import.

## 2. Infrastructure Restoration

The application is deployed as a Next.js project. In case of a hosting provider outage (e.g., Vercel):

1.  **Code Base**: Ensure all changes are pushed to the `main` branch on GitHub.
2.  **Environment Variables**: Maintain a secure backup of the `.env.production` file.
3.  **DNS Failover**: If using a custom domain, ensure access to the registrar to update A/CNAME records if moving to a fallback region.

## 3. Critical Component Failover

| Component | Potential Issue | Mitigation Strategy |
| :--- | :--- | :--- |
| **Resend (Email OTP)** | Delivery Failure | Switch to secondary provider or enable "Super Admin Bypass Code" (Emergency only). |
| **Cashfree (Payments)** | API Timeout | Leads remain saved in Firestore; manually process payments once service is restored. |
| **Firebase Auth** | Global Outage | Platform remains operational for public users; admin logins will be disabled until service recovery. |

## 4. Post-Mortem Procedure
1.  **Stabilize**: Fix the immediate issue.
2.  **Analyze**: Review `audit_logs` in Firestore to identify if the issue was triggered by an administrative action.
3.  **Document**: Update this runbook if new failure modes are identified.
