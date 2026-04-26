# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> CCTV Wizard Smoke Test >> admin login page should be accessible
- Location: tests\smoke.spec.ts:23:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel(/email/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByLabel(/email/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e7]:
      - img [ref=e8]
    - generic [ref=e13]:
      - button "Open issues overlay" [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: "3"
          - generic [ref=e17]: "4"
        - generic [ref=e18]:
          - text: Issue
          - generic [ref=e19]: s
      - button "Collapse issues badge" [ref=e20]:
        - img [ref=e21]
  - generic [ref=e23]:
    - generic [ref=e24]:
      - img [ref=e28]
      - generic [ref=e31]:
        - generic [ref=e34]: Something Went Wrong
        - heading "Page Error." [level=1] [ref=e35]
        - paragraph [ref=e36]: We hit an unexpected issue. Please try refreshing the page. If the problem continues, our team has been automatically notified.
        - generic [ref=e37]:
          - paragraph [ref=e38]: "Dev — Exception Log:"
          - text: "auth/invalid-api-key: The Firebase API Key is missing or incorrectly defined."
      - generic [ref=e39]:
        - button "Refresh Page" [ref=e40]:
          - img [ref=e41]
          - text: Refresh Page
        - button "← Back to Home" [ref=e46]
    - generic: Elite System Integrity Protocol
  - alert [ref=e47]
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
  10 |     await expect(startButton).toBeVisible();
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
> 25 |     await expect(page.getByLabel(/email/i)).toBeVisible();
     |                                             ^ Error: expect(locator).toBeVisible() failed
  26 |     await expect(page.getByLabel(/password/i)).toBeVisible();
  27 |   });
  28 | });
  29 | 
```