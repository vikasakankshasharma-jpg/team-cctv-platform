# Incident Response Runbook: TEAM CCTV Platform

This document provides protocols for responding to security incidents and critical authentication failures.

## 1. Authentication Failure (OTP Protocol)

If administrators report being unable to receive OTPs:

### Step 1: Verify Provider Status
- Check [Resend Status](https://resend-status.com/) for email delivery issues.
- Check [Firebase Status](https://status.firebase.google.com/) for authentication service outages.

### Step 2: Emergency Login
If a super admin is locked out during a critical outage:
1.  Access the Firebase Console.
2.  Navigate to `admins` collection.
3.  Temporarily add a "Bypass Secret" field to the admin document (Requires code-level support for bypass field).
4.  **Recommended alternative**: Use a pre-verified hardware security key or secondary email if configured.

## 2. Security Incident (Unauthorized Access)

If suspicious activity is detected in `audit_logs`:

### Step 1: Immediate Lockdown
1.  Change the `is_active` status to `false` for the suspected admin in the `admins` collection.
2.  Revoke all active sessions in the Firebase Auth console for that user.

### Step 2: Damage Assessment
- Query the `audit_logs` for all actions performed by the compromised actor:
  ```javascript
  // Firestore Query Example
  db.collection('audit_logs').where('actor_email', '==', 'compromised@teamcctv.com').get();
  ```

### Step 3: Mitigation
- Rollback any malicious changes to `products` or `franchise_dealers` using the Disaster Recovery backup.

## 3. Vulnerability Management

### Automated Scanning
The CI pipeline runs a daily security audit. If a `CRITICAL` vulnerability is found:
1.  Run `npm audit fix` locally.
2.  Test the production build.
3.  Deploy the patch immediately.

### Reporting
Send security alerts to: `devops-security@teamcctv.com`
