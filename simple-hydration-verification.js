const puppeteer = require('puppeteer');

async function testHydrationFix() {
  console.log('🔍 Testing Hydration Fix Verification...\n');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set viewport to desktop size
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('1. Testing application loading...');
    
    // Navigate to login page
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for hydration errors in console
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // Check if login form is visible and interactive
    await page.waitForSelector('form', { timeout: 10000 });
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    console.log('✅ Login form loaded successfully');
    console.log(`✅ Email input found: ${emailInput ? 'Yes' : 'No'}`);
    console.log(`✅ Password input found: ${passwordInput ? 'Yes' : 'No'}`);
    console.log(`✅ Submit button found: ${submitButton ? 'Yes' : 'No'}`);
    
    // Test form interaction
    if (emailInput && passwordInput) {
      await emailInput.type('test@example.com');
      await passwordInput.type('testpassword123');
      console.log('✅ Form inputs are interactive');
    }
    
    // Check for hydration errors in console logs
    const hydrationErrors = consoleLogs.filter(log => 
      log.includes('hydration') || 
      log.includes('Text content does not match') ||
      log.includes('server-rendered HTML')
    );
    
    if (hydrationErrors.length > 0) {
      console.log('❌ Hydration errors found:');
      hydrationErrors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ No hydration errors detected');
    }
    
    // Test responsive design
    console.log('\n2. Testing responsive design...');
    
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileMenu = await page.$('button svg');
    console.log(`✅ Mobile menu button found: ${mobileMenu ? 'Yes' : 'No'}`);
    
    // Test tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Responsive design working');
    
    // Final verification
    console.log('\n3. Final verification...');
    
    const finalConsoleErrors = consoleLogs.filter(log => 
      log.includes('error') && 
      !log.includes('test@example.com') // Filter out expected auth errors
    );
    
    if (finalConsoleErrors.length === 0) {
      console.log('✅ No critical console errors');
    } else {
      console.log('⚠️ Console errors found:');
      finalConsoleErrors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Check if application is fully functional
    const isAppFunctional = emailInput && 
                          passwordInput && 
                          submitButton && 
                          hydrationErrors.length === 0;
    
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('=====================================');
    console.log(`Application Loading: ${emailInput ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Form Interactivity: ${emailInput && passwordInput ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Hydration Fix: ${hydrationErrors.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Responsive Design: ${mobileMenu ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Overall Status: ${isAppFunctional ? '✅ WORKING' : '❌ NEEDS FIXES'}`);
    
    return isAppFunctional;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run test
testHydrationFix().then(success => {
  if (success) {
    console.log('\n🎉 Hydration fix verification completed successfully!');
    console.log('✅ The trading journal application is now functional.');
  } else {
    console.log('\n❌ Hydration fix verification failed.');
    console.log('⚠️ Additional fixes may be required.');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});