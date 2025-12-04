const puppeteer = require('puppeteer');
const fs = require('fs');

async function debugTradesPage() {
  console.log('🔍 Starting Trades Page Debugging...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console errors and logs
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text, timestamp: new Date().toISOString() });
    
    if (type === 'error') {
      console.log(`🚨 Console Error: ${text}`);
    } else if (type === 'warning') {
      console.log(`⚠️ Console Warning: ${text}`);
    } else if (text.includes('[DEBUG]') || text.includes('[OPTIMIZED_QUERIES_DEBUG]')) {
      console.log(`🐛 Debug: ${text}`);
    }
  });
  
  // Capture network requests
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('/rest/v1/')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/rest/v1/')) {
      networkRequests.find(req => req.url === response.url()).status = response.status();
      networkRequests.find(req => req.url === response.url()).statusText = response.statusText();
    }
  });
  
  try {
    console.log('🌐 Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    console.log('📊 Checking for statistics cards...');
    const statisticsExists = await page.$('.key-metrics-grid') !== null;
    console.log(`Statistics cards found: ${statisticsExists}`);
    
    console.log('📋 Checking for trades list...');
    const tradesListExists = await page.$('.dashboard-card.overflow-hidden') !== null;
    console.log(`Trades list found: ${tradesListExists}`);
    
    console.log('🔍 Checking for "no trades yet" message...');
    const noTradesMessage = await page.$eval('body', el => 
      el.innerText.includes('No trades yet') || el.innerText.includes('no trades yet')
    );
    console.log(`"No trades yet" message found: ${noTradesMessage}`);
    
    // Check if user is authenticated
    console.log('🔐 Checking authentication status...');
    const isAuthenticated = await page.evaluate(() => {
      return window.localStorage.getItem('supabase.auth.token') !== null;
    });
    console.log(`User authenticated: ${isAuthenticated}`);
    
    // Check current page URL and any redirects
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Take screenshot for visual verification
    const screenshot = await page.screenshot({ 
      path: 'trades-page-debug-screenshot.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as trades-page-debug-screenshot.png');
    
    // Wait a bit more to catch any delayed console errors
    await page.waitForTimeout(5000);
    
    // Analyze the data
    console.log('\n📈 ANALYSIS RESULTS:');
    console.log('==================');
    console.log(`1. Statistics Display: ${statisticsExists ? '✅ Working' : '❌ Not Found'}`);
    console.log(`2. Trades List Display: ${tradesListExists ? '✅ Working' : '❌ Not Found'}`);
    console.log(`3. "No Trades" Message: ${noTradesMessage ? '✅ Found' : '❌ Not Found'}`);
    console.log(`4. Authentication: ${isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}`);
    console.log(`5. Current URL: ${currentUrl}`);
    
    // Console errors summary
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    const warnings = consoleMessages.filter(msg => msg.type === 'warning');
    
    console.log(`\n🚨 Console Errors (${errors.length}):`);
    errors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.text}`);
    });
    
    console.log(`\n⚠️ Console Warnings (${warnings.length}):`);
    warnings.forEach((warning, i) => {
      console.log(`${i + 1}. ${warning.text}`);
    });
    
    // Network requests analysis
    console.log(`\n🌐 Network Requests (${networkRequests.length}):`);
    networkRequests.forEach((req, i) => {
      console.log(`${i + 1}. ${req.method} ${req.url} - Status: ${req.status || 'Pending'}`);
    });
    
    // Check for specific data fetching patterns
    const debugMessages = consoleMessages.filter(msg => 
      msg.text.includes('[DEBUG]') || 
      msg.text.includes('[OPTIMIZED_QUERIES_DEBUG]') ||
      msg.text.includes('fetchTrades') ||
      msg.text.includes('fetchStatistics')
    );
    
    console.log(`\n🐛 Debug Messages (${debugMessages.length}):`);
    debugMessages.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
    });
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      url: currentUrl,
      statisticsExists,
      tradesListExists,
      noTradesMessage,
      isAuthenticated,
      consoleMessages,
      networkRequests,
      analysis: {
        statisticsWorking: statisticsExists,
        tradesListWorking: tradesListExists,
        showingNoTradesMessage: noTradesMessage,
        authenticated: isAuthenticated,
        potentialIssues: []
      }
    };
    
    // Identify potential issues
    if (!statisticsExists && !tradesListExists) {
      report.analysis.potentialIssues.push('Neither statistics nor trades list are loading - possible authentication or data fetching issue');
    } else if (statisticsExists && !tradesListExists && noTradesMessage) {
      report.analysis.potentialIssues.push('Statistics are working but trades list shows "no trades" - possible data filtering or pagination issue');
    } else if (statisticsExists && !tradesListExists && !noTradesMessage) {
      report.analysis.potentialIssues.push('Statistics working but trades list not displaying - possible rendering or component issue');
    }
    
    if (!isAuthenticated) {
      report.analysis.potentialIssues.push('User not authenticated - this could cause data loading issues');
    }
    
    if (errors.length > 0) {
      report.analysis.potentialIssues.push(`${errors.length} console errors detected`);
    }
    
    fs.writeFileSync('trades-page-debug-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved as trades-page-debug-report.json');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

debugTradesPage();