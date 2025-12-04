const { chromium } = require('playwright');

async function debugConsoleErrors() {
  console.log('🔍 Starting console error debugging for trades page...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console logs, warnings, and errors
  const consoleMessages = [];
  const errors = [];
  const warnings = [];
  const logs = [];
  
  page.on('console', msg => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    };
    
    consoleMessages.push(message);
    
    if (msg.type() === 'error') {
      errors.push(message);
      console.error('🚨 CONSOLE ERROR:', message);
    } else if (msg.type() === 'warning') {
      warnings.push(message);
      console.warn('⚠️  CONSOLE WARNING:', message);
    } else {
      logs.push(message);
      console.log('📝 CONSOLE LOG:', message);
    }
  });
  
  // Capture uncaught exceptions
  page.on('pageerror', error => {
    console.error('💥 PAGE ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    errors.push({
      type: 'pageerror',
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  // Capture request failures
  page.on('requestfailed', request => {
    console.error('❌ REQUEST FAILED:', {
      url: request.url(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    });
    errors.push({
      type: 'requestfailed',
      url: request.url(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    // Navigate to the trades page
    console.log('🌐 Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle' });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if we need to login
    const loginForm = await page.locator('form').first();
    const isLoginPage = await loginForm.isVisible().catch(() => false);
    
    if (isLoginPage) {
      console.log('🔐 Login page detected, attempting to login...');
      
      // Fill login form with proper credentials
      await page.fill('input[type="email"]', 'testuser1000@verotrade.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      // Wait for navigation - handle both dashboard and trades redirects
      try {
        await page.waitForURL('**/trades', { timeout: 5000 });
        await page.waitForTimeout(2000);
      } catch (error) {
        // If redirected to dashboard, navigate to trades manually
        console.log('🔄 Redirected to dashboard, navigating to trades manually...');
        await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
      }
    }
    
    // Wait for trades to load
    console.log('⏳ Waiting for trades to load...');
    await page.waitForSelector('.dashboard-card', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Try to interact with some elements to trigger potential errors
    console.log('🖱️ Interacting with page elements...');
    
    // Try to expand a trade if any exist
    const expandButtons = await page.locator('button').filter({ hasText: '' }).all();
    if (expandButtons.length > 0) {
      await expandButtons[0].click();
      await page.waitForTimeout(1000);
    }
    
    // Try to use pagination if available
    const nextButton = await page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Try to use filters
    const symbolInput = await page.locator('input[placeholder*="symbol"]').first();
    if (await symbolInput.isVisible()) {
      await symbolInput.fill('AAPL');
      await page.waitForTimeout(1000);
      await symbolInput.fill('');
      await page.waitForTimeout(1000);
    }
    
    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('💥 Navigation error:', error.message);
    errors.push({
      type: 'navigation',
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalConsoleMessages: consoleMessages.length,
      errors: errors.length,
      warnings: warnings.length,
      logs: logs.length
    },
    errors,
    warnings,
    logs,
    allConsoleMessages: consoleMessages
  };
  
  // Save report to file
  const fs = require('fs');
  const reportPath = './console-error-debug-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n📊 CONSOLE ERROR DEBUG REPORT SUMMARY:');
  console.log('='.repeat(50));
  console.log(`Total console messages: ${report.summary.totalConsoleMessages}`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Warnings: ${report.summary.warnings}`);
  console.log(`Logs: ${report.summary.logs}`);
  
  if (errors.length > 0) {
    console.log('\n🚨 ERRORS FOUND:');
    errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.type}: ${error.text}`);
      if (error.location) {
        console.log(`   Location: ${error.location.url}:${error.location.lineNumber}`);
      }
      if (error.stack) {
        console.log(`   Stack: ${error.stack}`);
      }
    });
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS FOUND:');
    warnings.forEach((warning, index) => {
      console.log(`\n${index + 1}. ${warning.type}: ${warning.text}`);
      if (warning.location) {
        console.log(`   Location: ${warning.location.url}:${warning.location.lineNumber}`);
      }
    });
  }
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  await browser.close();
  return report;
}

// Run the debug function
debugConsoleErrors()
  .then(report => {
    console.log('✅ Console error debugging completed');
    process.exit(report.summary.errors > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('💥 Debug script failed:', error);
    process.exit(1);
  });