const { chromium } = require('playwright');
const fs = require('fs');

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  errors: [],
  warnings: [],
  consoleMessages: [],
  screenshots: [],
  interactionResults: [],
  summary: {
    totalErrors: 0,
    totalWarnings: 0,
    dropdownFunctional: false,
    allTestsPassed: false
  }
};

async function captureScreenshot(page, name) {
  const timestamp = Date.now();
  const filename = `dropdown-error-test-${name}-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  testResults.screenshots.push({
    name,
    filename,
    timestamp
  });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filename;
}

async function setupErrorMonitoring(page) {
  // Capture console errors
  page.on('console', msg => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    };
    
    testResults.consoleMessages.push(message);
    
    if (msg.type() === 'error') {
      testResults.errors.push(message);
      console.error(`🚨 [JS ERROR] ${message.text}`);
      if (message.location) {
        console.error(`   Location: ${message.location.url}:${message.location.lineNumber}`);
      }
    } else if (msg.type() === 'warning') {
      testResults.warnings.push(message);
      console.warn(`⚠️ [JS WARNING] ${message.text}`);
    } else if (msg.text().includes('dropdown') || msg.text().includes('strategy')) {
      console.log(`📝 [CONSOLE] ${msg.text()}`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    const errorInfo = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    testResults.errors.push(errorInfo);
    console.error(`🚨 [PAGE ERROR] ${errorInfo.name}: ${errorInfo.message}`);
  });

  // Capture request failures
  page.on('requestfailed', request => {
    const failureInfo = {
      url: request.url(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    };
    console.warn(`⚠️ [REQUEST FAILED] ${failureInfo.url} - ${failureInfo.failure?.errorText}`);
  });
}

async function performLogin(page) {
  console.log('\n🔐 Checking authentication status...');
  
  const currentUrl = page.url();
  const isOnLoginPage = currentUrl.includes('/login');
  const authRequiredText = await page.locator('text=Authentication Required').isVisible().catch(() => false);
  
  if (isOnLoginPage || authRequiredText) {
    console.log('🔐 Login required. Performing auto-login...');
    
    if (!isOnLoginPage) {
      await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }
    
    await page.locator('input[type="email"]').fill('testuser@verotrade.com');
    await page.locator('input[type="password"]').fill('TestPassword123!');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    
    const loginUrl = page.url();
    if (loginUrl.includes('/login')) {
      throw new Error('Login failed. Still on login page.');
    }
    
    console.log('✅ Auto-login successful!');
    await page.goto('http://localhost:3001/log-trade', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  } else {
    console.log('✅ Already authenticated or authentication not required');
  }
}

async function testDropdownInteraction(page, interactionType, selector) {
  const result = {
    type: interactionType,
    success: false,
    errors: [],
    timestamp: new Date().toISOString()
  };
  
  try {
    console.log(`\n📍 Testing ${interactionType} interaction...`);
    
    if (interactionType === 'mouse') {
      await page.locator(selector).click();
      await page.waitForTimeout(1000);
      
      // Check if dropdown opened
      const optionsVisible = await page.locator('.dropdown-options-container, [role="listbox"]').isVisible().catch(() => false);
      result.success = optionsVisible;
      
      if (optionsVisible) {
        // Try to select an option
        const options = page.locator('.dropdown-options-container .dropdown-option, [role="listbox"] [role="option"]');
        const optionCount = await options.count();
        
        if (optionCount > 0) {
          await options.first().click();
          await page.waitForTimeout(500);
          result.optionSelected = true;
        }
      }
    } else if (interactionType === 'keyboard') {
      await page.locator(selector).focus();
      await page.waitForTimeout(500);
      
      // Try to open with Enter key
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      // Check if dropdown opened
      const optionsVisible = await page.locator('.dropdown-options-container, [role="listbox"]').isVisible().catch(() => false);
      result.success = optionsVisible;
      
      if (optionsVisible) {
        // Try to navigate with arrow keys
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(500);
        
        // Try to select with Enter
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        result.optionSelected = true;
      }
    }
    
    await captureScreenshot(page, `after-${interactionType}-interaction`);
    
  } catch (error) {
    result.errors.push({
      message: error.message,
      stack: error.stack
    });
    console.error(`❌ ${interactionType} interaction failed:`, error.message);
  }
  
  testResults.interactionResults.push(result);
  return result;
}

async function testDropdownEventHandlers(page, selector) {
  console.log('\n📍 Testing dropdown event handlers...');
  
  const eventTestResults = {
    clickEvents: false,
    focusEvents: false,
    blurEvents: false,
    changeEvents: false,
    keyEvents: false
  };
  
  try {
    // Inject JavaScript to monitor events
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return;
      
      window.dropdownEventLog = [];
      
      const logEvent = (eventType) => {
        window.dropdownEventLog.push({
          type: eventType,
          timestamp: Date.now()
        });
      };
      
      element.addEventListener('click', () => logEvent('click'));
      element.addEventListener('focus', () => logEvent('focus'));
      element.addEventListener('blur', () => logEvent('blur'));
      element.addEventListener('change', () => logEvent('change'));
      element.addEventListener('keydown', () => logEvent('keydown'));
      element.addEventListener('keyup', () => logEvent('keyup'));
    }, selector);
    
    // Test click events
    await page.locator(selector).click();
    await page.waitForTimeout(500);
    
    // Test focus/blur events
    await page.locator(selector).focus();
    await page.waitForTimeout(500);
    await page.locator('body').click(); // Blur the element
    await page.waitForTimeout(500);
    
    // Test keyboard events
    await page.locator(selector).focus();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    
    // Check event log
    const eventLog = await page.evaluate(() => window.dropdownEventLog || []);
    
    eventTestResults.clickEvents = eventLog.some(e => e.type === 'click');
    eventTestResults.focusEvents = eventLog.some(e => e.type === 'focus');
    eventTestResults.blurEvents = eventLog.some(e => e.type === 'blur');
    eventTestResults.keyEvents = eventLog.some(e => e.type === 'keydown' || e.type === 'keyup');
    
    console.log('✅ Event handler test results:', eventTestResults);
    
  } catch (error) {
    console.error('❌ Event handler test failed:', error.message);
    testResults.errors.push({
      message: `Event handler test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
  
  return eventTestResults;
}

async function runComprehensiveDropdownTest() {
  console.log('🔍 Starting comprehensive JavaScript error test for TradeForm strategy dropdown...');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Set up comprehensive error monitoring
  await setupErrorMonitoring(page);
  
  try {
    // Navigate to the log-trade page
    console.log('\n📍 Step 1: Navigating to log-trade page...');
    await page.goto('http://localhost:3001/log-trade', { waitUntil: 'networkidle' });
    await captureScreenshot(page, 'initial-page-load');
    await page.waitForTimeout(3000);
    
    // Handle authentication if needed
    await performLogin(page);
    await captureScreenshot(page, 'after-login');
    
    // Wait for the TradeForm to load
    console.log('\n📍 Step 2: Waiting for TradeForm to load...');
    await page.waitForTimeout(3000);
    
    // Look for the strategy dropdown
    console.log('\n📍 Step 3: Locating strategy dropdown...');
    
    const possibleSelectors = [
      'select[name="strategy_id"]',
      '.custom-dropdown',
      '[role="combobox"]',
      'button[aria-haspopup="listbox"]',
      '.dropdown-enhanced'
    ];
    
    let dropdownFound = false;
    let usedSelector = '';
    
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
      throw new Error('Strategy dropdown not found with any selector');
    }
    
    await captureScreenshot(page, 'dropdown-found');
    
    // Test dropdown state
    console.log('\n📍 Step 4: Testing dropdown state...');
    const dropdownDisabled = await page.locator(usedSelector).isDisabled().catch(() => false);
    const dropdownVisible = await page.locator(usedSelector).isVisible().catch(() => false);
    
    console.log(`📊 Dropdown state - Visible: ${dropdownVisible}, Disabled: ${dropdownDisabled}`);
    
    if (dropdownDisabled) {
      console.log('⚠️ Dropdown is disabled - checking for errors in strategy loading');
    }
    
    // Test event handlers
    console.log('\n📍 Step 5: Testing event handlers...');
    const eventResults = await testDropdownEventHandlers(page, usedSelector);
    
    // Test mouse interactions
    console.log('\n📍 Step 6: Testing mouse interactions...');
    const mouseResult = await testDropdownInteraction(page, 'mouse', usedSelector);
    
    // Test keyboard interactions
    console.log('\n📍 Step 7: Testing keyboard interactions...');
    const keyboardResult = await testDropdownInteraction(page, 'keyboard', usedSelector);
    
    // Check for any runtime errors after interactions
    console.log('\n📍 Step 8: Checking for runtime errors after interactions...');
    await page.waitForTimeout(2000);
    
    // Final screenshot
    await captureScreenshot(page, 'final-state');
    
    // Update test results summary
    testResults.summary.totalErrors = testResults.errors.length;
    testResults.summary.totalWarnings = testResults.warnings.length;
    testResults.summary.dropdownFunctional = mouseResult.success || keyboardResult.success;
    testResults.summary.allTestsPassed = testResults.errors.length === 0;
    
    console.log('\n📍 Step 9: Generating test report...');
    
    // Save detailed test results
    const reportFilename = `dropdown-error-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportFilename, JSON.stringify(testResults, null, 2));
    console.log(`📄 Detailed test report saved: ${reportFilename}`);
    
    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total JavaScript Errors: ${testResults.summary.totalErrors}`);
    console.log(`Total JavaScript Warnings: ${testResults.summary.totalWarnings}`);
    console.log(`Dropdown Functional: ${testResults.summary.dropdownFunctional}`);
    console.log(`All Tests Passed: ${testResults.summary.allTestsPassed}`);
    
    if (testResults.errors.length > 0) {
      console.log('\n🚨 JAVASCRIPT ERRORS FOUND:');
      testResults.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.message || error.name}`);
        if (error.location) {
          console.log(`   Location: ${error.location.url}:${error.location.lineNumber}`);
        }
        if (error.stack) {
          console.log(`   Stack: ${error.stack.split('\n')[0]}`);
        }
      });
    }
    
    if (testResults.warnings.length > 0) {
      console.log('\n⚠️ JAVASCRIPT WARNINGS FOUND:');
      testResults.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.text}`);
      });
    }
    
    console.log('\n📸 Screenshots captured:');
    testResults.screenshots.forEach(screenshot => {
      console.log(`  - ${screenshot.filename}: ${screenshot.name}`);
    });
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.errors.push({
      message: `Test execution failed: ${error.message}`,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    await captureScreenshot(page, 'test-failure');
    return testResults;
    
  } finally {
    await browser.close();
  }
}

// Run the test
runComprehensiveDropdownTest()
  .then((results) => {
    console.log('\n✅ Comprehensive JavaScript error test completed!');
    console.log(`📄 Check the detailed report and screenshots for more information.`);
    
    if (results.summary.allTestsPassed) {
      console.log('🎉 No JavaScript errors detected in dropdown functionality!');
    } else {
      console.log('⚠️ JavaScript errors or issues were detected. See details above.');
    }
  })
  .catch(error => {
    console.error('❌ Test failed to run:', error);
  });