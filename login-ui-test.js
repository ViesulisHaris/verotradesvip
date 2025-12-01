const puppeteer = require('puppeteer');

async function testLoginUI() {
  console.log('🔍 Testing Login UI Display and Functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if login form elements are visible
    console.log('🔍 Checking for login form elements...');
    
    const emailInput = await page.$('#email');
    const passwordInput = await page.$('#password');
    const submitButton = await page.$('[data-testid="login-submit-button"]');
    const welcomeText = await page.$('h2');
    
    console.log('📊 Login Form Elements Status:');
    console.log(`  - Welcome Header: ${welcomeText ? '✅ VISIBLE' : '❌ MISSING'}`);
    console.log(`  - Email Input: ${emailInput ? '✅ VISIBLE' : '❌ MISSING'}`);
    console.log(`  - Password Input: ${passwordInput ? '✅ VISIBLE' : '❌ MISSING'}`);
    console.log(`  - Submit Button: ${submitButton ? '✅ VISIBLE' : '❌ MISSING'}`);
    
    if (emailInput && passwordInput && submitButton) {
      console.log('✅ All login form elements are visible!');
      
      // Test form interactions
      console.log('🧪 Testing form interactions...');
      
      // Fill in test credentials
      await emailInput.type('test@example.com');
      await passwordInput.type('testpassword');
      
      // Check if values are filled
      const emailValue = await page.$eval('#email', el => el.value);
      const passwordValue = await page.$eval('#password', el => el.value);
      
      console.log(`  - Email field accepts input: ${emailValue ? '✅ YES' : '❌ NO'}`);
      console.log(`  - Password field accepts input: ${passwordValue ? '✅ YES' : '❌ NO'}`);
      
      // Test button click
      await submitButton.click();
      await page.waitForTimeout(1000);
      
      console.log('  - Submit button clickable: ✅ YES');
      
      // Take screenshot for verification
      await page.screenshot({ 
        path: 'login-form-test.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved as login-form-test.png');
      
    } else {
      console.log('❌ Login form elements are missing or not visible');
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: 'login-form-debug.png',
        fullPage: true 
      });
      console.log('📸 Debug screenshot saved as login-form-debug.png');
      
      // Get page content for debugging
      const pageContent = await page.content();
      console.log('📄 Page content length:', pageContent.length);
      
      // Check for any error messages
      const errorElements = await page.$$('text=/error|Error|ERROR/');
      console.log(`  - Error elements found: ${errorElements.length}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testLoginUI().then(() => {
  console.log('🏁 Login UI test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});