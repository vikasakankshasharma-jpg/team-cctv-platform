import { test, expect } from '@playwright/test';

test.describe('P0: API Rate Limiting & Abuse Protection', () => {

  test('Should block excessive requests to secure endpoints (429 Too Many Requests)', async ({ request }) => {
    // Determine target endpoint (e.g., OTP auth or Quote generator)
    const targetEndpoint = '/api/send-otp';
    const numRequests = 6; // STRICT policy allows 5 per minute
    
    let lastStatus = 200;
    let hitRateLimit = false;

    // Send rapid consecutive requests
    for (let i = 0; i < numRequests; i++) {
      const response = await request.post(targetEndpoint, {
        data: {
          mobile: "9999999999",
          purpose: "login"
        },
        headers: {
          "x-forwarded-for": "127.0.0.1" // Mock IP for rate limiter
        }
      });
      
      lastStatus = response.status();
      
      if (lastStatus === 429) {
        hitRateLimit = true;
        break;
      }
      
      // Delay slightly to prevent socket hangup, but still trigger limiter
      await new Promise(r => setTimeout(r, 100));
    }

    // After 5 requests, the 6th MUST return 429 Too Many Requests
    expect(hitRateLimit).toBe(true);
    expect(lastStatus).toBe(429);
  });

});
