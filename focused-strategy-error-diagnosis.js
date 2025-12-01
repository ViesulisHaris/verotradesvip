const { chromium } = require('playwright');
const fs = require('fs');

async function runFocusedDiagnosis() {
  console.log('🔍 Starting focused strategy error diagnosis...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console logs and network errors
  const consoleLogs = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  try {
    // Navigate to strategies page
    console.log('🌐 Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle' });
    
    // Wait a bit to see if we get redirected
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check if we're on login page
    if (currentUrl.includes('/login')) {
      console.log('🔐 Redirected to login page - authentication issue detected');
      
      // Try to find valid test credentials or check if there's a test user
      console.log('🔍 Looking for authentication indicators...');
      
      // Check if there are any form elements we can interact with
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      
      if (emailInput && passwordInput) {
        console.log('📝 Login form found, but credentials may be invalid');
      }
    } else {
      console.log('📄 Still on strategies page - checking for error messages...');
      
      // Look for the specific error message
      const errorElement = await page.$('text=An unexpected error occurred while loading the strategy');
      if (errorElement) {
        console.log('❌ Strategy error message found!');
        await errorElement.screenshot({ path: 'strategy-error-message.png' });
      } else {
        console.log('✅ No strategy error message found');
      }
      
      // Check for strategy cards
      const strategyCards = await page.$$('.strategy-card, [data-testid="strategy-card"]');
      console.log(`📊 Strategy cards found: ${strategyCards.length}`);
      
      // Check for loading states
      const loadingElements = await page.$$('.loading, [data-testid="loading"]');
      console.log(`⏳ Loading elements found: ${loadingElements.length}`);
    }
    
    // Take a screenshot for visual reference
    await page.screenshot({ path: 'focused-strategy-diagnosis.png', fullPage: true });
    console.log('📸 Screenshot saved: focused-strategy-diagnosis.png');
    
    // Save diagnostic data
    const diagnosticData = {
      timestamp: new Date().toISOString(),
      currentUrl,
      consoleLogs: consoleLogs.slice(-20), // Last 20 logs
      networkErrors,
      redirectedToLogin: currentUrl.includes('/login'),
      summary: {
        totalConsoleLogs: consoleLogs.length,
        totalNetworkErrors: networkErrors.length,
        authenticationIssue: currentUrl.includes('/login')
      }
    };
    
    fs.writeFileSync('focused-strategy-diagnostic.json', JSON.stringify(diagnosticData, null, 2));
    console.log('📊 Diagnostic data saved: focused-strategy-diagnostic.json');
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await browser.close();
  }
}

runFocusedDiagnosis().catch(console.error);