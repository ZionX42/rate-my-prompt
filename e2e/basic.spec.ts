import { test, expect } from '@playwright/test';

// Basic smoke: search → view prompts page exists
test('home loads and has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Prompt|Rate/i);
});
