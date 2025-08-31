import { test, expect } from '@playwright/test';

// Basic flow: search → visit new prompt form exists
// Note: extend later to create data when API is ready

test.describe('search to prompt flow', () => {
  test('search page renders', async ({ page }) => {
    await page.goto('/search?q=test');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
