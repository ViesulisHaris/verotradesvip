const { chromium } = require('playwright');

async function testAppConnectivity() {
  console.log('🔍 [CONNECTIVITY TEST] Testing application accessibility...');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    console.log('🔍 Launching browser...');
    browser = await chromium.launch({ 
      headless: true,
      timeout: 30000
    });
    
    // Create page
    page = await browser.newPage();
    console.log('✅ Browser and page created successfully');
    
    // Test base URL
    console.log('🔍 Testing base URL: http://localhost:3000');
    const response = await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    
    console.log(`✅ Base URL loaded successfully: ${response.url()}`);
    
    // Test login page
    console.log('🔍 Testing login page: http://localhost:3000/login');
    const loginResponse = await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    
    console.log(`✅ Login page loaded successfully: ${loginResponse.url()}`);
    
    // Check for login form
    console.log('🔍 Checking for login form elements...');
    const emailInput = await page.$('#email');
    const passwordInput = await page.$('#password');
    const submitButton = await page.$('button[type="submit"]');
    
    if (emailInput && passwordInput && submitButton) {
      console.log('✅ Login form elements found');
      
      // Test form interaction
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'testpassword');
      console.log('✅ Form fill test successful');
    } else {
      console.log('❌ Login form elements not found');
      console.log(`Email input: ${emailInput ? 'Found' : 'Not found'}`);
      console.log(`Password input: ${passwordInput ? 'Found' : 'Not found'}`);
      console.log(`Submit button: ${submitButton ? 'Found' : 'Not found'}`);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'connectivity-test-login-page.png' });
      console.log('📸 Screenshot saved: connectivity-test-login-page.png');
      
      // Get page content for debugging
      const pageContent = await page.content();
      console.log(`📄 Page content length: ${pageContent.length} characters`);
      
      if (pageContent.includes('login') || pageContent.includes('Login') || pageContent.includes('sign in')) {
        console.log('✅ Page contains login-related content');
      } else {
        console.log('❌ Page does not contain expected login content');
        console.log(`Page content preview: ${pageContent.substring(0, 500)}...`);
      }
    }
    
    console.log('🎉 [SUCCESS] Application connectivity test completed');
    return true;
    
  } catch (error) {
    console.error('❌ Connectivity test failed:', error.message);
    
    if (page) {
      try {
        await page.screenshot({ path: 'connectivity-test-error.png' });
        console.log('📸 Error screenshot saved: connectivity-test-error.png');
      } catch (screenshotError) {
        console.log('❌ Failed to save error screenshot:', screenshotError.message);
      }
    }
    
    return false;
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

// Run connectivity test
testAppConnectivity().then(success => {
  if (success) {
    console.log('🎉 [COMPLETE] Application is accessible and ready for tests');
    process.exit(0);
  } else {
    console.log('💥 [FAILED] Application connectivity test failed');
    process.exit(1);
  }
});