const { test, expect } = require('@playwright/test');

// Enhanced diagnostic test to validate assumptions
test.describe('Authentication Debug - Enhanced Diagnostic', () => {
  test('Validate application accessibility and test user', async ({ page }) => {
    console.log('🔍 [DEBUG] Starting enhanced authentication diagnostic...');
    
    // Test 1: Check if application is running on expected port
    const testPorts = [3000, 3001];
    let workingPort = null;
    let workingUrl = null;
    
    for (const port of testPorts) {
      try {
        console.log(`🔍 [DEBUG] Testing port ${port}...`);
        const response = await page.goto(`http://localhost:${port}`, { 
          timeout: 5000,
          waitUntil: 'domcontentloaded'
        });
        
        if (response && response.status() === 200) {
          workingPort = port;
          workingUrl = `http://localhost:${port}`;
          console.log(`✅ [DEBUG] Application is running on port ${port}`);
          break;
        }
      } catch (error) {
        console.log(`❌ [DEBUG] Port ${port} failed: ${error.message}`);
      }
    }
    
    if (!workingPort) {
      console.log('❌ [DEBUG] Application is not running on any expected port');
      throw new Error('Application server not accessible');
    }
    
    // Test 2: Check if login page is accessible
    try {
      console.log('🔍 [DEBUG] Testing login page accessibility...');
      const loginResponse = await page.goto(`${workingUrl}/login`, {
        timeout: 5000,
        waitUntil: 'domcontentloaded'
      });
      
      console.log(`📄 [DEBUG] Login page status: ${loginResponse?.status()}`);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'debug-login-page.png' });
      
    } catch (error) {
      console.log(`❌ [DEBUG] Login page error: ${error.message}`);
      throw error;
    }
    
    // Test 3: Check if login form elements exist with multiple selectors
    console.log('🔍 [DEBUG] Testing login form element selectors...');
    
    const elementSelectors = {
      email: ['#email', 'input[type="email"]', 'input[name="email"]', 'input[placeholder*="email"]'],
      password: ['#password', 'input[type="password"]', 'input[name="password"]'],
      submit: ['button[type="submit"]', 'button:has-text("Sign in")', 'form button', '.submit']
    };
    
    const foundElements = {};
    
    for (const [elementType, selectors] of Object.entries(elementSelectors)) {
      let found = false;
      let foundSelector = null;
      
      for (const selector of selectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            found = true;
            foundSelector = selector;
            console.log(`✅ [DEBUG] Found ${elementType} with selector: ${foundSelector}`);
            break;
          }
        } catch (error) {
          // Continue trying other selectors
        }
      }
      
      if (!found) {
        console.log(`❌ [DEBUG] Could not find ${elementType} element with any selector`);
        console.log(`🔍 [DEBUG] Tried selectors: ${selectors.join(', ')}`);
      }
      
      foundElements[elementType] = { found, selector: foundSelector };
    }
    
    // Test 4: Check page title and content
    console.log('🔍 [DEBUG] Checking page content...');
    const title = await page.title();
    console.log(`📄 [DEBUG] Page title: ${title}`);
    
    const pageText = await page.textContent('body');
    const hasSigninText = pageText?.toLowerCase().includes('sign in');
    const hasEmailField = pageText?.toLowerCase().includes('email');
    const hasPasswordField = pageText?.toLowerCase().includes('password');
    
    console.log(`📝 [DEBUG] Page contains 'sign in': ${hasSigninText}`);
    console.log(`📝 [DEBUG] Page contains 'email': ${hasEmailField}`);
    console.log(`📝 [DEBUG] Page contains 'password': ${hasPasswordField}`);
    
    // Test 5: Try to fill form with test credentials (if elements found)
    if (foundElements.email.found && foundElements.password.found && foundElements.submit.found) {
      console.log('🔍 [DEBUG] Testing form fill with test credentials...');
      
      try {
        await page.fill(foundElements.email.selector, 'testuser@verotrade.com');
        await page.fill(foundElements.password.selector, 'TestPassword123!');
        
        console.log('✅ [DEBUG] Form filled successfully');
        
        // Check if form can be submitted
        const submitButton = await page.$(foundElements.submit.selector);
        if (submitButton) {
          const isDisabled = await submitButton.isDisabled();
          console.log(`🔍 [DEBUG] Submit button disabled: ${isDisabled}`);
          
          if (!isDisabled) {
            console.log('🔍 [DEBUG] Submitting form to test authentication...');
            await Promise.all([
              page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
              submitButton.click()
            ]);
            
            const currentUrl = page.url();
            console.log(`🔍 [DEBUG] URL after submission: ${currentUrl}`);
            
            // Check for error messages
            const errorSelectors = [
              '.bg-red-500\\/10', '.text-red-500', 
              '[class*="error"]', '[class*="Error"]',
              '.text-red-400', '[role="alert"]'
            ];
            
            let errorMessage = null;
            for (const errorSelector of errorSelectors) {
              try {
                const errorElement = await page.$(errorSelector);
                if (errorElement) {
                  errorMessage = await errorElement.textContent();
                  console.log(`🔍 [DEBUG] Found error message: ${errorMessage}`);
                  break;
                }
              } catch (error) {
                // Continue trying
              }
            }
            
            if (errorMessage) {
              console.log(`❌ [DEBUG] Authentication failed: ${errorMessage}`);
            } else {
              console.log('✅ [DEBUG] Form submitted without visible errors');
            }
            
            await page.screenshot({ path: 'debug-after-login.png' });
          }
        }
      } catch (error) {
        console.log(`❌ [DEBUG] Form submission error: ${error.message}`);
      }
    }
    
    // Test 6: Check environment variables
    console.log('🔍 [DEBUG] Checking environment variables...');
    console.log(`🌐 [DEBUG] NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}`);
    console.log(`🔑 [DEBUG] NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}`);
    
    // Test 7: Summary
    console.log('\n📊 [DEBUG] DIAGNOSTIC SUMMARY:');
    console.log(`✅ Working port: ${workingPort}`);
    console.log(`✅ Working URL: ${workingUrl}`);
    console.log(`✅ Login page accessible: ${!!workingUrl}`);
    console.log(`✅ Email element found: ${foundElements.email.found}`);
    console.log(`✅ Password element found: ${foundElements.password.found}`);
    console.log(`✅ Submit element found: ${foundElements.submit.found}`);
    console.log(`✅ Page has sign-in text: ${hasSigninText}`);
    console.log(`✅ Environment variables configured: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    
    // Final assertion
    expect(workingUrl).toBeTruthy();
    expect(foundElements.email.found).toBeTruthy();
    expect(foundElements.password.found).toBeTruthy();
    expect(foundElements.submit.found).toBeTruthy();
  });
});