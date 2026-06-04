import { test, expect } from '@playwright/test';

test.describe('AI Chat & Feedback Loop', () => {
  test('User can ask a question, receive an answer, and provide negative feedback', async ({ page }) => {
    // 0. Mock the API responses so the test is fast and doesn't consume Gemini tokens or hit the DB
    await page.route('/api/chat', async route => {
      await route.fulfill({ json: { content: 'This is a mocked answer.', isFromStudent: false, brainId: 'mock-123' } });
    });
    await page.route('/api/chat/feedback', async route => {
      await route.fulfill({ json: { success: true } });
    });

    // 1. Navigate to the homepage
    await page.goto('/');

    // 2. Open the AI Chat Widget
    const chatToggle = page.getByLabel('Toggle AI Assistant');
    await expect(chatToggle).toBeVisible();
    await chatToggle.click();

    // 3. Ensure chat window is open
    // 4. Send a test message
    const input = page.locator('input[placeholder="Ask a question..."]');
    await expect(input).toBeVisible();
    
    // Using a very specific test phrase so it doesn't pollute the real brain
    await input.fill('E2E_TEST: What is the primary purpose of this website?');
    await input.press('Enter');

    // 5. Wait for the AI's response to appear
    const aiMessage = page.locator('p.text-sm:has-text("This is a mocked answer.")');
    await expect(aiMessage).toBeVisible({ timeout: 10000 });

    // 6. Find the Thumbs Down button on the last assistant message
    const thumbsDownButton = page.locator('button[title="Bad answer"]').last();
    await expect(thumbsDownButton).toBeVisible({ timeout: 10000 });

    // 7. Click Thumbs Down and wait for optimistic UI update (e.g. color change or disabled state)
    await thumbsDownButton.evaluate(node => (node as HTMLElement).click());

    // Verify it reacted to the click (disabled)
    await expect(thumbsDownButton).toBeDisabled();
    
    // Assert the Thumbs Up button is also disabled because feedback is submitted
    const thumbsUpButton = page.locator('button[title="Good answer"]').last();
    await expect(thumbsUpButton).toBeDisabled();
  });
});
