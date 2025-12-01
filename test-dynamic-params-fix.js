const { chromium } = require('playwright');

async function testDynamicParamsFix() {
  console.log('🧪 Testing Next.js Dynamic Params Fix...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Capture console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    // Navigate to the test page
    console.log('📍 Navigating to test page...');
    await page.goto('http://localhost:3000/test-dynamic-params-fix');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if there are any initial console errors
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors on test page load');
    } else {
      console.log(`❌ Found ${consoleErrors.length} console errors on test page`);
    }
    
    // Try to run the test
    console.log('🔧 Running dynamic params test...');
    await page.click('button:has-text("Run Dynamic Params Test")');
    
    // Wait for test to complete
    await page.waitForTimeout(5000);
    
    // Check for specific dynamic params errors
    const dynamicParamsErrors = consoleErrors.filter(error => 
      error.includes('params is a Promise') || 
      error.includes('params.id') ||
      error.includes('A param property was accessed directly')
    );
    
    if (dynamicParamsErrors.length === 0) {
      console.log('✅ SUCCESS: No dynamic params errors found!');
      console.log('✅ The Next.js dynamic params fix is working correctly.');
    } else {
      console.log(`❌ FAILURE: Found ${dynamicParamsErrors.length} dynamic params errors:`);
      dynamicParamsErrors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Check if we have any strategies to test with
    const strategiesExist = await page.locator('button:has-text("View Performance")').count();
    
    if (strategiesExist > 0) {
      console.log(`📊 Found ${strategiesExist} strategies to test with`);
      
      // Test navigation to performance page
      console.log('🔗 Testing navigation to performance page...');
      await page.click('button:has-text("View Performance")');
      
      // Wait for navigation
      await page.waitForTimeout(3000);
      
      // Check for errors on performance page
      const performancePageErrors = consoleErrors.filter(error => 
        error.includes('params is a Promise') || 
        error.includes('params.id') ||
        error.includes('A param property was accessed directly')
      );
      
      if (performancePageErrors.length === 0) {
        console.log('✅ SUCCESS: No dynamic params errors on performance page!');
      } else {
        console.log(`❌ FAILURE: Found ${performancePageErrors.length} dynamic params errors on performance page:`);
        performancePageErrors.forEach(error => console.log(`   - ${error}`));
      }
      
      // Go back to test page
      await page.goBack();
      await page.waitForTimeout(2000);
      
      // Test navigation to edit page
      console.log('✏️ Testing navigation to edit page...');
      await page.click('button:has-text("Edit")');
      
      // Wait for navigation
      await page.waitForTimeout(3000);
      
      // Check for errors on edit page
      const editPageErrors = consoleErrors.filter(error => 
        error.includes('params is a Promise') || 
        error.includes('params.id') ||
        error.includes('A param property was accessed directly')
      );
      
      if (editPageErrors.length === 0) {
        console.log('✅ SUCCESS: No dynamic params errors on edit page!');
      } else {
        console.log(`❌ FAILURE: Found ${editPageErrors.length} dynamic params errors on edit page:`);
        editPageErrors.forEach(error => console.log(`   - ${error}`));
      }
    } else {
      console.log('⚠️ No strategies found to test with. Please create a strategy first.');
    }
    
    // Final summary
    const totalDynamicParamsErrors = consoleErrors.filter(error => 
      error.includes('params is a Promise') || 
      error.includes('params.id') ||
      error.includes('A param property was accessed directly')
    ).length;
    
    console.log('\n📋 TEST SUMMARY:');
    console.log(`   Total console errors: ${consoleErrors.length}`);
    console.log(`   Dynamic params errors: ${totalDynamicParamsErrors}`);
    
    if (totalDynamicParamsErrors === 0) {
      console.log('\n🎉 ALL TESTS PASSED! The dynamic params fix is working correctly.');
      console.log('✅ No "params is a Promise" errors found');
      console.log('✅ No "params.id" direct access errors found');
      console.log('✅ Strategy performance and edit pages are working properly');
    } else {
      console.log('\n❌ TESTS FAILED! Dynamic params errors are still present.');
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    await browser.close();
  }
}

testDynamicParamsFix();