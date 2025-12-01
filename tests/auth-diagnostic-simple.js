const { test, expect } = require('@playwright/test');

// Simple diagnostic test to check if the application is running
test.describe('Application Accessibility Diagnostic', () => {
  test('Check if application is running and accessible', async ({ page }) => {
    try {
      // Try to access the home page
      const response = await page.goto('http://localhost:3001', { 
        timeout: 10000,
        waitUntil: 'domcontentloaded'
      });
      
      console.log('Home page response status:', response?.status());
      
      // Check if we can access the login page
      const loginResponse = await page.goto('http://localhost:3001/login', {
        timeout: 10000,
        waitUntil: 'domcontentloaded'
      });
      
      console.log('Login page response status:', loginResponse?.status());
      
      // Check if login form elements exist
      const emailInput = await page.$('#email');
      const passwordInput = await page.$('#password');
      const submitButton = await page.$('button[type="submit"]');
      
      console.log('Email input found:', !!emailInput);
      console.log('Password input found:', !!passwordInput);
      console.log('Submit button found:', !!submitButton);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'diagnostic-login-page.png' });
      
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(submitButton).toBeTruthy();
      
    } catch (error) {
      console.error('Diagnostic test failed:', error.message);
      await page.screenshot({ path: 'diagnostic-error.png' });
      throw error;
    }
  });
});