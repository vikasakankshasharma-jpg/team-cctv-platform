# TEAM CCTV – Enterprise Smart Quotation & Referral Platform

[![Quality Gates](https://github.com/team/cctv-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/team/cctv-platform/actions/workflows/ci.yml)
[![Production Ready](https://img.shields.io/badge/Status-100%25_Production_Ready-success.svg)](#)

> **Important:** Please see [HANDOVER.md](./HANDOVER.md) for complete technical handover documentation, architecture overview, and deployment procedures.
TEAM is a high-fidelity, production-hardened SaaS platform designed for professional CCTV sales automation, franchise lead management, and customer referral tracking.

## 🚀 Key Features

- **Expert Configurator**: A modular, state-driven quotation engine with server-side price recalculation.
- **Franchise Portal**: Territory-based lead routing and subscription-based partner management.
- **Enterprise Security**: Strict CSP/HSTS headers, Session-based RBAC, and Immutable Audit Logging.
- **Sales Intelligence**: Real-time KPI dashboards with performance-based visual coding.
- **Inventory Health**: Automated catalog deduplication and structural repair tools.

## 🛠 Tech Stack

- **Framework**: Next.js 16.2 (App Router)
- **State Management**: Zustand (Client) / Server Components (Server)
- **Database**: Firebase Firestore (Enterprise Rules Enforced)
- **Auth**: Firebase Auth (OTP-based)
- **Payments**: Cashfree (Subscriptions & EMI Orders)
- **Mailing**: Resend API
- **Styling**: Tailwind CSS 4.0

## 🔒 Security & Compliance

### Audit Logging
All administrative actions are tracked in the `audit_logs` collection. Each log includes:
- `actor_id` / `actor_email`
- `action` (e.g., `FRANCHISE_CREATE`, `PRODUCT_UPDATE`)
- `ip_address` & `user_agent`
- `metadata` (Diff of changes)

### Zero-Trust Pricing
The system ignores client-side pricing calculations during checkout. Every quote is re-validated and recalculated on the server using authoritative database values to prevent tampering.

### Middleware
Global `middleware.ts` enforces:
- **HSTS**: Strict Transport Security (Production only)
- **CSP**: Content Security Policy whitelisting Google Maps & Firebase
- **RBAC**: Protected routes for `/admin`, `/partner`, and `/salesperson`

## 📦 Operational Commands

### Catalog Maintenance
The platform uses a deduplicated 732-item master catalog.
- **Verification**: `npx tsx scratch/verify_db.ts`
- **Regeneration**: `npx tsx scratch/gen_markdown_catalog.ts`
- **Sync**: `python scratch/update_seeder_data.py`

### Testing & QA
- **E2E Flow**: `npx tsx scratch/verify_quotation_flow.ts`
- **Playwright (E2E & A11y)**: `npx playwright test`
- **CI Pipeline**: Automatically runs on PRs via `.github/workflows/ci.yml`.

## 📈 KPIs & Dashboards
The **Sales Dashboard** tracks conversion performance:
- **Conversion Rate**: Emerald (>20%) or Amber (<20%) indicators based on Won/Total leads ratio.

---
© 2026 TEAM CCTV. All Rights Reserved.
