# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> CCTV Wizard Smoke Test >> should load the homepage and start the wizard
- Location: tests\smoke.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: /start|get quote/i }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: /start|get quote/i }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - link "TEAM CCTV Smart Security Ecosystem" [ref=e5] [cursor=pointer]:
          - /url: /
          - img [ref=e7]
          - generic [ref=e10]:
            - generic [ref=e11]: TEAM CCTV
            - generic [ref=e12]: Smart Security Ecosystem
        - link "Quote" [ref=e14] [cursor=pointer]:
          - /url: /wizard
          - img [ref=e15]
          - generic [ref=e17]: Quote
        - 'button "Toggle Theme (Current: system)" [ref=e20]':
          - img [ref=e22]
    - main [ref=e28]:
      - generic [ref=e29]:
        - generic [ref=e35]:
          - generic [ref=e36]:
            - img [ref=e37]
            - generic [ref=e40]: "Jaipur's #1 CCTV Estimator"
            - generic [ref=e42]: 100% Free & Instant
          - heading "High-Quality Security. For Your Jaipur Property." [level=1] [ref=e43]:
            - text: High-Quality Security.
            - text: For Your Jaipur Property.
          - paragraph [ref=e44]: Get an exact price for your CCTV setup in under 2 minutes. No technical knowledge needed—just answer a few simple questions and we'll do the rest.
          - generic [ref=e45]:
            - link "Get CCTV Quotation Online" [ref=e46] [cursor=pointer]:
              - /url: /wizard
              - text: Get CCTV Quotation Online
              - img [ref=e47]
            - generic [ref=e49]:
              - generic [ref=e50]: Instant Result
              - generic [ref=e51]: Ready in 2 minutes
        - generic [ref=e55]:
          - generic [ref=e56]:
            - generic [ref=e57]:
              - heading "How It Works" [level=2] [ref=e58]
              - heading "Smart Security Made for You." [level=3] [ref=e59]:
                - text: Smart Security
                - text: Made for You.
            - generic [ref=e60]:
              - generic [ref=e61]:
                - img [ref=e63]
                - generic [ref=e67]:
                  - heading "Perfect Coverage" [level=4] [ref=e68]
                  - paragraph [ref=e69]: We make sure every corner of your property is covered, leaving no blind spots for complete peace of mind.
              - generic [ref=e70]:
                - img [ref=e72]
                - generic [ref=e75]:
                  - heading "Right Cameras" [level=4] [ref=e76]
                  - paragraph [ref=e77]: We'll suggest the best camera quality for your specific needs, whether it's a small home or a large warehouse.
              - generic [ref=e78]:
                - img [ref=e80]
                - generic [ref=e84]:
                  - heading "Clear Pricing" [level=4] [ref=e85]
                  - paragraph [ref=e86]: Get three easy-to-understand price options (Value, Professional, and Elite) so you can choose what fits your budget.
          - generic [ref=e90]:
            - generic [ref=e92]:
              - generic [ref=e93]: System Quality
              - generic [ref=e94]: 99.9%
            - generic [ref=e97]:
              - generic [ref=e98]:
                - img [ref=e100]
                - generic [ref=e103]:
                  - generic [ref=e104]: View on Your Phone
                  - generic [ref=e105]: Check your cameras from anywhere
              - generic [ref=e106]:
                - img [ref=e108]
                - generic [ref=e110]:
                  - generic [ref=e111]: Clean Installation
                  - generic [ref=e112]: Neat wiring and professional finish
        - generic [ref=e114]:
          - img [ref=e116]
          - heading "Secure your space today." [level=2] [ref=e118]
          - paragraph [ref=e119]: 2-minute setup. No hidden costs. 18% GST included in all plans.
          - link "Get CCTV Quotation Online" [ref=e120] [cursor=pointer]:
            - /url: /wizard
            - text: Get CCTV Quotation Online
            - img [ref=e121]
          - generic [ref=e123]:
            - generic [ref=e124]:
              - generic [ref=e125]: Support & Clarification
              - heading "Frequently Asked Questions" [level=3] [ref=e126]
            - generic [ref=e127]:
              - generic [ref=e128]:
                - heading "Is GST included in the quote price?" [level=4] [ref=e129]
                - paragraph [ref=e130]: Yes. All our quotes include 18% GST. The price you see is the final CCTV with GST price you pay with no surprises.
              - generic [ref=e131]:
                - heading "Does the price include installation?" [level=4] [ref=e132]
                - paragraph [ref=e133]: Yes. Labor and wiring costs are calculated based on your property and included in the final CCTV camera price with installation.
              - generic [ref=e134]:
                - heading "How much does a 4 camera CCTV system cost in Jaipur?" [level=4] [ref=e135]
                - paragraph [ref=e136]: Prices are dynamic. As of Apr 2026, a standard 4-camera CP Plus system with professional installation typically ranges from ₹12,000 to ₹18,000 depending on wiring length and camera resolution.
              - generic [ref=e137]:
                - heading "Are your cameras STQC compliant and government approved?" [level=4] [ref=e138]
                - paragraph [ref=e139]: Yes. We only install STQC compliant hardware like CP Plus. We strictly do not install banned or non-compliant brands (such as Hikvision) for new installations to ensure your security and data privacy.
          - generic [ref=e140]:
            - generic [ref=e141]: Trusted Hardware Partners & Verified Installs
            - generic [ref=e142]:
              - generic [ref=e143]:
                - img [ref=e144]
                - generic [ref=e146]: CP PLUS
              - generic [ref=e147]:
                - img [ref=e148]
                - generic [ref=e151]: STQC APPROVED
              - generic [ref=e152]:
                - img [ref=e153]
                - generic [ref=e156]: SEAGATE
            - generic [ref=e157]:
              - img [ref=e158]
              - generic [ref=e160]: Serving 500+ Properties Across Jaipur, Rajasthan
    - contentinfo [ref=e161]:
      - generic [ref=e162]:
        - generic [ref=e163]:
          - generic [ref=e164]:
            - img [ref=e165]
            - text: TEAM SECURITY
          - paragraph [ref=e168]: India's leading intelligent security planning ecosystem. We combine advanced hardware logic with certified human expertise.
        - generic [ref=e169]:
          - generic [ref=e170]:
            - img [ref=e171]
            - generic [ref=e174]: ISO 27001 Certified Planner
          - generic [ref=e175]:
            - generic [ref=e176]: "Service Hubs:"
            - link "Jaipur" [ref=e177] [cursor=pointer]:
              - /url: /jaipur
          - generic [ref=e178]:
            - link "Privacy Policy" [ref=e179] [cursor=pointer]:
              - /url: /privacy-policy
            - link "Terms of Service" [ref=e180] [cursor=pointer]:
              - /url: /terms-of-service
            - link "Partner Login" [ref=e181] [cursor=pointer]:
              - /url: /admin/login
          - paragraph [ref=e182]: © 2026 TEAM SECURE SYSTEMS PVT LTD.
  - button "Open Next.js Dev Tools" [ref=e188] [cursor=pointer]:
    - img [ref=e189]
  - alert [ref=e192]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('CCTV Wizard Smoke Test', () => {
  4  |   test('should load the homepage and start the wizard', async ({ page }) => {
  5  |     // 1. Visit homepage
  6  |     await page.goto('/');
  7  |     
  8  |     // 2. Check for the main CTA
  9  |     const startButton = page.getByRole('link', { name: /start|get quote/i }).first();
> 10 |     await expect(startButton).toBeVisible();
     |                               ^ Error: expect(locator).toBeVisible() failed
  11 |     
  12 |     // 3. Click and navigate to wizard
  13 |     await startButton.click();
  14 |     await expect(page).toHaveURL(/.*wizard/);
  15 |     
  16 |     // 4. Check if the first question loads
  17 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  18 |     
  19 |     // 5. Verify progress bar exists
  20 |     await expect(page.locator('.progress-bar, [role="progressbar"]')).toBeVisible();
  21 |   });
  22 | 
  23 |   test('admin login page should be accessible', async ({ page }) => {
  24 |     await page.goto('/admin/login');
  25 |     await expect(page.getByLabel(/email/i)).toBeVisible();
  26 |     await expect(page.getByLabel(/password/i)).toBeVisible();
  27 |   });
  28 | });
  29 | 
```