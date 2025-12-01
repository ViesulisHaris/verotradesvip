const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'testuser@verotrade.com',
  password: 'TestPassword123!',
  invalidEmail: 'invalid@example.com',
  invalidPassword: 'wrongpassword',
  newUserEmail: 'newuser@example.com',
  newUserPassword: 'newpassword123'
};

test.describe('Authentication Diagnostic Tests', () => {
  test('Diagnostic: Check if application is running and accessible', async ({ page }) => {
    console.log('🔍 [DIAG] Checking if application is running...');
    
    try {
      // Check if we can reach the base URL
      const response = await page.goto(BASE_URL, { timeout: 10000 });
      console.log(`🔍 [DIAG] Response status: ${response.status()}`);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      console.log(`🔍 [DIAG] Current URL after load: ${page.url()}`);
      
      // Check page content
      const title = await page.title();
      console.log(`🔍 [DIAG] Page title: ${title}`);
      
      // Check if we can find any common elements
      const body = await page.$('body');
      console.log(`🔍 [DIAG] Body element found: ${!!body}`);
      
      // Take screenshot for visual verification
      await page.screenshot({ path: 'diagnostic-app-accessibility.png' });
      console.log('🔍 [DIAG] Screenshot saved: diagnostic-app-accessibility.png');
      
      // Check if login page exists
      try {
        await page.goto(`${BASE_URL}/login`, { timeout: 10000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        console.log(`🔍 [DIAG] Login page URL: ${page.url()}`);
        
        // Look for login form
        const loginForm = await page.$('form');
        console.log(`🔍 [DIAG] Login form found: ${!!loginForm}`);
        
        if (loginForm) {
          // Look for email field
          const emailField = await page.$('#email, input[type="email"], input[name="email"]');
          console.log(`🔍 [DIAG] Email field found: ${!!emailField}`);
          
          // Look for password field
          const passwordField = await page.$('#password, input[type="password"], input[name="password"]');
          console.log(`🔍 [DIAG] Password field found: ${!!passwordField}`);
          
          // Look for submit button
          const submitButton = await page.$('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
          console.log(`🔍 [DIAG] Submit button found: ${!!submitButton}`);
        }
        
        await page.screenshot({ path: 'diagnostic-login-page.png' });
        console.log('🔍 [DIAG] Login page screenshot saved: diagnostic-login-page.png');
        
      } catch (error) {
        console.log(`❌ [DIAG] Error accessing login page: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`❌ [DIAG] Critical error accessing application: ${error.message}`);
      throw error;
    }
  });
  
  test('Diagnostic: Test basic login flow with detailed logging', async ({ page }) => {
    console.log('🔍 [DIAG] Testing basic login flow...');
    
    try {
      // Navigate to login page
      await page.goto(`${BASE_URL}/login`, { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Fill in credentials with detailed logging
      console.log(`🔍 [DIAG] Attempting to fill email: ${TEST_USER.email}`);
      await page.fill('#email', TEST_USER.email);
      console.log('✅ [DIAG] Email filled successfully');
      
      console.log(`🔍 [DIAG] Attempting to fill password`);
      await page.fill('#password', TEST_USER.password);
      console.log('✅ [DIAG] Password filled successfully');
      
      // Take screenshot before submission
      await page.screenshot({ path: 'diagnostic-form-filled.png' });
      console.log('🔍 [DIAG] Form filled screenshot saved');
      
      // Submit form
      console.log('🔍 [DIAG] Submitting login form...');
      await page.click('button[type="submit"]');
      console.log('✅ [DIAG] Form submitted');
      
      // Wait for response with detailed logging
      console.log('🔍 [DIAG] Waiting for navigation or error...');
      
      try {
        await page.waitForURL(url => url.includes('/dashboard'), { timeout: 10000 });
        console.log('✅ [DIAG] Successfully redirected to dashboard');
        console.log(`🔍 [DIAG] Final URL: ${page.url()}`);
      } catch (e) {
        console.log(`❌ [DIAG] Navigation timeout or error: ${e.message}`);
        
        // Check for error messages
        const errorSelectors = [
          '.bg-red-500\\/10', '.text-red-500',
          '[class*="error"]', '[class*="Error"]',
          '.text-red-400', '[role="alert"]'
        ];
        
        for (const selector of errorSelectors) {
          try {
            const errorElement = await page.$(selector);
            if (errorElement) {
              const errorText = await errorElement.textContent();
              console.log(`🔍 [DIAG] Found error message: ${errorText}`);
              break;
            }
          } catch (error) {
            // Continue trying
          }
        }
        
        // Check current URL
        console.log(`🔍 [DIAG] Current URL after failed login: ${page.url()}`);
      }
      
      // Take final screenshot
      await page.screenshot({ path: 'diagnostic-final-state.png' });
      console.log('🔍 [DIAG] Final state screenshot saved');
      
    } catch (error) {
      console.log(`❌ [DIAG] Error in login flow: ${error.message}`);
      throw error;
    }
  });
  
  test('Diagnostic: Check test user existence via API', async ({ request }) => {
    console.log('🔍 [DIAG] Checking if test user exists via API...');
    
    try {
      // Try to access the application's auth endpoints or check user existence
      // This is a placeholder - actual implementation depends on your API structure
      console.log('🔍 [DIAG] Note: This test would need to be adapted based on your actual API endpoints');
      console.log(`🔍 [DIAG] Test user email: ${TEST_USER.email}`);
      console.log(`🔍 [DIAG] Test user password length: ${TEST_USER.password.length}`);
      
      // Check if we can reach the API at all
      try {
        const response = await request.get(`${BASE_URL}/api/auth/status`, { timeout: 5000 });
        console.log(`🔍 [DIAG] Auth status response: ${response.status()}`);
      } catch (error) {
        console.log(`🔍 [DIAG] Auth status endpoint not accessible: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`❌ [DIAG] Error checking user existence: ${error.message}`);
    }
  });
});