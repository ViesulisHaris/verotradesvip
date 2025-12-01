const { chromium } = require('playwright');

async function testFixesSimple() {
  console.log('🔍 Starting simple fixes verification...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console logs and errors
  const logs = [];
  const errors = [];
  const consoleMessages = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    
    // Look for our specific issues
    if (text.includes('supabaseKey') || text.includes('Strategy') || text.includes('schema')) {
      logs.push(`[${msg.type()}] ${text}`);
      console.log(`🔍 CONSOLE: [${msg.type()}] ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    const message = error.message;
    errors.push(`PAGE ERROR: ${message}`);
    console.error(`❌ PAGE ERROR: ${message}`);
  });
  
  try {
    // First, let's test the SchemaValidator issue by going to a page that triggers it
    console.log('📄 Testing SchemaValidator issue...');
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for page to load and capture any supabaseKey errors
    await page.waitForTimeout(3000);
    
    // Check for supabaseKey errors
    const hasSupabaseKeyError = consoleMessages.some(msg => 
      msg.includes('supabaseKey is required') && msg.includes('[error]')
    );
    
    console.log(`🔍 SupabaseKey Error Found: ${hasSupabaseKeyError}`);
    
    if (hasSupabaseKeyError) {
      console.log('❌ SchemaValidator supabaseKey issue NOT fixed');
    } else {
      console.log('✅ SchemaValidator supabaseKey issue appears to be fixed');
    }
    
    // Now test the strategy missing alerts by going to strategies page
    console.log('📄 Testing strategy missing alerts...');
    await page.goto('http://localhost:3000/strategies');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Look for any alert-related errors or strategy missing messages
    const hasStrategyAlert = errors.some(error => 
      error.includes('Strategy missing') || error.includes('alert')
    );
    
    const hasStrategyConsoleError = consoleMessages.some(msg => 
      msg.includes('Strategy missing') && msg.includes('[error]')
    );
    
    console.log(`🔍 Strategy Alert Error Found: ${hasStrategyAlert}`);
    console.log(`🔍 Strategy Console Error Found: ${hasStrategyConsoleError}`);
    
    if (hasStrategyAlert || hasStrategyConsoleError) {
      console.log('❌ Strategy missing alerts issue NOT fixed');
    } else {
      console.log('✅ Strategy missing alerts issue appears to be fixed');
    }
    
    // Test direct SchemaValidator import and usage
    console.log('🧪 Testing SchemaValidator directly...');
    
    try {
      // Try to trigger SchemaValidator usage by navigating to a page that uses it
      await page.goto('http://localhost:3000/trades');
      await page.waitForTimeout(2000);
      
      // Check if any new supabaseKey errors appeared
      const newSupabaseKeyErrors = consoleMessages.filter(msg => 
        msg.includes('supabaseKey is required') && msg.includes('[error]')
      );
      
      if (newSupabaseKeyErrors.length > 0) {
        console.log('❌ SchemaValidator still has supabaseKey errors');
        newSupabaseKeyErrors.forEach(err => console.log(`  ${err}`));
      } else {
        console.log('✅ SchemaValidator working without supabaseKey errors');
      }
    } catch (testError) {
      console.log(`⚠️ Direct test error: ${testError.message}`);
    }
    
    // Final assessment
    console.log('\n🏁 FINAL ASSESSMENT:');
    console.log('==================');
    
    const schemaValidatorFixed = !hasSupabaseKeyError;
    const strategyAlertsFixed = !hasStrategyAlert && !hasStrategyConsoleError;
    
    console.log(`✅ SchemaValidator supabaseKey error FIXED: ${schemaValidatorFixed}`);
    console.log(`✅ Strategy missing alerts FIXED: ${strategyAlertsFixed}`);
    
    if (schemaValidatorFixed && strategyAlertsFixed) {
      console.log('🎉 ALL FIXES VERIFIED SUCCESSFULLY!');
      return true;
    } else {
      console.log('❌ SOME FIXES NEED ATTENTION');
      
      if (!schemaValidatorFixed) {
        console.log('📋 SchemaValidator still has issues');
      }
      
      if (!strategyAlertsFixed) {
        console.log('📋 Strategy alerts still have issues');
      }
      
      // Show relevant logs
      console.log('\n📋 RELEVANT LOGS:');
      consoleMessages.forEach(msg => {
        if (msg.includes('supabaseKey') || msg.includes('Strategy') || msg.includes('schema')) {
          console.log(`  ${msg}`);
        }
      });
      
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
testFixesSimple().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Verification script failed:', error);
  process.exit(1);
});