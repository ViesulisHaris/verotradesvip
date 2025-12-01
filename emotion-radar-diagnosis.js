const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Helper function to wait for a specified time (replaces deprecated waitForTimeout)
async function wait(page, milliseconds) {
  await new Promise(resolve => setTimeout(resolve, milliseconds));
}

// Function to handle authentication
async function login(page, username = 'testuser@verotrade.com', password = 'TestPassword123!') {
  console.log('🔐 Logging in...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  
  // Wait for the login form to load
  await page.waitForSelector('#email, input[type="email"], input[name="email"]', { timeout: 10000 });
  
  // Fill in the login credentials
  await page.type('#email, input[type="email"], input[name="email"]', username);
  await page.type('#password, input[type="password"], input[name="password"]', password);
  
  // Click the login button
  await page.click('button[type="submit"], #login-button, .login-button');
  
  // Wait for navigation after login
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
  
  // Check if login was successful by checking if we're no longer on the login page
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    console.log('✅ Login successful');
    return true;
  } else {
    console.log('❌ Login failed');
    return false;
  }
}

async function diagnoseEmotionRadar() {
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see the browser
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  // Capture console logs
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text: text,
      location: msg.location()
    });
    
    // Filter for our debug messages
    if (text.includes('🎯 [DASHBOARD] Emotional Patterns Debug:') ||
        text.includes('🔍 [CONFLUENCE EMOTION DEBUG] EmotionRadar Data Structure Check:') ||
        text.includes('🎨 [EMOTION RADAR COMPONENT] Data Type Check:') ||
        text.includes('🚨 [EMOTION RADAR COMPONENT] Filtering Results:')) {
      console.log(`[${msg.type().toUpperCase()}] ${text}`);
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log('Page Error:', error.message);
    consoleMessages.push({
      type: 'error',
      text: `Page Error: ${error.message}`,
      location: error.stack
    });
  });
  
  const results = {
    dashboard: {
      url: 'http://localhost:3000/dashboard',
      consoleLogs: [],
      screenshot: null,
      emotionDataFound: false,
      validationErrors: []
    },
    confluence: {
      url: 'http://localhost:3000/confluence',
      consoleLogs: [],
      screenshot: null,
      emotionDataFound: false,
      validationErrors: []
    }
  };
  
  try {
    // First, log in to the application
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.error('❌ Authentication failed. Cannot proceed with testing.');
      return;
    }
    
    console.log('🔍 Testing Dashboard page...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    await wait(page, 3000); // Wait for any dynamic content to load
    
    // Take screenshot
    results.dashboard.screenshot = 'dashboard-screenshot.png';
    await page.screenshot({ path: results.dashboard.screenshot, fullPage: true });
    
    // Filter dashboard console logs
    results.dashboard.consoleLogs = consoleMessages.filter(msg => 
      msg.text.includes('🎯 [DASHBOARD] Emotional Patterns Debug:') ||
      msg.text.includes('emotionData') ||
      msg.text.includes('validation') ||
      msg.type === 'error'
    );
    
    // Check for emotion data
    results.dashboard.emotionDataFound = consoleMessages.some(msg => 
      msg.text.includes('🎯 [DASHBOARD] Emotional Patterns Debug:') &&
      msg.text.includes('emotionData') &&
      !msg.text.includes('emotionData: []')
    );
    
    // Check for validation errors
    results.dashboard.validationErrors = consoleMessages.filter(msg => 
      msg.text.includes('validation') && msg.text.includes('error')
    );
    
    console.log('✅ Dashboard analysis complete');
    
    // Clear console messages for next page
    consoleMessages.length = 0;
    
    console.log('🔍 Testing Confluence page...');
    await page.goto('http://localhost:3000/confluence', { waitUntil: 'networkidle2' });
    await wait(page, 3000); // Wait for any dynamic content to load
    
    // Take screenshot
    results.confluence.screenshot = 'confluence-screenshot.png';
    await page.screenshot({ path: results.confluence.screenshot, fullPage: true });
    
    // Filter confluence console logs
    results.confluence.consoleLogs = consoleMessages.filter(msg => 
      msg.text.includes('🔍 [CONFLUENCE EMOTION DEBUG] EmotionRadar Data Structure Check:') ||
      msg.text.includes('emotionalTrendData') ||
      msg.text.includes('validation') ||
      msg.type === 'error'
    );
    
    // Check for emotion data
    results.confluence.emotionDataFound = consoleMessages.some(msg => 
      msg.text.includes('🔍 [CONFLUENCE EMOTION DEBUG] EmotionRadar Data Structure Check:') &&
      msg.text.includes('emotionalTrendData') &&
      !msg.text.includes('emotionalTrendData: []')
    );
    
    // Check for validation errors
    results.confluence.validationErrors = consoleMessages.filter(msg => 
      msg.text.includes('validation') && msg.text.includes('error')
    );
    
    console.log('✅ Confluence analysis complete');
    
    // Try to find and examine the EmotionRadar component directly
    console.log('🔍 Examining EmotionRadar component directly...');
    
    // Look for any EmotionRadar-related console messages
    const emotionRadarLogs = consoleMessages.filter(msg => 
      msg.text.includes('🎨 [EMOTION RADAR COMPONENT] Data Type Check:') ||
      msg.text.includes('🚨 [EMOTION RADAR COMPONENT] Filtering Results:') ||
      msg.text.includes('EmotionRadar')
    );
    
    if (emotionRadarLogs.length > 0) {
      console.log('Found EmotionRadar component logs:');
      emotionRadarLogs.forEach(log => console.log(`  [${log.type.toUpperCase()}] ${log.text}`));
    }
    
  } catch (error) {
    console.error('Error during diagnosis:', error);
  } finally {
    await browser.close();
  }
  
  // Generate diagnosis report
  const diagnosis = {
    timestamp: new Date().toISOString(),
    summary: {
      dashboardHasEmotionData: results.dashboard.emotionDataFound,
      confluenceHasEmotionData: results.confluence.emotionDataFound,
      hasValidationErrors: results.dashboard.validationErrors.length > 0 || results.confluence.validationErrors.length > 0,
      totalConsoleMessages: consoleMessages.length
    },
    details: results,
    allConsoleMessages: consoleMessages,
    diagnosis: ''
  };
  
  // Determine root cause
  if (!diagnosis.summary.dashboardHasEmotionData && !diagnosis.summary.confluenceHasEmotionData) {
    diagnosis.diagnosis = 'ROOT CAUSE: No emotional data is being loaded on either page. The issue appears to be in data fetching or data availability.';
  } else if (diagnosis.summary.hasValidationErrors) {
    diagnosis.diagnosis = 'ROOT CAUSE: Validation errors are preventing data from being displayed. Check the validation logic in the EmotionRadar component.';
  } else if (diagnosis.summary.dashboardHasEmotionData && !diagnosis.summary.confluenceHasEmotionData) {
    diagnosis.diagnosis = 'ROOT CAUSE: Data is available on dashboard but not on confluence page. The issue may be in the confluence page data fetching logic.';
  } else if (!diagnosis.summary.dashboardHasEmotionData && diagnosis.summary.confluenceHasEmotionData) {
    diagnosis.diagnosis = 'ROOT CAUSE: Data is available on confluence but not on dashboard. The issue may be in the dashboard page data fetching logic.';
  } else {
    diagnosis.diagnosis = 'ROOT CAUSE: Data is available on both pages but the EmotionRadar component is not rendering properly. The issue may be in the component rendering logic.';
  }
  
  // Save results
  const reportPath = 'emotion-radar-diagnosis-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(diagnosis, null, 2));
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 EMOTION RADAR DIAGNOSIS REPORT');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${diagnosis.timestamp}`);
  console.log(`\nSUMMARY:`);
  console.log(`  Dashboard has emotion data: ${diagnosis.summary.dashboardHasEmotionData}`);
  console.log(`  Confluence has emotion data: ${diagnosis.summary.confluenceHasEmotionData}`);
  console.log(`  Has validation errors: ${diagnosis.summary.hasValidationErrors}`);
  console.log(`  Total console messages: ${diagnosis.summary.totalConsoleMessages}`);
  console.log(`\nDIAGNOSIS: ${diagnosis.diagnosis}`);
  console.log(`\nScreenshots saved:`);
  console.log(`  - ${results.dashboard.screenshot}`);
  console.log(`  - ${results.confluence.screenshot}`);
  console.log(`\nFull report saved to: ${reportPath}`);
  console.log('='.repeat(80));
  
  return diagnosis;
}

// Run the diagnosis
diagnoseEmotionRadar().catch(console.error);