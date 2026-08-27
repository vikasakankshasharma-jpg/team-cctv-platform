# Disaster Recovery: Firestore Backup & Restore Runbook

## Automated Backups (GCP Scheduled)
In Production, Firestore does not support point-in-time recovery for free out of the box (requires setting up Point-in-Time Recovery - PITR).

**Setup Requirement for Production:**
1. Navigate to Google Cloud Console > Firestore > Data.
2. Enable **Point-in-Time Recovery (PITR)**. This retains all versions of documents for up to 7 days, allowing microsecond-level rollback in case a massive overwrite bug (e.g. `availableQty` reset) is pushed to prod.

## Export to Cloud Storage
For longer retention (e.g., end-of-year financial audits):
1. Create a GCS Bucket: `gs://secure-easy-backups`
2. Schedule a daily cron job via Cloud Scheduler triggering:
   `gcloud firestore export gs://secure-easy-backups/daily-$(date +%Y-%m-%d)`

## Restore Runbook (Catastrophic Failure)
If the Inventory Master is completely corrupted but the Ledger is intact:
1. DO NOT try to manually edit the Master.
2. Trigger the Reconciliation Engine: `GET /api/inventory/reconcile?fix=true` (You will need to implement the `fix=true` flag to automate the overwrite of Master `availableQty` with the Ledger summation).
3. If the Ledger itself is corrupted, use the PITR feature:
   `gcloud firestore databases restore --source-backup=<backup_id> --destination-database=secure-easy-restored`
