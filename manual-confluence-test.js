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

async function takeScreenshot(page, filename, category = 'MANUAL_TEST') {
  try {
    const screenshotPath = path.join(__dirname, `${category.toLowerCase()}-${filename}-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log(category, `Screenshot saved: ${filename}`);
    return screenshotPath;
  } catch (error) {
    log(category, `Failed to take screenshot: ${error.message}`, 'error');
  }
}

async function manualConfluenceTest() {
  log('MANUAL_TEST', 'Starting manual confluence test with real login...', 'info');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable comprehensive logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[CONFLUENCE') || text.includes('[AUTH') || text.includes('[API]')) {
        log('PAGE_CONSOLE', text, 'info');
      }
    });
    
    // Enable request/response logging for confluence APIs
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/confluence-')) {
        log('NETWORK_REQUEST', `Request: ${request.method()} ${url}`, 'info');
        
        const headers = request.headers();
        const authHeader = headers['authorization'] || headers['Authorization'];
        if (authHeader) {
          log('NETWORK_REQUEST', `✅ Auth header found: ${authHeader.substring(0, 30)}...`, 'success');
        } else {
          log('NETWORK_REQUEST', `❌ NO auth header found in request`, 'error');
        }
      }
    });
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/confluence-')) {
        log('NETWORK_RESPONSE', `Response: ${response.status()} ${url}`, response.ok() ? 'success' : 'error');
        
        // Log response body for debugging
        response.text().then(body => {
          try {
            const data = JSON.parse(body);
            if (data.error) {
              log('NETWORK_RESPONSE', `Error response: ${data.error}`, 'error');
            }
          } catch (e) {
            log('NETWORK_RESPONSE', `Response body: ${body.substring(0, 200)}...`, 'info');
          }
        }).catch(err => {
          log('NETWORK_RESPONSE', `Failed to read response body: ${err.message}`, 'error');
        });
      }
    });
    
    // Step 1: Navigate to home page first
    log('MANUAL_TEST', 'Navigating to home page...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await sleep(3000);
    await takeScreenshot(page, 'home-page', 'MANUAL_TEST');
    
    // Step 2: Check if already logged in or need to login
    const currentUrl = page.url();
    log('MANUAL_TEST', `Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/confluence')) {
      log('MANUAL_TEST', 'User appears to be already logged in', 'success');
    } else {
      log('MANUAL_TEST', 'User needs to log in - please log in manually', 'warning');
      log('MANUAL_TEST', 'I will wait for you to log in...', 'info');
      
      // Wait for manual login
      let loginAttempts = 0;
      let isLoggedIn = false;
      
      while (loginAttempts < 60 && !isLoggedIn) { // Wait up to 2 minutes
        await sleep(2000);
        loginAttempts++;
        
        const currentUrl = page.url();
        if (currentUrl.includes('/dashboard') || currentUrl.includes('/confluence')) {
          isLoggedIn = true;
          log('MANUAL_TEST', '✅ User successfully logged in!', 'success');
        }
        
        if (loginAttempts % 10 === 0) {
          log('MANUAL_TEST', `Still waiting for login... (${loginAttempts * 2}s elapsed)`, 'info');
        }
      }
      
      if (!isLoggedIn) {
        log('MANUAL_TEST', '❌ Login timeout - proceeding without authentication', 'error');
        await browser.close();
        return;
      }
    }
    
    // Step 3: Navigate to confluence page
    log('MANUAL_TEST', 'Navigating to confluence page...');
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(5000); // Allow time for page to load and API calls
    await takeScreenshot(page, 'confluence-page-loaded', 'MANUAL_TEST');
    
    // Step 4: Analyze page content
    log('MANUAL_TEST', 'Analyzing confluence page content...', 'info');
    
    // Check for error messages
    const errorElements = await page.$$('.text-red-400, .border-red-500, [data-testid="error"]');
    if (errorElements.length > 0) {
      log('MANUAL_TEST', `Found ${errorElements.length} error elements`, 'error');
      for (let i = 0; i < Math.min(errorElements.length, 3); i++) {
        const errorText = await errorElements[i].evaluate(el => el.textContent);
        log('MANUAL_TEST', `Error ${i + 1}: ${errorText}`, 'error');
      }
    } else {
      log('MANUAL_TEST', 'No error elements found on page', 'success');
    }
    
    // Check for loading states
    const loadingElements = await page.$$('.animate-spin');
    if (loadingElements.length > 0) {
      log('MANUAL_TEST', `Found ${loadingElements.length} loading elements`, 'warning');
    } else {
      log('MANUAL_TEST', 'No persistent loading elements found', 'success');
    }
    
    // Check for data display
    const statsCards = await page.$$('[data-testid="confluence-card"]');
    log('MANUAL_TEST', `Statistics cards found: ${statsCards.length}`, statsCards.length > 0 ? 'success' : 'error');
    
    const tradesTable = await page.$('table');
    log('MANUAL_TEST', `Trades table found: ${!!tradesTable}`, tradesTable ? 'success' : 'error');
    
    const emotionRadar = await page.$('canvas, svg');
    log('MANUAL_TEST', `Emotion radar chart found: ${!!emotionRadar}`, emotionRadar ? 'success' : 'error');
    
    // Check for filter controls
    const filterButtons = await page.$$('button:has-text("FOMO"), button:has-text("REVENGE"), button:has-text("TILT")');
    log('MANUAL_TEST', `Emotion filter buttons found: ${filterButtons.length}`, filterButtons.length > 0 ? 'success' : 'error');
    
    // Check for refresh button
    const refreshButton = await page.$('button:has-text("Refresh")');
    log('MANUAL_TEST', `Refresh button found: ${!!refreshButton}`, refreshButton ? 'success' : 'error');
    
    // Step 5: Test refresh functionality
    if (refreshButton) {
      log('MANUAL_TEST', 'Testing refresh functionality...');
      await refreshButton.click();
      await sleep(3000);
      await takeScreenshot(page, 'confluence-after-refresh', 'MANUAL_TEST');
      log('MANUAL_TEST', 'Refresh functionality tested', 'success');
    }
    
    // Step 6: Test emotion filter functionality
    if (filterButtons.length > 0) {
      log('MANUAL_TEST', 'Testing emotion filter functionality...');
      
      // Click first emotion filter
      await filterButtons[0].click();
      await sleep(2000);
      await takeScreenshot(page, 'confluence-with-filter', 'MANUAL_TEST');
      
      // Check if filter is applied
      const activeFilters = await page.$$('button[class*="bg-dusty-gold"]');
      log('MANUAL_TEST', `Active filters found: ${activeFilters.length}`, activeFilters.length > 0 ? 'success' : 'error');
      
      // Clear filters
      const clearButton = await page.$('button:has-text("Clear All")');
      if (clearButton) {
        await clearButton.click();
        await sleep(2000);
        await takeScreenshot(page, 'confluence-filters-cleared', 'MANUAL_TEST');
        log('MANUAL_TEST', 'Filter clearing tested', 'success');
      }
    }
    
    // Step 7: Wait for any additional API calls
    log('MANUAL_TEST', 'Monitoring for additional API calls...');
    await sleep(5000);
    
    await browser.close();
    
  } catch (error) {
    log('MANUAL_TEST', `Test failed: ${error.message}`, 'error');
    await browser.close();
  }
}

async function main() {
  log('MAIN', 'Starting manual confluence test...', 'info');
  log('MAIN', 'Please log in to the application when prompted', 'warning');
  log('MAIN', 'The test will wait for you to complete login', 'info');
  
  await manualConfluenceTest();
  
  log('MAIN', 'Manual confluence test completed', 'success');
}

// Run test
main().catch(error => {
  log('MAIN', `Test suite failed: ${error.message}`, 'error');
  process.exit(1);
});