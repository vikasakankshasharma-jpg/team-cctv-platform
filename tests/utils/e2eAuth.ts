import { Page, expect } from '@playwright/test';

/**
 * Authenticates a Playwright Page instance by navigating to the hidden E2E login route.
 * This ensures the Firebase Client SDK is fully authenticated AND the Next.js session cookie is set.
 */
export async function authenticateRole(page: Page, role: "admin" | "salesperson" | "dealer") {
  // Navigate to our hidden login page
  const redirectUrl = role === "dealer" ? "/partner/dashboard"    : role === 'salesperson' 
      ? '/salesperson/dashboard' 
      : '/admin';
  await page.goto(`/test-login?role=${role}&redirect=${encodeURIComponent(redirectUrl)}`);
  
  // Wait for the authentication sequence to succeed and redirect
  await expect(page.locator('[data-testid="e2e-status"]')).toHaveText('Success! Redirecting...', { timeout: 15000 });
  
  // Wait for the target page to load
  await page.waitForTimeout(5000);
}
