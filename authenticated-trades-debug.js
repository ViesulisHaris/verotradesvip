const puppeteer = require('puppeteer');
const fs = require('fs');

async function authenticatedTradesDebug() {
  console.log('🔍 Starting Authenticated Trades Page Debugging...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text, timestamp: new Date().toISOString() });
    
    if (type === 'error') {
      console.log(`🚨 Error: ${text}`);
    } else if (text.includes('TRADES_PAGE_DEBUG') || text.includes('OPTIMIZED_QUERIES_DEBUG')) {
      console.log(`🐛 Debug: ${text}`);
    }
  });
  
  try {
    console.log('🌐 Navigating to login page...');
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in login credentials (you'll need to replace with actual credentials)
    console.log('📝 Filling login form...');
    await page.type('input[type="email"]', 'testuser1000@verotrade.com'); // Replace with actual email
    await page.type('input[type="password"]', 'TestPassword123!'); // Replace with actual password
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for login to complete and redirect
    console.log('⏳ Waiting for login to complete...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    // Check if login was successful
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('❌ Login failed - still on login page');
      console.log('💡 Please update the login credentials in the script');
      await browser.close();
      return;
    }
    
    console.log('✅ Login successful - navigating to trades page...');
    
    // Navigate to trades page
    await page.goto('http://localhost:3000/trades', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to fully load and for debug messages
    console.log('⏳ Waiting for trades page to load...');
    await new Promise(resolve => setTimeout(resolve, 8000)); // Wait longer for debug messages
    
    // Check page content
    const hasStatistics = await page.evaluate(() => {
      const statsElement = document.querySelector('.key-metrics-grid');
      return statsElement !== null;
    });
    
    const hasTradesList = await page.evaluate(() => {
      const tradesElement = document.querySelector('.dashboard-card.overflow-hidden');
      return tradesElement !== null;
    });
    
    const hasNoTradesMessage = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return bodyText.includes('No trades yet') || bodyText.includes('no trades yet');
    });
    
    const isAuthenticated = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token') !== null;
    });
    
    console.log('\n📊 PAGE ANALYSIS:');
    console.log('==================');
    console.log(`Statistics Cards: ${hasStatistics ? '✅ Found' : '❌ Not Found'}`);
    console.log(`Trades List: ${hasTradesList ? '✅ Found' : '❌ Not Found'}`);
    console.log(`"No Trades" Message: ${hasNoTradesMessage ? '✅ Found' : '❌ Not Found'}`);
    console.log(`User Authenticated: ${isAuthenticated ? '✅ Yes' : '❌ No'}`);
    console.log(`Current URL: ${page.url()}`);
    
    // Analyze console messages
    const tradesDebugMessages = consoleMessages.filter(msg => msg.text.includes('TRADES_PAGE_DEBUG'));
    const queryDebugMessages = consoleMessages.filter(msg => msg.text.includes('OPTIMIZED_QUERIES_DEBUG'));
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    
    console.log(`\n🐛 Trades Page Debug Messages (${tradesDebugMessages.length}):`);
    tradesDebugMessages.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
    });
    
    console.log(`\n📊 Query Debug Messages (${queryDebugMessages.length}):`);
    queryDebugMessages.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
    });
    
    console.log(`\n🚨 Console Errors (${errors.length}):`);
    errors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.text}`);
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'authenticated-trades-debug-screenshot.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as authenticated-trades-debug-screenshot.png');
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      hasStatistics,
      hasTradesList,
      hasNoTradesMessage,
      isAuthenticated,
      consoleMessages,
      analysis: {
        statisticsWorking: hasStatistics,
        tradesListWorking: hasTradesList,
        showingNoTradesMessage: hasNoTradesMessage,
        authenticated: isAuthenticated,
        potentialIssues: []
      }
    };
    
    // Identify issues
    if (hasStatistics && !hasTradesList && hasNoTradesMessage) {
      report.analysis.potentialIssues.push('Statistics working but trades list empty - possible data fetching or filtering issue');
    }
    
    if (hasStatistics && !hasTradesList && !hasNoTradesMessage) {
      report.analysis.potentialIssues.push('Statistics working but trades list not rendering - possible component issue');
    }
    
    if (!hasStatistics && !hasTradesList) {
      report.analysis.potentialIssues.push('Neither statistics nor trades loading - possible authentication or API issue');
    }
    
    if (errors.length > 0) {
      report.analysis.potentialIssues.push(`${errors.length} console errors detected`);
    }
    
    // Check for specific patterns in debug messages
    const tradesFetchResults = tradesDebugMessages.filter(msg => msg.text.includes('Trades fetch result:'));
    const statsFetchResults = tradesDebugMessages.filter(msg => msg.text.includes('Statistics fetch result:'));
    
    if (tradesFetchResults.length > 0) {
      const lastTradeResult = tradesFetchResults[tradesFetchResults.length - 1].text;
      console.log(`\n📋 Last trades fetch result: ${lastTradeResult}`);
    }
    
    if (statsFetchResults.length > 0) {
      const lastStatsResult = statsFetchResults[statsFetchResults.length - 1].text;
      console.log(`\n📊 Last statistics fetch result: ${lastStatsResult}`);
    }
    
    fs.writeFileSync('authenticated-trades-debug-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved as authenticated-trades-debug-report.json');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

console.log('💡 Note: Please update the login credentials in the script before running');
console.log('   - Email: test@example.com (line 32)');
console.log('   - Password: password123 (line 33)');
console.log('');

authenticatedTradesDebug();