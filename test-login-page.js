const { chromium } = require('playwright');

async function testLoginPage() {
  console.log('Testing login page rendering...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Test the login page
    await page.goto('http://localhost:3000/login');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if login form is visible
    const loginForm = await page.locator('form').first();
    const isVisible = await loginForm.isVisible();
    
    console.log(`Login form visible: ${isVisible}`);
    
    // Check for email input
    const emailInput = await page.locator('input[type="email"]').first();
    const emailVisible = await emailInput.isVisible();
    console.log(`Email input visible: ${emailVisible}`);
    
    // Check for password input
    const passwordInput = await page.locator('input[type="password"]').first();
    const passwordVisible = await passwordInput.isVisible();
    console.log(`Password input visible: ${passwordVisible}`);
    
    // Check for submit button
    const submitButton = await page.locator('button[type="submit"]').first();
    const buttonVisible = await submitButton.isVisible();
    console.log(`Submit button visible: ${buttonVisible}`);
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'login-page-test.png', fullPage: true });
    console.log('Screenshot saved as login-page-test.png');
    
    // Test login with test credentials
    if (isVisible && emailVisible && passwordVisible && buttonVisible) {
      console.log('All form elements are visible. Testing login...');
      
      // Fill in test credentials
      await emailInput.fill('test@example.com');
      await passwordInput.fill('testpassword');
      
      // Click submit button
      await submitButton.click();
      
      // Wait for response
      await page.waitForTimeout(5000);
      
      // Check if there's an error message or redirect
      const currentUrl = page.url();
      console.log(`Current URL after login attempt: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Login successful - redirected to dashboard');
      } else if (currentUrl.includes('/login')) {
        // Check for error message
        const errorMessage = await page.locator('text=Invalid login credentials').first();
        const errorVisible = await errorMessage.isVisible();
        console.log(`Error message visible: ${errorVisible}`);
        
        if (errorVisible) {
          console.log('✅ Login error handling working correctly');
        } else {
          console.log('⚠️ Login failed but no error message shown');
        }
      }
    } else {
      console.log('❌ Login form not properly rendered');
    }
  } catch (error) {
    console.error('Error testing login page:', error);
  } finally {
    await browser.close();
  }
}

testLoginPage();