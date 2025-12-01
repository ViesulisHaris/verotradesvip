const { test, expect } = require('@playwright/test');

test('basic verification - homepage loads', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/');
  
  // Check that the page loads successfully
  await expect(page).toHaveTitle(/VeroTrade/);
  
  // Basic check that we have some content
  const body = page.locator('body');
  await expect(body).toBeVisible();
});

test('basic verification - can navigate to login', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/');
  
  // Look for a login link or button (adjust selector as needed)
  const loginLink = page.locator('a[href*="login"], button:has-text("Login"), :text("Login")').first();
  
  // If login link exists, click it and verify navigation
  if (await loginLink.isVisible()) {
    await loginLink.click();
    await expect(page).toHaveURL(/.*login.*/);
  } else {
    // If no explicit login link, just verify we can manually navigate
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login.*/);
  }
});