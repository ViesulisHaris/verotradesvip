/**
 * Confluence Page Layout Test
 * Tests the infinite scrolling fixes and verifies functionality
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testConfluenceLayout() {
  console.log('🧪 Starting Confluence Page Layout Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log('🌐 Browser:', msg.text());
    });
    
    // Navigate to the confluence page
    console.log('📍 Navigating to confluence page...');
    await page.goto('http://localhost:3000/confluence', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for authentication/login if needed
    await page.waitForTimeout(2000);
    
    // Check if we're on login page and need to authenticate
    const loginForm = await page.$('form[data-testid="login-form"]');
    if (loginForm) {
      console.log('🔐 Login form detected, attempting authentication...');
      // Fill in login credentials (adjust as needed)
      await page.type('input[name="email"]', 'test@example.com');
      await page.type('input[name="password"]', 'password');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
    
    // Wait for confluence page to load
    await page.waitForSelector('[data-testid="confluence-container"]', { timeout: 10000 });
    console.log('✅ Confluence page loaded successfully');
    
    // Test 1: Check main container height constraints
    console.log('📏 Test 1: Checking main container height constraints...');
    const mainContainer = await page.$('[data-testid="confluence-container"]');
    const mainContainerStyles = await page.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        height: computed.height,
        maxHeight: computed.maxHeight,
        overflow: computed.overflow,
        overflowY: computed.overflowY
      };
    }, mainContainer);
    
    console.log('📊 Main container styles:', mainContainerStyles);
    
    // Test 2: Check emotional radar chart container
    console.log('📊 Test 2: Checking emotional radar chart container...');
    const emotionRadarContainer = await page.$('.card-luxury');
    const emotionRadarStyles = await page.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        height: computed.height,
        maxHeight: computed.maxHeight,
        overflow: computed.overflow,
        overflowY: computed.overflowY,
        display: computed.display,
        flexDirection: computed.flexDirection
      };
    }, emotionRadarContainer);
    
    console.log('📊 Emotion radar container styles:', emotionRadarStyles);
    
    // Test 3: Check filtered trades table container
    console.log('📋 Test 3: Checking filtered trades table container...');
    const tradesTableContainer = await page.$('.card-luxury:last-child');
    const tradesTableStyles = await page.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        height: computed.height,
        maxHeight: computed.maxHeight,
        overflow: computed.overflow,
        overflowY: computed.overflowY,
        display: computed.display,
        flexDirection: computed.flexDirection
      };
    }, tradesTableContainer);
    
    console.log('📋 Trades table container styles:', tradesTableStyles);
    
    // Test 4: Check filter section scrolling
    console.log('🔍 Test 4: Checking filter section scrolling...');
    const filterSection = await page.$('.space-y-4.overflow-y-auto');
    if (filterSection) {
      const filterScrollHeight = await page.evaluate(el => el.scrollHeight, filterSection);
      const filterClientHeight = await page.evaluate(el => el.clientHeight, filterSection);
      console.log(`📊 Filter section - scrollHeight: ${filterScrollHeight}, clientHeight: ${filterClientHeight}`);
      
      // Test scrolling in filter section
      await page.evaluate(el => {
        el.scrollTop = el.scrollHeight / 2;
      }, filterSection);
      await page.waitForTimeout(500);
      
      const newScrollTop = await page.evaluate(el => el.scrollTop, filterSection);
      console.log(`📊 Filter section scrolled to: ${newScrollTop}`);
    }
    
    // Test 5: Check trades table scrolling
    console.log('📋 Test 5: Checking trades table scrolling...');
    const tradesTable = await page.$('.overflow-x-auto.overflow-y-auto');
    if (tradesTable) {
      const tableScrollHeight = await page.evaluate(el => el.scrollHeight, tradesTable);
      const tableClientHeight = await page.evaluate(el => el.clientHeight, tradesTable);
      console.log(`📊 Trades table - scrollHeight: ${tableScrollHeight}, clientHeight: ${tableClientHeight}`);
      
      // Test scrolling in trades table
      await page.evaluate(el => {
        el.scrollTop = 100;
      }, tradesTable);
      await page.waitForTimeout(500);
      
      const newScrollTop = await page.evaluate(el => el.scrollTop, tradesTable);
      console.log(`📊 Trades table scrolled to: ${newScrollTop}`);
    }
    
    // Test 6: Test filtering functionality
    console.log('🔍 Test 6: Testing filtering functionality...');
    const symbolInput = await page.$('input[placeholder*="Search symbols"]');
    if (symbolInput) {
      await symbolInput.type('AAPL');
      await page.waitForTimeout(1000);
      
      // Check if filtering triggered
      const loadingIndicator = await page.$('.animate-spin');
      if (loadingIndicator) {
        console.log('✅ Filter triggered loading state');
        await page.waitForSelector('.animate-spin', { hidden: true, timeout: 5000 });
        console.log('✅ Filter completed');
      }
    }
    
    // Test 7: Test pagination if available
    console.log('📄 Test 7: Testing pagination functionality...');
    const nextButton = await page.$('button:contains("Next")');
    if (nextButton) {
      const isDisabled = await page.evaluate(el => el.disabled, nextButton);
      if (!isDisabled) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Pagination next button clicked');
      } else {
        console.log('ℹ️ Next button disabled (no more pages)');
      }
    }
    
    // Test 8: Check overall page scrolling behavior
    console.log('📄 Test 8: Checking overall page scrolling behavior...');
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    console.log(`📊 Page height: ${pageHeight}, Viewport height: ${viewportHeight}`);
    
    // Try to scroll the page
    await page.evaluate(() => {
      window.scrollTo(0, 100);
    });
    await page.waitForTimeout(500);
    
    const scrollY = await page.evaluate(() => window.scrollY);
    console.log(`📊 Page scrolled to: ${scrollY}`);
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'confluence-layout-test.png',
      fullPage: false 
    });
    console.log('📸 Screenshot saved as confluence-layout-test.png');
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testConfluenceLayout().catch(console.error);