const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testCalendarFixes() {
  console.log('🚀 Starting comprehensive calendar page testing...\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless testing
    slowMo: 500 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // Enable console logging to capture any errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  // Enable error logging
  const errors = [];
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack
    });
  });
  
  const testResults = {
    serverRunning: false,
    authErrorFixed: false,
    authInitialized: false,
    metricsPositionedCorrectly: false,
    navigationWorking: false,
    tradesFunctionalityWorking: false,
    consoleErrors: [],
    responsiveLayoutWorking: false,
    overallStatus: 'FAILED'
  };
  
  try {
    console.log('📍 Step 1: Checking if development server is running...');
    const response = await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    if (response && response.status() === 200) {
      testResults.serverRunning = true;
      console.log('✅ Development server is running properly');
    } else {
      console.log('❌ Development server is not responding correctly');
      throw new Error('Server not running');
    }
    
    console.log('\n📍 Step 2: Testing authentication flow...');
    // Fill in login credentials using the test credentials from the login page
    await page.fill('input[type="email"]', 'testuser@verotrade.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard or calendar
    await page.waitForNavigation({ timeout: 10000 });
    
    // Navigate to calendar page
    console.log('\n📍 Step 3: Navigating to calendar page...');
    await page.goto('http://localhost:3000/calendar', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    // Check for AuthSessionMissingError in console
    console.log('\n📍 Step 4: Checking for AuthSessionMissingError...');
    await page.waitForTimeout(2000); // Wait for any potential errors to appear
    
    const authErrors = consoleMessages.filter(msg => 
      msg.text.includes('AuthSessionMissingError') || 
      msg.text.includes('Auth session missing')
    );
    
    if (authErrors.length === 0) {
      testResults.authErrorFixed = true;
      console.log('✅ No AuthSessionMissingError detected');
    } else {
      console.log('❌ AuthSessionMissingError still present:', authErrors);
    }
    
    console.log('\n📍 Step 5: Verifying authentication state initialization...');
    // Look for auth initialization messages in console
    const authInitMessages = consoleMessages.filter(msg => 
      msg.text.includes('AUTH_CONTEXT') && 
      (msg.text.includes('Initializing') || msg.text.includes('Session retrieved'))
    );
    
    if (authInitMessages.length > 0) {
      testResults.authInitialized = true;
      console.log('✅ Authentication state is properly initialized');
    } else {
      console.log('❌ Authentication state initialization issues detected');
    }
    
    console.log('\n📍 Step 6: Checking monthly performance metrics positioning...');
    // Wait for calendar to load
    await page.waitForSelector('.glass', { timeout: 5000 });
    
    // Check if monthly metrics section exists and is positioned after calendar
    const calendarGrid = await page.locator('.grid.grid-cols-7').first();
    const metricsSection = await page.locator('text=Monthly Performance Metrics').first();
    
    if (await metricsSection.isVisible()) {
      // Get bounding boxes to check positioning
      const calendarBox = await calendarGrid.boundingBox();
      const metricsBox = await metricsSection.boundingBox();
      
      if (calendarBox && metricsBox && metricsBox.y > calendarBox.y + calendarBox.height) {
        testResults.metricsPositionedCorrectly = true;
        console.log('✅ Monthly performance metrics section is positioned below the calendar');
      } else {
        console.log('❌ Monthly performance metrics section is not positioned correctly');
      }
    } else {
      console.log('❌ Monthly performance metrics section not found');
    }
    
    console.log('\n📍 Step 7: Testing calendar navigation...');
    // Test month navigation
    const currentMonth = await page.locator('h1').first().textContent();
    
    // Click next month button
    await page.click('button:has-text(">")');
    await page.waitForTimeout(1000);
    
    const nextMonth = await page.locator('h1').first().textContent();
    
    // Click previous month button
    await page.click('button:has-text("<")');
    await page.waitForTimeout(1000);
    
    const backToCurrentMonth = await page.locator('h1').first().textContent();
    
    if (currentMonth !== nextMonth && currentMonth === backToCurrentMonth) {
      testResults.navigationWorking = true;
      console.log('✅ Calendar navigation is working properly');
    } else {
      console.log('❌ Calendar navigation has issues');
    }
    
    console.log('\n📍 Step 8: Testing trades functionality...');
    // Look for add trade button
    const addTradeButton = await page.locator('a[href="/log-trade"]').first();
    if (await addTradeButton.isVisible()) {
      testResults.tradesFunctionalityWorking = true;
      console.log('✅ Add trade functionality is accessible');
      
      // Test clicking on a day with trades (if any exist)
      const daysWithTrades = await page.locator('button:has-text("$")').count();
      if (daysWithTrades > 0) {
        await page.locator('button:has-text("$")').first().click();
        await page.waitForTimeout(1000);
        
        // Check if trade modal appears
        const tradeModal = await page.locator('[role="dialog"]').count();
        if (tradeModal > 0) {
          console.log('✅ Trade viewing functionality is working');
        }
        
        // Close modal if open
        const closeButton = await page.locator('button:has-text("Close")').or(page.locator('button:has-text("×")')).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    } else {
      console.log('❌ Add trade functionality not accessible');
    }
    
    console.log('\n📍 Step 9: Checking for console errors...');
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');
    
    if (errorMessages.length === 0) {
      console.log('✅ No console errors detected');
    } else {
      console.log('❌ Console errors detected:', errorMessages);
      testResults.consoleErrors = errorMessages;
    }
    
    if (warningMessages.length > 0) {
      console.log('⚠️ Console warnings detected:', warningMessages);
    }
    
    console.log('\n📍 Step 10: Testing responsive layout...');
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667 },  // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ];
    
    let responsiveWorking = true;
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(1000);
      
      // Check if calendar is still visible and functional
      const calendarVisible = await page.locator('.grid.grid-cols-7').isVisible();
      const metricsVisible = await page.locator('text=Monthly Performance Metrics').isVisible();
      
      if (!calendarVisible || !metricsVisible) {
        responsiveWorking = false;
        console.log(`❌ Layout issues detected at viewport ${viewport.width}x${viewport.height}`);
        break;
      }
    }
    
    if (responsiveWorking) {
      testResults.responsiveLayoutWorking = true;
      console.log('✅ Responsive layout is working correctly');
    }
    
    // Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.consoleErrors.push({
      type: 'test-error',
      message: error.message,
      stack: error.stack
    });
  } finally {
    // Take screenshot for documentation
    await page.screenshot({ 
      path: 'calendar-test-results.png',
      fullPage: true 
    });
    
    await browser.close();
  }
  
  // Calculate overall status
  const passedTests = Object.values(testResults).filter(value => 
    typeof value === 'boolean' && value === true
  ).length;
  
  const totalTests = Object.keys(testResults).filter(key => 
    typeof testResults[key] === 'boolean'
  ).length;
  
  if (passedTests === totalTests) {
    testResults.overallStatus = 'PASSED';
  } else if (passedTests >= totalTests * 0.8) {
    testResults.overallStatus = 'PARTIALLY_PASSED';
  }
  
  return testResults;
}

// Run the test
testCalendarFixes()
  .then(results => {
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('========================');
    console.log(`Overall Status: ${results.overallStatus}`);
    console.log(`Server Running: ${results.serverRunning ? '✅' : '❌'}`);
    console.log(`Auth Error Fixed: ${results.authErrorFixed ? '✅' : '❌'}`);
    console.log(`Auth Initialized: ${results.authInitialized ? '✅' : '❌'}`);
    console.log(`Metrics Positioned: ${results.metricsPositionedCorrectly ? '✅' : '❌'}`);
    console.log(`Navigation Working: ${results.navigationWorking ? '✅' : '❌'}`);
    console.log(`Trades Functionality: ${results.tradesFunctionalityWorking ? '✅' : '❌'}`);
    console.log(`Console Errors: ${results.consoleErrors.length === 0 ? '✅' : '❌'}`);
    console.log(`Responsive Layout: ${results.responsiveLayoutWorking ? '✅' : '❌'}`);
    
    if (results.consoleErrors.length > 0) {
      console.log('\n🚨 Console Errors Found:');
      results.consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }
    
    // Save results to file
    const reportPath = path.join(__dirname, 'calendar-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    process.exit(results.overallStatus === 'PASSED' ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });