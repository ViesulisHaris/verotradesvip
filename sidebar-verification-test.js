const puppeteer = require('puppeteer');

async function testSidebarFunctionality() {
  console.log('🔍 Starting sidebar verification test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test 1: Navigate to trades page
    console.log('📍 Test 1: Navigating to /trades');
    await page.goto('http://localhost:3000/trades');
    await page.waitForSelector('aside', 5000);
    
    // Count sidebars on trades page
    const tradesSidebars = await page.$$eval('document.querySelectorAll("aside").length');
    console.log(`📊 Trades page sidebar count: ${tradesSidebars}`);
    
    // Test sidebar toggle functionality on trades
    const tradesToggleBtn = await page.$('button[aria-label*="sidebar"]');
    if (tradesToggleBtn) {
      console.log('🔄 Testing sidebar toggle on trades page...');
      await tradesToggleBtn.click();
      await page.waitForTimeout(1000);
      
      const tradesSidebarsAfterToggle = await page.$$eval('document.querySelectorAll("aside").length');
      console.log(`📊 Trades page sidebar count after toggle: ${tradesSidebarsAfterToggle}`);
    }
    
    // Test 2: Navigate to strategies page  
    console.log('📍 Test 2: Navigating to /strategies');
    await page.goto('http://localhost:3000/strategies');
    await page.waitForSelector('aside', 5000);
    
    // Count sidebars on strategies page
    const strategiesSidebars = await page.$$eval('document.querySelectorAll("aside").length');
    console.log(`📊 Strategies page sidebar count: ${strategiesSidebars}`);
    
    // Test sidebar toggle functionality on strategies
    const strategiesToggleBtn = await page.$('button[aria-label*="sidebar"]');
    if (strategiesToggleBtn) {
      console.log('🔄 Testing sidebar toggle on strategies page...');
      await strategiesToggleBtn.click();
      await page.waitForTimeout(1000);
      
      const strategiesSidebarsAfterToggle = await page.$$eval('document.querySelectorAll("aside").length');
      console.log(`📊 Strategies page sidebar count after toggle: ${strategiesSidebarsAfterToggle}`);
    }
    
    // Test 3: Navigate between pages multiple times
    console.log('📍 Test 3: Testing navigation between pages...');
    for (let i = 0; i < 5; i++) {
      console.log(`🔄 Navigation iteration ${i + 1}`);
      await page.goto(i % 2 === 0 ? '/trades' : '/strategies');
      await page.waitForSelector('aside', 3000);
      
      const sidebarCount = await page.$$eval('document.querySelectorAll("aside").length');
      console.log(`📊 Page ${i % 2 === 0 ? 'trades' : 'strategies'} sidebar count: ${sidebarCount}`);
      
      await page.waitForTimeout(500);
    }
    
    // Test 4: Check for console errors
    console.log('📍 Test 4: Checking for console errors...');
    page.on('console', (msg) => {
      console.log(`🖥️ Console: ${msg.type()}: ${msg.text()}`);
    });
    
    // Navigate to each page once more to check for errors
    await page.goto('/trades');
    await page.waitForTimeout(2000);
    await page.goto('/strategies');
    await page.waitForTimeout(2000);
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testSidebarFunctionality();