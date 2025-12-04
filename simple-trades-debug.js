const puppeteer = require('puppeteer');
const fs = require('fs');

async function simpleTradesDebug() {
  console.log('🔍 Starting Simple Trades Page Debugging...');
  
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
    } else if (text.includes('AUTH_DEBUG') || text.includes('OPTIMIZED_QUERIES_DEBUG')) {
      console.log(`🐛 Debug: ${text}`);
    }
  });
  
  try {
    console.log('🌐 Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check page content
    const pageContent = await page.content();
    
    // Check for specific elements
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
    
    // Get current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Check for authentication redirects
    if (currentUrl.includes('/login')) {
      console.log('⚠️ Redirected to login page - authentication issue');
    }
    
    // Analyze console messages
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    const authMessages = consoleMessages.filter(msg => msg.text.includes('AUTH_DEBUG'));
    const queryMessages = consoleMessages.filter(msg => msg.text.includes('OPTIMIZED_QUERIES_DEBUG'));
    
    console.log(`\n🚨 Console Errors (${errors.length}):`);
    errors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.text}`);
    });
    
    console.log(`\n🔐 Auth Debug Messages (${authMessages.length}):`);
    authMessages.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg.text}`);
    });
    
    console.log(`\n📊 Query Debug Messages (${queryMessages.length}):`);
    queryMessages.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg.text}`);
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'trades-debug-screenshot.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as trades-debug-screenshot.png');
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      url: currentUrl,
      hasStatistics,
      hasTradesList,
      hasNoTradesMessage,
      isAuthenticated,
      consoleMessages,
      analysis: {
        potentialIssues: []
      }
    };
    
    // Identify issues
    if (!isAuthenticated) {
      report.analysis.potentialIssues.push('User not authenticated - data fetching will fail');
    }
    
    if (hasStatistics && !hasTradesList && hasNoTradesMessage) {
      report.analysis.potentialIssues.push('Statistics working but trades list empty - possible data filtering issue');
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
    
    fs.writeFileSync('trades-debug-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Report saved as trades-debug-report.json');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

simpleTradesDebug();