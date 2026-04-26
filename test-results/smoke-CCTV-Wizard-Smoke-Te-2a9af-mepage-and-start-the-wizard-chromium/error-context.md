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
        - link "Get Quotation" [ref=e14] [cursor=pointer]:
          - /url: /wizard
          - img [ref=e15]
          - generic [ref=e17]: Get Quotation
        - generic [ref=e18]:
          - link "Support +91 97726 99395" [ref=e19] [cursor=pointer]:
            - /url: tel:+919772699395
            - img [ref=e20]
            - generic [ref=e24]:
              - generic [ref=e25]: Support
              - generic [ref=e26]: +91 97726 99395
          - generic [ref=e27]:
            - 'button "Toggle Theme (Current: system)" [ref=e28]':
              - img [ref=e30]
            - link "Staff Portal" [ref=e36] [cursor=pointer]:
              - /url: /admin/login
    - main [ref=e37]:
      - generic [ref=e38]:
        - generic [ref=e44]:
          - generic [ref=e45]:
            - img [ref=e46]
            - generic [ref=e49]: "Jaipur's #1 CCTV Estimator"
            - generic [ref=e51]: 100% Free & Instant
          - heading "High-Quality Security. For Your Jaipur Property." [level=1] [ref=e52]:
            - text: High-Quality Security.
            - text: For Your Jaipur Property.
          - paragraph [ref=e53]: Get an exact price for your CCTV setup in under 2 minutes. No technical knowledge needed—just answer a few simple questions and we'll do the rest.
          - generic [ref=e54]:
            - link "Get CCTV Quotation Online" [ref=e55] [cursor=pointer]:
              - /url: /wizard
              - text: Get CCTV Quotation Online
              - img [ref=e56]
            - generic [ref=e58]:
              - generic [ref=e59]: Instant Result
              - generic [ref=e60]: Ready in 2 minutes
        - generic [ref=e64]:
          - generic [ref=e65]:
            - generic [ref=e66]:
              - heading "How It Works" [level=2] [ref=e67]
              - heading "Smart Security Made for You." [level=3] [ref=e68]:
                - text: Smart Security
                - text: Made for You.
            - generic [ref=e69]:
              - generic [ref=e70]:
                - img [ref=e72]
                - generic [ref=e76]:
                  - heading "Perfect Coverage" [level=4] [ref=e77]
                  - paragraph [ref=e78]: We make sure every corner of your property is covered, leaving no blind spots for complete peace of mind.
              - generic [ref=e79]:
                - img [ref=e81]
                - generic [ref=e84]:
                  - heading "Right Cameras" [level=4] [ref=e85]
                  - paragraph [ref=e86]: We'll suggest the best camera quality for your specific needs, whether it's a small home or a large warehouse.
              - generic [ref=e87]:
                - img [ref=e89]
                - generic [ref=e93]:
                  - heading "Clear Pricing" [level=4] [ref=e94]
                  - paragraph [ref=e95]: Get three easy-to-understand price options (Value, Professional, and Elite) so you can choose what fits your budget.
          - generic [ref=e99]:
            - generic [ref=e101]:
              - generic [ref=e102]: System Quality
              - generic [ref=e103]: 99.9%
            - generic [ref=e106]:
              - generic [ref=e107]:
                - img [ref=e109]
                - generic [ref=e112]:
                  - generic [ref=e113]: View on Your Phone
                  - generic [ref=e114]: Check your cameras from anywhere
              - generic [ref=e115]:
                - img [ref=e117]
                - generic [ref=e119]:
                  - generic [ref=e120]: Clean Installation
                  - generic [ref=e121]: Neat wiring and professional finish
        - generic [ref=e123]:
          - img [ref=e125]
          - heading "Secure your space today." [level=2] [ref=e127]:
            - text: Secure your space
            - text: today.
          - paragraph [ref=e128]: 2-minute setup. No hidden costs. 18% GST included in all plans.
          - link "Get CCTV Quotation Online" [ref=e129] [cursor=pointer]:
            - /url: /wizard
            - text: Get CCTV Quotation Online
            - img [ref=e130]
          - generic [ref=e132]:
            - generic [ref=e133]:
              - generic [ref=e134]: Support & Clarification
              - heading "Frequently Asked Questions" [level=3] [ref=e135]
            - generic [ref=e136]:
              - generic [ref=e137]:
                - heading "Is GST included in the quote price?" [level=4] [ref=e138]
                - paragraph [ref=e139]: Yes. All our quotes include 18% GST. The price you see is the final CCTV with GST price you pay with no surprises.
              - generic [ref=e140]:
                - heading "Does the price include installation?" [level=4] [ref=e141]
                - paragraph [ref=e142]: Yes. Labor and wiring costs are calculated based on your property and included in the final CCTV camera price with installation.
              - generic [ref=e143]:
                - heading "How much does a 4 camera CCTV system cost in Jaipur?" [level=4] [ref=e144]
                - paragraph [ref=e145]: Prices are dynamic. As of Apr 2026, a standard 4-camera CP Plus system with professional installation typically ranges from ₹12,000 to ₹18,000 depending on wiring length and camera resolution.
              - generic [ref=e146]:
                - heading "Are your cameras STQC compliant and government approved?" [level=4] [ref=e147]
                - paragraph [ref=e148]: Yes. We only install STQC compliant hardware like CP Plus. We strictly do not install banned or non-compliant brands (such as Hikvision) for new installations to ensure your security and data privacy.
          - generic [ref=e149]:
            - generic [ref=e150]: Trusted Hardware Partners & Verified Installs
            - generic [ref=e151]:
              - generic [ref=e152]:
                - img [ref=e153]
                - generic [ref=e155]: CP PLUS
              - generic [ref=e156]:
                - img [ref=e157]
                - generic [ref=e160]: STQC APPROVED
              - generic [ref=e161]:
                - img [ref=e162]
                - generic [ref=e165]: SEAGATE
            - generic [ref=e166]:
              - img [ref=e167]
              - generic [ref=e169]: Serving 500+ Properties Across Jaipur, Rajasthan
    - contentinfo [ref=e170]:
      - generic [ref=e171]:
        - generic [ref=e172]:
          - generic [ref=e173]:
            - img [ref=e174]
            - text: TEAM SECURITY
          - paragraph [ref=e177]: India's leading intelligent security planning ecosystem. We combine advanced hardware logic with certified human expertise.
        - generic [ref=e178]:
          - generic [ref=e179]:
            - img [ref=e180]
            - generic [ref=e183]: ISO 27001 Certified Planner
          - generic [ref=e184]:
            - generic [ref=e185]: "Service Hubs:"
            - link "Jaipur" [ref=e186] [cursor=pointer]:
              - /url: /jaipur
          - generic [ref=e187]:
            - link "Privacy Policy" [ref=e188] [cursor=pointer]:
              - /url: /privacy-policy
            - link "Terms of Service" [ref=e189] [cursor=pointer]:
              - /url: /terms-of-service
            - link "Partner Login" [ref=e190] [cursor=pointer]:
              - /url: /admin/login
          - paragraph [ref=e191]: © 2026 TEAM SECURE SYSTEMS PVT LTD.
  - button "Open Next.js Dev Tools" [ref=e197] [cursor=pointer]:
    - img [ref=e198]
  - alert [ref=e201]
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