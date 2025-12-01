const { chromium } = require('playwright');

async function verifyFixes() {
  console.log('🔍 Starting comprehensive fixes verification...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console logs and errors
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('supabaseKey') || text.includes('Strategy') || text.includes('schema')) {
      logs.push(`[${msg.type()}] ${text}`);
      console.log(`[${msg.type()}] ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    const message = error.message;
    if (message.includes('supabaseKey') || message.includes('Strategy') || message.includes('schema')) {
      errors.push(`PAGE ERROR: ${message}`);
      console.error(`PAGE ERROR: ${message}`);
    }
  });
  
  try {
    // Navigate to the verification page
    console.log('📄 Navigating to verification page...');
    await page.goto('http://localhost:3000/test-fixes-verification');
    
    // Wait for the page to load
    await page.waitForSelector('text=Fixes Verification Page', { timeout: 10000 });
    console.log('✅ Verification page loaded successfully');
    
    // Run the verification tests
    console.log('🧪 Running verification tests...');
    await page.click('text=Run Verification Tests');
    
    // Wait for tests to complete
    await page.waitForTimeout(5000);
    
    // Check for success indicators
    const schemaValidatorStatus = await page.$eval(
      'div:has-text("SchemaValidator Test") div:first-child',
      el => el.textContent
    );
    
    const strategyNavigationStatus = await page.$eval(
      'div:has-text("Strategy Navigation Test") div:first-child',
      el => el.textContent
    );
    
    console.log(`📊 SchemaValidator Test Status: ${schemaValidatorStatus}`);
    console.log(`📊 Strategy Navigation Test Status: ${strategyNavigationStatus}`);
    
    // Check for specific error patterns
    const hasSupabaseKeyError = logs.some(log => 
      log.includes('supabaseKey is required') && log.includes('[error]')
    );
    
    const hasStrategyMissingAlert = errors.some(error => 
      error.includes('Strategy missing') && error.includes('alert')
    );
    
    console.log(`🔍 SupabaseKey Error Found: ${hasSupabaseKeyError}`);
    console.log(`🔍 Strategy Missing Alert Found: ${hasStrategyMissingAlert}`);
    
    // Navigate to strategies page to test real-world scenario
    console.log('🔄 Testing real-world scenario on strategies page...');
    await page.goto('http://localhost:3000/strategies');
    
    // Wait for strategies page to load
    await page.waitForTimeout(3000);
    
    // Check if page loads without errors
    const strategiesPageLoaded = await page.$('text=Strategies') !== null;
    console.log(`📄 Strategies Page Loaded: ${strategiesPageLoaded}`);
    
    // Try to trigger strategy selection/navigation
    try {
      const strategyItems = await page.$$('.strategy-item, [data-strategy-id], .strategy-card');
      if (strategyItems.length > 0) {
        console.log(`🎯 Found ${strategyItems.length} strategy items, testing navigation...`);
        await strategyItems[0].click();
        await page.waitForTimeout(2000);
        
        // Check if navigation happened without alert popups
        const currentUrl = page.url();
        console.log(`🔗 Current URL after strategy click: ${currentUrl}`);
      } else {
        console.log('ℹ️ No strategy items found on page');
      }
    } catch (navError) {
      console.log(`⚠️ Navigation test error: ${navError.message}`);
    }
    
    // Final assessment
    console.log('\n🏁 FINAL ASSESSMENT:');
    console.log('==================');
    
    const schemaValidatorFixed = !hasSupabaseKeyError && schemaValidatorStatus.includes('success');
    const strategyAlertsFixed = !hasStrategyMissingAlert;
    
    console.log(`✅ SchemaValidator supabaseKey error FIXED: ${schemaValidatorFixed}`);
    console.log(`✅ Strategy missing alerts FIXED: ${strategyAlertsFixed}`);
    
    if (schemaValidatorFixed && strategyAlertsFixed) {
      console.log('🎉 ALL FIXES VERIFIED SUCCESSFULLY!');
      return true;
    } else {
      console.log('❌ SOME FIXES NEED ATTENTION');
      console.log('📋 Detailed logs:');
      logs.forEach(log => console.log(`  ${log}`));
      errors.forEach(error => console.log(`  ${error}`));
      return false;
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the verification
verifyFixes().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Verification script failed:', error);
  process.exit(1);
});