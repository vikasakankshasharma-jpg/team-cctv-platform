# TEAM CCTV Platform - Handover Documentation

## System Architecture
The TEAM CCTV Platform is built using a modern, scalable stack designed for maximum conversion and performance.

### Tech Stack
- **Framework:** Next.js 16.2 (App Router)
- **Frontend/Styling:** React 19, Tailwind CSS, Lucide Icons
- **Language:** TypeScript (`strict: true` enabled)
- **Database/Backend:** Firebase (Firestore, Auth, Storage)
- **Performance:** Turbopack, Core Web Vitals optimized

### Core Workflows
1. **Landing Page:** Geolocation-aware landing page (e.g., `/[city]`) dynamically serves pricing and SEO metadata.
2. **Wizard Configurator (`/wizard`):** Multi-step lead generation form capturing property details.
3. **Quotation Generation (`/quote/[leadId]/review/[quoteId]`):** Interactive Smart Context Bar and real-time PDF generation.

---

## Deployment & Build
The application is fully production-ready and passes 100% of all Type Checks, Linting rules, and Accessibility scans.

**Build Command:**
```bash
npm run build
```
*Note: Ensure all Firebase and Upstash Redis environment variables are provided during build/deploy to prevent warning logs.*

**Local Development:**
```bash
npm run dev
```

---

## Testing & QA
### E2E Testing (Playwright)
End-to-End user journeys are fully automated and verified via Playwright.

**Run All Tests:**
```bash
npx playwright test
```

**Key Test Suites:**
- `quotation.spec.ts`: Tests the Quotation generation and rendering logic.
- `quote-booking-flow.spec.ts`: Tests the entire checkout/booking flow from Configurator to PDF.
- `a11y.spec.ts`: Asserts 100% automated accessibility compliance (Axe-core) across the Landing Page and Wizard flows.

*Testing Note: Firebase OTP authentication is bypassed during Playwright execution using the hardcoded `9999999999` test account to avoid ReCAPTCHA.*

---

## Security & Maintenance
- **Vulnerabilities:** `npm audit` resolves to 0 high-severity vulnerabilities.
- **Linting:** 0 ESLint warnings/errors (`npm run lint`).
- **Dependencies:** Avoid blindly upgrading Next.js or Firebase without verifying the `firebase-admin` compatibility matrix.

## Directory Structure
- `/app`: Next.js App Router (Layouts, Pages, APIs)
- `/components`: Reusable UI components (Shared, Quotation, Wizard, Admin)
- `/lib`: Utility functions, pricing engines, and Firebase client initialization
- `/tests`: Playwright E2E and Accessibility test suites
- `/store`: Zustand state management stores
