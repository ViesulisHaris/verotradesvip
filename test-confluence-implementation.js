const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(category, message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${category}]`;
  
  switch(type) {
    case 'success':
      console.log(`✅ ${prefix} ${message}`);
      break;
    case 'error':
      console.log(`❌ ${prefix} ${message}`);
      break;
    case 'warning':
      console.log(`⚠️ ${prefix} ${message}`);
      break;
    default:
      console.log(`ℹ️ ${prefix} ${message}`);
  }
}

async function takeScreenshot(page, filename, category = 'TEST') {
  try {
    const screenshotPath = path.join(__dirname, `${category.toLowerCase()}-${filename}-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log(category, `Screenshot saved: ${filename}`);
    return screenshotPath;
  } catch (error) {
    log(category, `Failed to take screenshot: ${error.message}`, 'error');
  }
}

async function testAPIEndpoints() {
  log('API_TEST', 'Testing API endpoints directly...', 'info');
  
  // Test 1: Test confluence-stats endpoint without auth
  try {
    const response = await fetch(`${BASE_URL}/api/confluence-stats`);
    const data = await response.json();
    
    log('API_TEST', `confluence-stats without auth - Status: ${response.status}`, response.ok ? 'success' : 'error');
    if (!response.ok) {
      log('API_TEST', `Error: ${data.error || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    log('API_TEST', `confluence-stats request failed: ${error.message}`, 'error');
  }
  
  // Test 2: Test confluence-trades endpoint without auth
  try {
    const response = await fetch(`${BASE_URL}/api/confluence-trades?page=1&limit=10`);
    const data = await response.json();
    
    log('API_TEST', `confluence-trades without auth - Status: ${response.status}`, response.ok ? 'success' : 'error');
    if (!response.ok) {
      log('API_TEST', `Error: ${data.error || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    log('API_TEST', `confluence-trades request failed: ${error.message}`, 'error');
  }
}

async function testConfluencePageWithAuth() {
  log('CONFLUENCE_TEST', 'Testing confluence page with authentication...', 'info');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[CONFLUENCE_DEBUG]') || text.includes('[CONFLUENCE_STATS]') || text.includes('[CONFLUENCE_TRADES]')) {
        log('PAGE_CONSOLE', text, 'info');
      }
    });
    
    // Enable request/response logging
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/confluence-')) {
        log('NETWORK', `Request: ${request.method()} ${url}`, 'info');
        
        // Log headers for confluence API calls
        const headers = request.headers();
        const authHeader = headers['authorization'] || headers['Authorization'];
        if (authHeader) {
          log('NETWORK', `Auth header present: ${authHeader.substring(0, 20)}...`, 'success');
        } else {
          log('NETWORK', `No auth header found in request to ${url}`, 'error');
        }
      }
    });
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/confluence-')) {
        log('NETWORK', `Response: ${response.status()} ${url}`, response.ok() ? 'success' : 'error');
      }
    });
    
    // Step 1: Navigate to login page first
    log('CONFLUENCE_TEST', 'Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    await takeScreenshot(page, 'login-page', 'CONFLUENCE_TEST');
    
    // Step 2: Check if user is already logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      log('CONFLUENCE_TEST', 'User appears to be already logged in, proceeding to confluence page');
    } else {
      log('CONFLUENCE_TEST', 'User needs to log in - checking login form availability');
      
      // Check if login form is present
      const loginForm = await page.$('form');
      if (!loginForm) {
        log('CONFLUENCE_TEST', 'Login form not found, checking if already authenticated', 'warning');
        
        // Try navigating directly to dashboard to check auth status
        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
        await sleep(2000);
        
        const dashboardUrl = page.url();
        if (dashboardUrl.includes('/dashboard')) {
          log('CONFLUENCE_TEST', 'User is authenticated, proceeding to confluence page', 'success');
        } else {
          log('CONFLUENCE_TEST', 'User is not authenticated, test cannot proceed', 'error');
          await browser.close();
          return;
        }
      } else {
        log('CONFLUENCE_TEST', 'Login form found but manual login not supported in this test', 'warning');
        log('CONFLUENCE_TEST', 'Please ensure you are logged in before running this test', 'warning');
        await browser.close();
        return;
      }
    }
    
    // Step 3: Navigate to confluence page
    log('CONFLUENCE_TEST', 'Navigating to confluence page...');
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(5000); // Allow time for API calls
    await takeScreenshot(page, 'confluence-page-loaded', 'CONFLUENCE_TEST');
    
    // Step 4: Check for authentication errors on the page
    const errorElements = await page.$$('.text-red-400, .border-red-500, [data-testid="error"]');
    if (errorElements.length > 0) {
      log('CONFLUENCE_TEST', `Found ${errorElements.length} error elements on page`, 'error');
      
      for (let i = 0; i < Math.min(errorElements.length, 3); i++) {
        const errorText = await errorElements[i].evaluate(el => el.textContent);
        log('CONFLUENCE_TEST', `Error ${i + 1}: ${errorText}`, 'error');
      }
    } else {
      log('CONFLUENCE_TEST', 'No error elements found on page', 'success');
    }
    
    // Step 5: Check for loading states
    const loadingElements = await page.$$('.animate-spin');
    if (loadingElements.length > 0) {
      log('CONFLUENCE_TEST', `Found ${loadingElements.length} loading elements`, 'warning');
    } else {
      log('CONFLUENCE_TEST', 'No loading elements found', 'success');
    }
    
    // Step 6: Check for data display
    const statsCards = await page.$$('[data-testid="confluence-card"]');
    log('CONFLUENCE_TEST', `Found ${statsCards.length} statistics cards`, statsCards.length > 0 ? 'success' : 'error');
    
    const tradesTable = await page.$('table');
    log('CONFLUENCE_TEST', `Trades table found: ${!!tradesTable}`, tradesTable ? 'success' : 'error');
    
    const emotionRadar = await page.$('canvas, svg');
    log('CONFLUENCE_TEST', `Emotion radar chart found: ${!!emotionRadar}`, emotionRadar ? 'success' : 'error');
    
    // Step 7: Wait for any additional API calls
    log('CONFLUENCE_TEST', 'Waiting for additional API calls...');
    await sleep(3000);
    
    // Step 8: Test refresh functionality
    const refreshButton = await page.$('button:has-text("Refresh")');
    if (refreshButton) {
      log('CONFLUENCE_TEST', 'Testing refresh functionality...');
      await refreshButton.click();
      await sleep(3000);
      await takeScreenshot(page, 'confluence-after-refresh', 'CONFLUENCE_TEST');
      log('CONFLUENCE_TEST', 'Refresh functionality tested', 'success');
    } else {
      log('CONFLUENCE_TEST', 'Refresh button not found', 'error');
    }
    
    await browser.close();
    
  } catch (error) {
    log('CONFLUENCE_TEST', `Test failed: ${error.message}`, 'error');
    await browser.close();
  }
}

async function main() {
  log('MAIN', 'Starting comprehensive confluence implementation test...', 'info');
  
  // Test 1: Direct API endpoint testing
  await testAPIEndpoints();
  
  // Test 2: Full page testing with authentication
  await testConfluencePageWithAuth();
  
  log('MAIN', 'Confluence implementation test completed', 'success');
}

// Run the test
main().catch(error => {
  log('MAIN', `Test suite failed: ${error.message}`, 'error');
  process.exit(1);
});