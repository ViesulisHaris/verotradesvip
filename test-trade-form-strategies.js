const { chromium } = require('playwright');
const fs = require('fs');

async function testTradeFormStrategies() {
  console.log('🔍 Testing TradeForm strategies loading in browser...');
  console.log('='.repeat(80));

  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Set up console logging to capture debug messages
  page.on('console', msg => {
    if (msg.text().includes('🔍 [DEBUG]') || 
        msg.text().includes('❌ [DEBUG]') ||
        msg.text().includes('✅ [DEBUG]') ||
        msg.text().includes('Strategies loaded') ||
        msg.text().includes('Strategy change') ||
        msg.text().includes('Strategy dropdown')) {
      console.log(`📝 [CONSOLE] ${msg.text()}`);
    }
  });

  try {
    // Navigate to the log-trade page (which contains the TradeForm)
    console.log('\n📍 Step 1: Navigating to log-trade page...');
    await page.goto('http://localhost:3001/log-trade', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Check if we need to login
    console.log('\n📍 Step 2: Checking authentication status...');
    
    // First check if we're on the login page or if authentication is required
    const currentUrl = page.url();
    const isOnLoginPage = currentUrl.includes('/login');
    const authRequiredText = await page.locator('text=Authentication Required').isVisible().catch(() => false);
    
    if (isOnLoginPage || authRequiredText) {
      console.log('🔐 Login required. Performing auto-login...');
      
      // If not already on login page, navigate there
      if (!isOnLoginPage) {
        await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
      }
      
      // Fill in login form
      await page.locator('input[type="email"]').fill('testuser@verotrade.com');
      await page.locator('input[type="password"]').fill('TestPassword123!');
      
      // Click login button
      await page.locator('button[type="submit"]').click();
      
      // Wait for login to complete
      await page.waitForTimeout(3000);
      
      // Check if login was successful by looking for a redirect away from login page
      const loginUrl = page.url();
      if (loginUrl.includes('/login')) {
        console.log('❌ Login failed. Still on login page.');
        await browser.close();
        return;
      }
      
      console.log('✅ Auto-login successful!');
      
      // Now navigate to log-trade page
      await page.goto('http://localhost:3001/log-trade', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    } else {
      console.log('✅ Already authenticated or authentication not required');
    }

    // Wait for the TradeForm to load
    console.log('\n📍 Step 3: Waiting for TradeForm to load...');
    await page.waitForTimeout(3000);
    
    // Look for the strategy dropdown
    console.log('\n📍 Step 4: Checking for strategy dropdown...');
    
    // Try multiple selectors for the dropdown
    const possibleSelectors = [
      'select[name="strategy_id"]',
      '.custom-dropdown',
      '[role="combobox"]',
      'button[aria-haspopup="listbox"]',
      '.dropdown-enhanced',
      'text=Strategy' // Look for the label
    ];
    
    let dropdownFound = false;
    let usedSelector = '';
    let optionCount = 0; // Initialize optionCount for later use
    
    for (const selector of possibleSelectors) {
      try {
        const isVisible = await page.locator(selector).isVisible().catch(() => false);
        if (isVisible) {
          dropdownFound = true;
          usedSelector = selector;
          console.log(`✅ Strategy dropdown found with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!dropdownFound) {
      console.log('❌ Strategy dropdown not found in the DOM with any selector');
      
      // Let's check what's actually on the page
      const pageContent = await page.content();
      console.log('🔍 Page HTML contains strategy-related elements:');
      console.log(`  - select[name="strategy_id"]: ${pageContent.includes('select name="strategy_id"')}`);
      console.log(`  - CustomDropdown: ${pageContent.includes('CustomDropdown')}`);
      console.log(`  - strategy dropdown: ${pageContent.includes('strategy')}`);
      console.log(`  - Select a strategy: ${pageContent.includes('Select a strategy')}`);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'trade-form-debug.png', fullPage: true });
      console.log('📸 Debug screenshot saved as trade-form-debug.png');
      
      await browser.close();
      return;
    }
    
    // Check if the dropdown is disabled (which would indicate no strategies loaded)
    console.log('\n📍 Step 5: Checking dropdown state...');
    const dropdownDisabled = await page.locator(usedSelector).isDisabled().catch(() => false);
    
    if (dropdownDisabled) {
      console.log('⚠️ Strategy dropdown is disabled - this suggests no strategies were loaded');
    } else {
      console.log('✅ Strategy dropdown is enabled');
    }
    
    // Try to open the dropdown
    console.log('\n📍 Step 6: Attempting to open the dropdown...');
    try {
      await page.locator(usedSelector).click();
      await page.waitForTimeout(1000);
      
      // Check if any options are visible
      const optionsVisible = await page.locator('.dropdown-options-container, [role="listbox"]').isVisible().catch(() => false);
      
      if (optionsVisible) {
        console.log('✅ Dropdown options are visible');
        
        // Count the options using the correct class names
        optionCount = await page.locator('.dropdown-options-container .dropdown-option, [role="listbox"] [role="option"]').count();
        console.log(`📊 Found ${optionCount} dropdown options`);
        
        if (optionCount > 0) {
          // Get the text of the first few options
          for (let i = 0; i < Math.min(3, optionCount); i++) {
            const optionText = await page.locator('.dropdown-options-container .dropdown-option, [role="listbox"] [role="option"]').nth(i).textContent();
            console.log(`  Option ${i + 1}: "${optionText || 'empty'}"`);
          }
        } else {
          console.log('⚠️ No options found in the dropdown');
        }
      } else {
        console.log('❌ Dropdown options are not visible');
        
        // Let's check if the dropdown is actually open but options are not visible
        const dropdownContainer = await page.locator('.dropdown-options-container').isVisible().catch(() => false);
        console.log(`🔍 Dropdown container visible: ${dropdownContainer}`);
        
        if (dropdownContainer) {
          // Check if there are any options in the DOM
          const optionsInDOM = await page.locator('.dropdown-options-container .dropdown-option').count();
          console.log(`🔍 Options in DOM: ${optionsInDOM}`);
          
          if (optionsInDOM > 0) {
            console.log('✅ Options are in DOM but may be hidden due to styling');
            // Let's check the CSS properties
            const firstOption = page.locator('.dropdown-options-container .dropdown-option').first();
            const isVisible = await firstOption.isVisible();
            const display = await firstOption.evaluate(el => getComputedStyle(el).display);
            const opacity = await firstOption.evaluate(el => getComputedStyle(el).opacity);
            console.log(`🔍 First option CSS - display: ${display}, opacity: ${opacity}, visible: ${isVisible}`);
          }
        }
      }
    } catch (error) {
      console.log('❌ Error interacting with dropdown:', error.message);
    }
    
    // Check for debug information in the DOM
    console.log('\n📍 Step 7: Checking for debug information...');
    const debugInfoExists = await page.locator('text=/Strategies loaded:|Selected:|Selected strategy:/').isVisible().catch(() => false);
    
    if (debugInfoExists) {
      console.log('✅ Debug information found in DOM');
      const debugText = await page.locator('text=/Strategies loaded:|Selected:|Selected strategy:/').textContent();
      console.log(`📝 Debug info: "${debugText}"`);
    } else {
      console.log('⚠️ No debug information found in DOM');
    }
    
    // Take a screenshot for visual verification
    console.log('\n📍 Step 8: Taking screenshot for verification...');
    await page.screenshot({ path: 'trade-form-strategies-test.png', fullPage: true });
    console.log('✅ Screenshot saved as trade-form-strategies-test.png');
    
    console.log('\n📍 Step 9: Final verification...');
    
    // Based on our findings, determine the issue
    if (dropdownDisabled) {
      console.log('❌ ISSUE IDENTIFIED: The strategy dropdown is disabled, which means no strategies were loaded');
      console.log('💡 This could be due to:');
      console.log('   1. No strategies exist in the database for this user');
      console.log('   2. Authentication issues preventing strategy loading');
      console.log('   3. Database query errors');
      console.log('   4. Schema cache issues');
    } else if (optionCount === 0) {
      console.log('❌ ISSUE IDENTIFIED: The dropdown is enabled but has no options');
      console.log('💡 This suggests strategies were loaded but not properly formatted for the dropdown');
    } else {
      console.log('✅ SUCCESS: Strategies appear to be loaded and displayed correctly in the dropdown');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testTradeFormStrategies()
  .then(() => {
    console.log('\n✅ TradeForm strategies test completed!');
    console.log('📝 Check trade-form-strategies-test.png for visual verification');
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });