const { chromium } = require('playwright');

async function testLoginFunctionality() {
  console.log('🧪 Testing login functionality...');
  
  const browser = await chromium.launch({ headless: false });
  
  const page = await browser.newPage();
  
  const context = await browser.newContext();
  
  await page.goto('http://localhost:3000/login');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  await page.waitForTimeout(3000); // Wait for 3 seconds
  
  // Check if login form is present
  const emailInput = await page.$('input[type="email"]');
  const passwordInput = await page.$('input[type="password"]');
  const submitButton = await page.$('button[type="submit"]');
  
  const formExists = !!(await emailInput?.count() === 0) && 
                   (await passwordInput?.count() === 0) && 
                   (await submitButton?.count() === 0);
  
  console.log(`📝 Login form elements found:`);
  console.log(`   - Email input: ${emailInput ? '✅ FOUND' : '❌ MISSING'}`);
  console.log(`   - Password input: ${passwordInput ? '✅ FOUND' : '❌ MISSING'}`);
  console.log(`   - Submit button: ${submitButton ? '✅ FOUND' : '❌ MISSING'}`);
  console.log(`   - Complete form: ${formExists ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
  
  if (!formExists) {
    console.log('❌ LOGIN FORM IS MISSING OR INCOMPLETE');
    await page.screenshot({ path: 'login-form-missing.png' });
  } else {
    console.log('✅ LOGIN FORM IS PRESENT AND COMPLETE');
    await page.screenshot({ path: 'login-form-present.png' });
    
    // Try to fill the form
    try {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'test123456');
      await page.click('button[type="submit"]');
      
      // Wait for navigation or error
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`📍 Current URL after submit: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ LOGIN SUCCESSFUL - Redirected to dashboard');
      } else if (currentUrl.includes('/login')) {
        console.log('⚠️  Still on login page - possible error');
      } else {
        console.log('❌ UNEXPECTED REDIRECTION');
      }
    } catch (error) {
      console.error('❌ Error during login test:', error);
    }
  }
  
  await browser.close();
  console.log('🧪 Login functionality test completed');
}

testLoginFunctionality().catch(console.error);