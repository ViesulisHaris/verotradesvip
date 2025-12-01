const puppeteer = require('puppeteer');
require('dotenv').config();

async function testApplicationFunctionality() {
  console.log('🚀 Testing Complete Application Functionality...\n');

  const browser = await puppeteer.launch({ 
    headless: false, // Set to false for debugging
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the browser
  page.on('console', msg => {
    console.log('Browser Console:', msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.error('Browser Error:', error.message);
  });

  try {
    const testResults = {
      pages: {},
      functionality: {},
      errors: []
    };

    // Test 1: Main page loading
    console.log('📋 Test 1: Testing main page loading...');
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      const title = await page.title();
      testResults.pages.main = {
        success: true,
        title,
        url: page.url()
      };
      console.log('✅ Main page loaded successfully');
    } catch (error) {
      testResults.pages.main = {
        success: false,
        error: error.message
      };
      testResults.errors.push(`Main page: ${error.message}`);
      console.log(`❌ Main page failed: ${error.message}`);
    }

    // Test 2: Dashboard page
    console.log('\n📋 Test 2: Testing Dashboard page...');
    try {
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      
      // Wait for dashboard to load
      await page.waitForSelector('body', { timeout: 10000 });
      
      // Check for any error messages
      const errorElements = await page.$$('.error, .alert-error, [data-testid="error"]');
      const hasErrors = errorElements.length > 0;
      
      testResults.pages.dashboard = {
        success: !hasErrors,
        hasErrors,
        url: page.url()
      };
      
      if (hasErrors) {
        const errorText = await page.evaluate(() => {
          const errorEl = document.querySelector('.error, .alert-error, [data-testid="error"]');
          return errorEl ? errorEl.textContent : 'Unknown error';
        });
        testResults.pages.dashboard.errorText = errorText;
        testResults.errors.push(`Dashboard: ${errorText}`);
        console.log(`❌ Dashboard has errors: ${errorText}`);
      } else {
        console.log('✅ Dashboard loaded successfully');
      }
    } catch (error) {
      testResults.pages.dashboard = {
        success: false,
        error: error.message
      };
      testResults.errors.push(`Dashboard: ${error.message}`);
      console.log(`❌ Dashboard failed: ${error.message}`);
    }

    // Test 3: Strategies page
    console.log('\n📋 Test 3: Testing Strategies page...');
    try {
      await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle2' });
      
      // Wait for strategies to load
      await page.waitForSelector('body', { timeout: 10000 });
      
      // Check for any error messages
      const errorElements = await page.$$('.error, .alert-error, [data-testid="error"]');
      const hasErrors = errorElements.length > 0;
      
      testResults.pages.strategies = {
        success: !hasErrors,
        hasErrors,
        url: page.url()
      };
      
      if (hasErrors) {
        const errorText = await page.evaluate(() => {
          const errorEl = document.querySelector('.error, .alert-error, [data-testid="error"]');
          return errorEl ? errorEl.textContent : 'Unknown error';
        });
        testResults.pages.strategies.errorText = errorText;
        testResults.errors.push(`Strategies: ${errorText}`);
        console.log(`❌ Strategies has errors: ${errorText}`);
      } else {
        console.log('✅ Strategies loaded successfully');
      }
    } catch (error) {
      testResults.pages.strategies = {
        success: false,
        error: error.message
      };
      testResults.errors.push(`Strategies: ${error.message}`);
      console.log(`❌ Strategies failed: ${error.message}`);
    }

    // Test 4: Trades page
    console.log('\n📋 Test 4: Testing Trades page...');
    try {
      await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
      
      // Wait for trades to load
      await page.waitForSelector('body', { timeout: 10000 });
      
      // Check for any error messages
      const errorElements = await page.$$('.error, .alert-error, [data-testid="error"]');
      const hasErrors = errorElements.length > 0;
      
      testResults.pages.trades = {
        success: !hasErrors,
        hasErrors,
        url: page.url()
      };
      
      if (hasErrors) {
        const errorText = await page.evaluate(() => {
          const errorEl = document.querySelector('.error, .alert-error, [data-testid="error"]');
          return errorEl ? errorEl.textContent : 'Unknown error';
        });
        testResults.pages.trades.errorText = errorText;
        testResults.errors.push(`Trades: ${errorText}`);
        console.log(`❌ Trades has errors: ${errorText}`);
      } else {
        console.log('✅ Trades loaded successfully');
      }
    } catch (error) {
      testResults.pages.trades = {
        success: false,
        error: error.message
      };
      testResults.errors.push(`Trades: ${error.message}`);
      console.log(`❌ Trades failed: ${error.message}`);
    }

    // Test 5: Log Trade page
    console.log('\n📋 Test 5: Testing Log Trade page...');
    try {
      await page.goto('http://localhost:3000/log-trade', { waitUntil: 'networkidle2' });
      
      // Wait for log trade to load
      await page.waitForSelector('body', { timeout: 10000 });
      
      // Check for any error messages
      const errorElements = await page.$$('.error, .alert-error, [data-testid="error"]');
      const hasErrors = errorElements.length > 0;
      
      testResults.pages.logTrade = {
        success: !hasErrors,
        hasErrors,
        url: page.url()
      };
      
      if (hasErrors) {
        const errorText = await page.evaluate(() => {
          const errorEl = document.querySelector('.error, .alert-error, [data-testid="error"]');
          return errorEl ? errorEl.textContent : 'Unknown error';
        });
        testResults.pages.logTrade.errorText = errorText;
        testResults.errors.push(`Log Trade: ${errorText}`);
        console.log(`❌ Log Trade has errors: ${errorText}`);
      } else {
        console.log('✅ Log Trade loaded successfully');
      }
    } catch (error) {
      testResults.pages.logTrade = {
        success: false,
        error: error.message
      };
      testResults.errors.push(`Log Trade: ${error.message}`);
      console.log(`❌ Log Trade failed: ${error.message}`);
    }

    // Test 6: Check for schema cache errors in console
    console.log('\n📋 Test 6: Checking for schema cache errors...');
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // Navigate to a page that might trigger schema cache issues
    await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000); // Wait for any async operations
    
    const schemaCacheErrors = consoleLogs.filter(log => 
      log.includes('strategy_rule_compliance') || 
      log.includes('schema cache') ||
      log.includes('information_schema.columns')
    );
    
    testResults.functionality.schemaCacheErrors = {
      count: schemaCacheErrors.length,
      errors: schemaCacheErrors
    };
    
    if (schemaCacheErrors.length > 0) {
      console.log(`❌ Found ${schemaCacheErrors.length} schema cache errors:`);
      schemaCacheErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No schema cache errors detected');
    }

    // Test 7: Test navigation
    console.log('\n📋 Test 7: Testing navigation...');
    try {
      // Test navigation links
      const navLinks = await page.$$('nav a, .sidebar a, [data-testid="nav-link"]');
      testResults.functionality.navigation = {
        linkCount: navLinks.length,
        success: navLinks.length > 0
      };
      console.log(`✅ Found ${navLinks.length} navigation links`);
    } catch (error) {
      testResults.functionality.navigation = {
        success: false,
        error: error.message
      };
      console.log(`❌ Navigation test failed: ${error.message}`);
    }

    // Test 8: Test authentication flow
    console.log('\n📋 Test 8: Testing authentication...');
    try {
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
      
      // Check if login page loads
      const loginForm = await page.$('form, [data-testid="login-form"]');
      testResults.functionality.authentication = {
        success: !!loginForm,
        hasLoginForm: !!loginForm
      };
      
      if (loginForm) {
        console.log('✅ Login page loaded successfully');
      } else {
        console.log('❌ Login form not found');
      }
    } catch (error) {
      testResults.functionality.authentication = {
        success: false,
        error: error.message
      };
      console.log(`❌ Authentication test failed: ${error.message}`);
    }

    // Summary
    console.log('\n📋 Test Summary');
    const pageTests = Object.values(testResults.pages);
    const functionalityTests = Object.values(testResults.functionality);
    
    const successfulPageTests = pageTests.filter(test => test.success).length;
    const successfulFunctionalityTests = functionalityTests.filter(test => test.success).length;
    
    const totalTests = pageTests.length + functionalityTests.length;
    const successfulTests = successfulPageTests + successfulFunctionalityTests;
    
    console.log(`Total tests: ${totalTests}`);
    console.log(`Successful: ${successfulTests}`);
    console.log(`Failed: ${totalTests - successfulTests}`);
    console.log(`Schema cache errors: ${testResults.functionality.schemaCacheErrors.count}`);
    console.log(`Other errors: ${testResults.errors.length}`);
    
    if (testResults.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      testResults.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    const overallSuccess = successfulTests === totalTests && 
                         testResults.functionality.schemaCacheErrors.count === 0;
    
    if (overallSuccess) {
      console.log('\n✅ All tests passed! Application is working correctly.');
      console.log('✅ No schema cache errors detected.');
      console.log('✅ All main pages are accessible.');
    } else {
      console.log('\n⚠️ Some tests failed. Application may have issues.');
      if (testResults.functionality.schemaCacheErrors.count > 0) {
        console.log('⚠️ Schema cache issues are still present.');
      }
    }

    await browser.close();
    return {
      success: overallSuccess,
      results: testResults,
      summary: {
        total: totalTests,
        successful: successfulTests,
        failed: totalTests - successfulTests,
        schemaCacheErrors: testResults.functionality.schemaCacheErrors.count,
        otherErrors: testResults.errors.length
      }
    };

  } catch (error) {
    console.error('❌ Browser test failed:', error.message);
    await browser.close();
    return {
      success: false,
      error: error.message,
      results: testResults
    };
  }
}

// Check if puppeteer is available, if not use a simpler approach
try {
  require('puppeteer');
  testApplicationFunctionality().then(result => {
    console.log('\n🏁 Browser testing completed');
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Browser testing execution failed:', error);
    process.exit(1);
  });
} catch (error) {
  console.log('⚠️ Puppeteer not available, using manual testing instructions...');
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Test the following pages:');
  console.log('   - http://localhost:3000/dashboard');
  console.log('   - http://localhost:3000/strategies');
  console.log('   - http://localhost:3000/trades');
  console.log('   - http://localhost:3000/log-trade');
  console.log('   - http://localhost:3000/login');
  console.log('3. Check browser console for any schema cache errors');
  console.log('4. Test navigation between pages');
  console.log('5. Test strategy selection functionality');
  console.log('6. Test trade logging functionality');
  console.log('\n🔍 Look for these specific errors:');
  console.log('   - "strategy_rule_compliance"');
  console.log('   - "schema cache"');
  console.log('   - "information_schema.columns"');
  console.log('   - "relation does not exist"');
  process.exit(0);
}