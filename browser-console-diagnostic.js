const { chromium } = require('playwright');

async function diagnoseConsoleErrors() {
  console.log('🔍 Starting browser console diagnostic...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  // Capture network requests
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString()
    });
  });
  
  // Capture network responses
  const networkResponses = [];
  page.on('response', response => {
    networkResponses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      timestamp: new Date().toISOString()
    });
  });
  
  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    console.log('🌐 Navigating to application...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait a bit more to capture any delayed errors
    await page.waitForTimeout(5000);
    
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => {
      console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      if (msg.location) {
        console.log(`  Location: ${msg.location.url}:${msg.location.lineNumber}`);
      }
    });
    
    console.log('\n=== PAGE ERRORS ===');
    pageErrors.forEach(error => {
      console.log(`❌ ${error.message}`);
      console.log(`  Stack: ${error.stack}`);
      console.log(`  Time: ${error.timestamp}`);
    });
    
    console.log('\n=== FAILED NETWORK REQUESTS ===');
    networkResponses
      .filter(response => response.status >= 400)
      .forEach(response => {
        console.log(`❌ ${response.status} ${response.statusText} - ${response.url}`);
      });
    
    console.log('\n=== SUPABASE REQUESTS ===');
    networkResponses
      .filter(response => response.url.includes('supabase'))
      .forEach(response => {
        console.log(`${response.status} - ${response.url}`);
      });
    
    // Take a screenshot
    await page.screenshot({ path: 'console-diagnostic-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved as console-diagnostic-screenshot.png');
    
  } catch (error) {
    console.error('❌ Error during navigation:', error);
  } finally {
    await browser.close();
  }
  
  return {
    consoleMessages,
    pageErrors,
    networkResponses: networkResponses.filter(r => r.status >= 400)
  };
}

diagnoseConsoleErrors().then(results => {
  console.log('\n=== DIAGNOSTIC SUMMARY ===');
  console.log(`Console messages: ${results.consoleMessages.length}`);
  console.log(`Page errors: ${results.pageErrors.length}`);
  console.log(`Failed requests: ${results.networkResponses.length}`);
  
  if (results.pageErrors.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES FOUND:');
    results.pageErrors.forEach(error => {
      console.log(`- ${error.message}`);
    });
  }
  
  if (results.networkResponses.length > 0) {
    console.log('\n🌐 NETWORK ISSUES FOUND:');
    results.networkResponses.forEach(response => {
      console.log(`- ${response.status} ${response.url}`);
    });
  }
}).catch(error => {
  console.error('❌ Diagnostic failed:', error);
});