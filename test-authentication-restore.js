const { chromium } = require('playwright');
const path = require('path');

async function testAuthenticationRestore() {
  console.log('🔍 [AUTH_TEST] Starting authentication restore verification...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to the home page
    console.log('🔍 [AUTH_TEST] Navigating to home page...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Wait for the page to load completely
    await page.waitForTimeout(2000);
    
    // Take screenshot of home page
    await page.screenshot({ 
      path: 'auth-test-home-page.png',
      fullPage: true 
    });
    console.log('📸 [AUTH_TEST] Home page screenshot saved');
    
    // Check for authentication-related elements
    const loginButton = await page.locator('button:has-text("Login")').first();
    const registerButton = await page.locator('button:has-text("Register")').first();
    
    const hasLoginButton = await loginButton.isVisible();
    const hasRegisterButton = await registerButton.isVisible();
    
    console.log('🔍 [AUTH_TEST] UI Elements Check:', {
      hasLoginButton,
      hasRegisterButton,
      pageTitle: await page.title()
    });
    
    // Test login button functionality
    if (hasLoginButton) {
      console.log('🔍 [AUTH_TEST] Testing login button navigation...');
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Take screenshot of login page
      await page.screenshot({ 
        path: 'auth-test-login-page.png',
        fullPage: true 
      });
      console.log('📸 [AUTH_TEST] Login page screenshot saved');
      
      // Check for login form elements
      const emailInput = await page.locator('input[type="email"]').first();
      const passwordInput = await page.locator('input[type="password"]').first();
      const submitButton = await page.locator('button:has-text("Sign In")').first();
      
      const hasLoginForm = await emailInput.isVisible() && await passwordInput.isVisible() && await submitButton.isVisible();
      console.log('🔍 [AUTH_TEST] Login form check:', {
        hasLoginForm,
        hasEmailInput: await emailInput.isVisible(),
        hasPasswordInput: await passwordInput.isVisible(),
        hasSubmitButton: await submitButton.isVisible()
      });
      
      if (hasLoginForm) {
        console.log('✅ [AUTH_TEST] Login form is properly rendered');
        
        // Test Supabase client initialization by checking console logs
        const consoleMessages = [];
        page.on('console', msg => {
          consoleMessages.push(msg.text());
        });
        
        // Fill in test credentials (don't submit, just test form)
        await emailInput.fill('test@example.com');
        await passwordInput.fill('testpassword123');
        
        // Wait a bit to see if any errors appear
        await page.waitForTimeout(2000);
        
        // Check for Supabase-related console messages
        const supabaseMessages = consoleMessages.filter(msg => 
          msg.includes('SUPABASE') || msg.includes('supabase') || msg.includes('Auth')
        );
        
        console.log('🔍 [AUTH_TEST] Console messages related to Supabase:', supabaseMessages);
        
        if (supabaseMessages.some(msg => msg.includes('JWT Format'))) {
          console.log('✅ [AUTH_TEST] Supabase JWT format is properly detected');
        }
        
        if (supabaseMessages.some(msg => msg.includes('created successfully'))) {
          console.log('✅ [AUTH_TEST] Supabase client creation successful');
        }
      }
    }
    
    // Test register button functionality
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    if (hasRegisterButton) {
      console.log('🔍 [AUTH_TEST] Testing register button navigation...');
      await registerButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Take screenshot of register page
      await page.screenshot({ 
        path: 'auth-test-register-page.png',
        fullPage: true 
      });
      console.log('📸 [AUTH_TEST] Register page screenshot saved');
      
      // Check for register form elements
      const emailInput = await page.locator('input[type="email"]').first();
      const passwordInput = await page.locator('input[type="password"]').first();
      const registerSubmitButton = await page.locator('button:has-text("Register")').first();
      
      const hasRegisterForm = await emailInput.isVisible() && await passwordInput.isVisible() && await registerSubmitButton.isVisible();
      console.log('🔍 [AUTH_TEST] Register form check:', {
        hasRegisterForm,
        hasEmailInput: await emailInput.isVisible(),
        hasPasswordInput: await passwordInput.isVisible(),
        hasSubmitButton: await registerSubmitButton.isVisible()
      });
      
      if (hasRegisterForm) {
        console.log('✅ [AUTH_TEST] Register form is properly rendered');
      }
    }
    
    // Test direct dashboard access (should redirect to login if not authenticated)
    console.log('🔍 [AUTH_TEST] Testing dashboard access without authentication...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('🔍 [AUTH_TEST] Dashboard access result:', {
      currentUrl,
      redirectedToLogin: currentUrl.includes('/login')
    });
    
    if (currentUrl.includes('/login')) {
      console.log('✅ [AUTH_TEST] Authentication guard is working - redirected to login');
    } else {
      console.log('⚠️ [AUTH_TEST] May need to check authentication guard configuration');
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: 'auth-test-final-state.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ [AUTH_TEST] Error during testing:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthenticationRestore().then(() => {
  console.log('🏁 [AUTH_TEST] Authentication restore test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 [AUTH_TEST] Test failed:', error);
  process.exit(1);
});