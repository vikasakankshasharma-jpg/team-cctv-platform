import { test, expect } from '@playwright/test';

test.describe('Route Security & Attack Surface', () => {
  const unsafeRoutes = [
    '/api/scripts/db-update',
    '/api/test-mock',
    '/api/test-cameras',
    '/api/test-login',
    '/api/debug-mode',
    '/api/mock-payment'
  ];

  for (const route of unsafeRoutes) {
    test(`Unsafe route ${route} should return 404`, async ({ request }) => {
      // We expect the production build to return 404 for these endpoints.
      const response = await request.get(route);
      expect(response.status()).toBe(404);
      
      // Also verify POST behavior
      const postResponse = await request.post(route);
      expect(postResponse.status()).toBe(404);
    });
  }
});
