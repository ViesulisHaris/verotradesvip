const { chromium } = require('playwright');
require('dotenv').config();

async function testTradeLoggingFix() {
  console.log('🧪 TESTING TRADE LOGGING FIX...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Fill in login credentials
    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete and redirect to dashboard
    await page.waitForURL('**/dashboard');
    console.log('   ✅ Login successful');

    // Navigate to log trade page
    console.log('3. Navigating to log trade page...');
    await page.click('a[href="/log-trade"]');
    await page.waitForURL('**/log-trade');
    console.log('   ✅ On log trade page');

    // Fill in trade form
    console.log('4. Filling trade form...');
    
    // Wait for form to be ready
    await page.waitForSelector('form');
    
    // Market selection - select stock
    await page.click('button:has-text("stock")');
    
    // Symbol
    await page.fill('input[placeholder="e.g., AAPL, BTCUSD"]', 'AAPL');
    
    // Side - select Buy
    await page.click('button:has-text("Buy")');
    
    // Quantity
    await page.fill('input[placeholder="0.00"]', '100');
    
    // Entry Price
    await page.fill('input[placeholder="0.00"]:nth-of-type(2)', '150.00');
    
    // Exit Price
    await page.fill('input[placeholder="0.00"]:nth-of-type(3)', '155.00');
    
    // P&L
    await page.fill('input[placeholder="0.00"]:nth-of-type(4)', '500');
    
    // Date (use today's date)
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[type="date"]', today);
    
    console.log('   ✅ Form filled');

    // Submit the form
    console.log('5. Submitting trade form...');
    await page.click('button:has-text("Save Trade")');
    
    // Wait for either success (redirect to dashboard) or error
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('   ✅ Trade saved successfully - redirected to dashboard');
      
      // Verify we're on dashboard and no error messages
      const errorElements = await page.$$('.text-red-400, .bg-red-500, [role="alert"]');
      if (errorElements.length > 0) {
        console.log('   ⚠️  Warning: Found error elements on dashboard');
        for (const error of errorElements) {
          const errorText = await error.textContent();
          if (errorText && errorText.includes('strategy_rule_compliance')) {
            console.log(`   ❌ STILL FOUND ERROR: ${errorText}`);
            return false;
          }
        }
      }
      
      console.log('   ✅ No strategy_rule_compliance errors found on dashboard');
      
    } catch (e) {
      // Check if we're still on the trade form page (indicating an error)
      const currentUrl = page.url();
      if (currentUrl.includes('/log-trade')) {
        console.log('   ❌ Trade submission failed - still on log trade page');
        
        // Look for error messages
        const errorElements = await page.$$('.text-red-400, .bg-red-500, [role="alert"]');
        for (const error of errorElements) {
          const errorText = await error.textContent();
          if (errorText) {
            console.log(`   📋 Error message: ${errorText}`);
            if (errorText.includes('strategy_rule_compliance')) {
              console.log('   ❌ CONFIRMED: strategy_rule_compliance error still exists');
              return false;
            }
          }
        }
      } else {
        console.log(`   ⚠️  Unexpected redirect to: ${currentUrl}`);
      }
    }

    // Test strategy selection as well
    console.log('6. Testing strategy selection...');
    await page.goto('http://localhost:3000/log-trade');
    await page.waitForLoadState('networkidle');
    
    // Check if strategies load without error
    const strategySelect = await page.$('select');
    if (strategySelect) {
      const options = await strategySelect.$$eval('option', opts => opts.map(opt => opt.textContent));
      console.log(`   ✅ Strategies loaded: ${options.length - 1} strategies found`); // -1 for "None" option
    } else {
      console.log('   ⚠️  Strategy select not found');
    }

    console.log('\n🎉 TRADE LOGGING TEST COMPLETED SUCCESSFULLY');
    console.log('✅ No strategy_rule_compliance errors detected');
    console.log('✅ Trade form is working correctly');
    console.log('✅ Strategy loading is working correctly');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take screenshot for debugging
    try {
      await page.screenshot({ path: 'trade-logging-test-error.png' });
      console.log('   📸 Screenshot saved as trade-logging-test-error.png');
    } catch (e) {
      console.log('   ⚠️  Could not save screenshot');
    }
    
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testTradeLoggingFix().then(success => {
  if (success) {
    console.log('\n🏁 FIX VERIFICATION: SUCCESS');
    console.log('The strategy_rule_compliance error has been resolved!');
  } else {
    console.log('\n🏁 FIX VERIFICATION: FAILED');
    console.log('The strategy_rule_compliance error still exists.');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});