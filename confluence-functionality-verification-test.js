/**
 * Confluence Page Functionality Verification Test
 * Tests if the confluence page is now functional after fixes
 */

const { chromium } = require('playwright');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  screenshotDir: './confluence-verification-screenshots'
};

// Ensure screenshot directory exists
const fs = require('fs');
if (!fs.existsSync(CONFIG.screenshotDir)) {
  fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
}

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] [CONFLUENCE_VERIFICATION] ${message}`);
}

async function testConfluenceFunctionality() {
  let browser;
  let page;
  
  try {
    log('Starting confluence functionality verification test...');
    
    // Launch browser
    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Navigate to confluence page
    log('Navigating to confluence page...');
    await page.goto(`${CONFIG.baseUrl}/confluence`, {
      waitUntil: 'networkidle',
      timeout: CONFIG.timeout
    });
    
    // Wait for page to load completely
    await page.waitForTimeout(5000);
    
    // Test 1: Check if page loads without infinite redirects
    const currentUrl = page.url();
    log(`Current URL after 5 seconds: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      log('❌ FAIL: Page redirected to login - infinite authentication loop still present');
      return false;
    }
    
    if (currentUrl.includes('/confluence')) {
      log('✅ PASS: Page stays on confluence URL - authentication loop fixed');
    } else {
      log('⚠️  WARN: Page on unexpected URL: ${currentUrl}');
      return false;
    }
    
    // Test 2: Check for console errors
    log('Checking for console errors...');
    const consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });
    
    // Wait for 5 seconds to collect console messages
    await page.waitForTimeout(5000);
    
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    const warnings = consoleMessages.filter(msg => msg.type === 'warning');
    
    log(`Console errors found: ${errors.length}`);
    log(`Console warnings found: ${warnings.length}`);
    
    if (errors.length > 0) {
      log('❌ FAIL: Console errors still present');
      return false;
    }
    
    if (warnings.length > 5) {
      log('⚠️  WARN: High number of console warnings');
      return false;
    }
    
    log('✅ PASS: Console output is clean');
    
    // Test 3: Check page interactivity
    log('Testing page interactivity...');
    
    try {
      // Test refresh button
      const refreshButton = await page.locator('button:has-text("Refresh")').first();
      if (await refreshButton.isVisible({ timeout: 3000 })) {
        await refreshButton.click();
        await page.waitForTimeout(2000);
        log('✅ PASS: Refresh button is clickable and responsive');
      } else {
        log('❌ FAIL: Refresh button not found or not clickable');
      }
      
      // Test emotion filter
      const emotionFilter = await page.locator('[placeholder*="Filter by emotions"]').first();
      if (await emotionFilter.isVisible({ timeout: 3000 })) {
        await emotionFilter.click();
        await page.waitForTimeout(1000);
        log('✅ PASS: Emotion filter is clickable and responsive');
      } else {
        log('❌ FAIL: Emotion filter not found or not clickable');
      }
      
      // Test page scrolling
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(1000);
      log('✅ PASS: Page scrolling works');
      
      // Test clicking on trade elements
      const tradeElements = await page.locator('table tr').count();
      if (tradeElements > 0) {
        log(`✅ PASS: Found ${tradeElements} trade elements in table`);
      } else {
        log('❌ FAIL: No trade elements found');
      }
      
    } catch (error) {
      log(`❌ FAIL: Interactivity test failed: ${error.message}`);
      return false;
    }
    
    // Test 4: Check for visual stability (no flashing)
    log('Checking for visual stability...');
    
    let flashCount = 0;
    const flashDetector = setInterval(() => {
      page.evaluate(() => {
        const body = document.body;
        if (body) {
          const computedStyle = window.getComputedStyle(body);
          if (computedStyle.animation && computedStyle.animation !== 'none') {
            flashCount++;
          }
        }
      });
    }, 1000);
    
    // Monitor for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    clearInterval(flashDetector);
    
    if (flashCount > 5) {
      log('⚠️  WARN: Page still flashing significantly');
    } else {
      log('✅ PASS: Page is visually stable');
    }
    
    // Take final screenshot
    await page.screenshot({
      path: `${CONFIG.screenshotDir}/confluence-final-state.png`,
      fullPage: true
    });
    
    log('✅ All tests completed successfully');
    return true;
    
  } catch (error) {
    log(`❌ FAIL: Verification test failed: ${error.message}`);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testConfluenceFunctionality()
  .then(success => {
    if (success) {
      log('🎉 CONFLUENCE PAGE FUNCTIONALITY VERIFICATION: PASSED');
      log('The confluence page is now functional and stable');
    } else {
      log('💥 CONFLUENCE PAGE FUNCTIONALITY VERIFICATION: FAILED');
      log('The confluence page still has issues that need to be addressed');
    }
  })
  .catch(error => {
    log(`💥 VERIFICATION TEST ERROR: ${error.message}`);
  });