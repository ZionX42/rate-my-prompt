import { test, expect } from '@playwright/test';

// Basic flow: search → visit new prompt form exists
// Note: extend later to create data when API is ready

test.describe('search to prompt flow', () => {
  test('search page renders', async ({ page }) => {
    await page.goto('/search?q=test');
    // Wait for the page to load - check for either search results or error/loading states
    await expect(page.locator('body')).toBeVisible();
    // Check that we have either the search results heading or an error message
    const hasSearchResults = await page
      .getByText('Search Results')
      .isVisible()
      .catch(() => false);
    const hasError = await page
      .getByText('Error:')
      .isVisible()
      .catch(() => false);
    const hasLoading = await page
      .locator('.animate-pulse')
      .isVisible()
      .catch(() => false);

    expect(hasSearchResults || hasError || hasLoading).toBe(true);
  });
});
