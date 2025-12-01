const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function diagnoseStrategyError() {
  console.log('🔍 Starting browser-based strategy error diagnosis...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for visual inspection
    slowMo: 1000 // Slow down for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture console logs and errors
  const consoleLogs = [];
  const jsErrors = [];
  const networkRequests = [];
  const networkResponses = [];
  
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    console.log(`📝 CONSOLE [${msg.type()}]: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    jsErrors.push(errorEntry);
    console.error('❌ JAVASCRIPT ERROR:', error.message);
  });
  
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('response', response => {
    const responseEntry = {
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      timestamp: new Date().toISOString()
    };
    networkResponses.push(responseEntry);
    console.log(`🌐 NETWORK: ${response.status()} ${response.url()}`);
  });
  
  try {
    console.log('🌐 Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(5000);
    
    // Check if we're redirected to login
    const currentUrl = page.url();
    console.log(`📍 Current URL after navigation: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('🔐 Redirected to login - need to authenticate first');
      
      // Try to login with test credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForTimeout(3000);
      
      // Navigate back to strategies
      await page.goto('http://localhost:3000/strategies', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      await page.waitForTimeout(5000);
    }
    
    // Take screenshot of the strategies page
    const screenshotPath = 'strategy-page-screenshot.png';
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    // Check for error message on the page
    const errorElement = await page.locator('text=An unexpected error occurred while loading the strategy').first();
    const hasError = await errorElement.isVisible();
    
    if (hasError) {
      console.log('🚨 ERROR MESSAGE FOUND ON PAGE!');
      
      // Get the full error context
      const errorContainer = await page.locator('.glass.p-8.text-center').first();
      const errorText = await errorContainer.textContent();
      console.log('📄 Full error text:', errorText);
      
      // Check if there's a "Try Again" button
      const tryAgainButton = await page.locator('text=Try Again').first();
      const hasTryAgain = await tryAgainButton.isVisible();
      console.log('🔄 Try Again button visible:', hasTryAgain);
      
      // Try clicking the Try Again button to see what happens
      if (hasTryAgain) {
        console.log('🔄 Clicking Try Again button...');
        await tryAgainButton.click();
        await page.waitForTimeout(3000);
        
        // Take another screenshot after clicking
        const afterClickScreenshot = 'strategy-page-after-click.png';
        await page.screenshot({ 
          path: afterClickScreenshot, 
          fullPage: true 
        });
        console.log(`📸 Screenshot after click saved: ${afterClickScreenshot}`);
      }
    } else {
      console.log('✅ No error message found on page');
      
      // Check if strategies are loaded
      const strategyCards = await page.locator('[data-testid*="strategy"], .glass.p-4.sm\\:p-6').count();
      console.log(`📊 Strategy cards found: ${strategyCards}`);
      
      // Check for loading state
      const loadingElement = await page.locator('text=Loading strategies').first();
      const isLoading = await loadingElement.isVisible();
      console.log('⏳ Loading state visible:', isLoading);
    }
    
    // Get page title and any other relevant info
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Check for any authentication issues
    const authRequired = await page.locator('text=Authentication Required').first();
    const needsAuth = await authRequired.isVisible();
    console.log('🔐 Authentication required:', needsAuth);
    
  } catch (error) {
    console.error('❌ Error during browser test:', error);
  } finally {
    await browser.close();
  }
  
  // Save diagnostic data
  const diagnosticData = {
    timestamp: new Date().toISOString(),
    consoleLogs,
    jsErrors,
    networkRequests,
    networkResponses,
    summary: {
      totalConsoleLogs: consoleLogs.length,
      totalJSErrors: jsErrors.length,
      totalNetworkRequests: networkRequests.length,
      totalNetworkResponses: networkResponses.length
    }
  };
  
  const diagnosticPath = 'strategy-error-diagnostic.json';
  fs.writeFileSync(diagnosticPath, JSON.stringify(diagnosticData, null, 2));
  console.log(`📊 Diagnostic data saved: ${diagnosticPath}`);
  
  return diagnosticData;
}

// Run the diagnosis
diagnoseStrategyError().catch(console.error);