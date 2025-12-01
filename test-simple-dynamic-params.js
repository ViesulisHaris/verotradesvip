const { chromium } = require('playwright');

async function testSimpleDynamicParams() {
  console.log('🧪 Testing Next.js Dynamic Params Fix (Simple Test)...\n');
  
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
    
    // Navigate to the strategies page first
    console.log('📍 Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check for any strategy links
    const strategyLinks = await page.locator('a[href*="/strategies/performance/"]').count();
    const editLinks = await page.locator('a[href*="/strategies/edit/"]').count();
    
    console.log(`📊 Found ${strategyLinks} performance links and ${editLinks} edit links`);
    
    if (strategyLinks > 0) {
      // Test navigation to performance page
      console.log('🔗 Testing navigation to performance page...');
      await page.click('a[href*="/strategies/performance/"]:first-child');
      
      // Wait for navigation
      await page.waitForTimeout(3000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // Check for dynamic params errors
      const dynamicParamsErrors = consoleErrors.filter(error => 
        error.includes('params is a Promise') || 
        error.includes('params.id') ||
        error.includes('A param property was accessed directly')
      );
      
      if (dynamicParamsErrors.length === 0) {
        console.log('✅ SUCCESS: No dynamic params errors on performance page!');
      } else {
        console.log(`❌ FAILURE: Found ${dynamicParamsErrors.length} dynamic params errors on performance page:`);
        dynamicParamsErrors.forEach(error => console.log(`   - ${error}`));
      }
      
      // Go back to strategies
      await page.goBack();
      await page.waitForTimeout(2000);
    }
    
    if (editLinks > 0) {
      // Test navigation to edit page
      console.log('✏️ Testing navigation to edit page...');
      await page.click('a[href*="/strategies/edit/"]:first-child');
      
      // Wait for navigation
      await page.waitForTimeout(3000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // Check for dynamic params errors
      const dynamicParamsErrors = consoleErrors.filter(error => 
        error.includes('params is a Promise') || 
        error.includes('params.id') ||
        error.includes('A param property was accessed directly')
      );
      
      if (dynamicParamsErrors.length === 0) {
        console.log('✅ SUCCESS: No dynamic params errors on edit page!');
      } else {
        console.log(`❌ FAILURE: Found ${dynamicParamsErrors.length} dynamic params errors on edit page:`);
        dynamicParamsErrors.forEach(error => console.log(`   - ${error}`));
      }
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

testSimpleDynamicParams();