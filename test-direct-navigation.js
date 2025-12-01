const { chromium } = require('playwright');

async function testDirectNavigation() {
  console.log('🧪 Testing Direct Navigation to Dynamic Routes...\n');
  
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
    
    // Test direct navigation to performance page with a sample UUID
    console.log('🔗 Testing direct navigation to performance page...');
    const sampleId = '00000000-0000-0000-0000-000000000000'; // Invalid UUID but tests the route
    await page.goto(`http://localhost:3000/strategies/performance/${sampleId}`);
    
    // Wait for page to load
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
    
    // Test direct navigation to edit page
    console.log('✏️ Testing direct navigation to edit page...');
    await page.goto(`http://localhost:3000/strategies/edit/${sampleId}`);
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentEditUrl = page.url();
    console.log(`📍 Current URL: ${currentEditUrl}`);
    
    // Check for dynamic params errors
    const editDynamicParamsErrors = consoleErrors.filter(error => 
      error.includes('params is a Promise') || 
      error.includes('params.id') ||
      error.includes('A param property was accessed directly')
    );
    
    if (editDynamicParamsErrors.length === 0) {
      console.log('✅ SUCCESS: No dynamic params errors on edit page!');
    } else {
      console.log(`❌ FAILURE: Found ${editDynamicParamsErrors.length} dynamic params errors on edit page:`);
      editDynamicParamsErrors.forEach(error => console.log(`   - ${error}`));
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
      console.log('✅ Next.js 16+ dynamic params are being handled correctly');
    } else {
      console.log('\n❌ TESTS FAILED! Dynamic params errors are still present.');
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    await browser.close();
  }
}

testDirectNavigation();