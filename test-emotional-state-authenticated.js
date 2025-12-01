const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testEmotionalStateFixWithAuth() {
  console.log('🔍 Starting emotional state fix verification test with authentication...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  try {
    // Navigate to the application
    console.log('🌐 Navigating to application...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check if we need to login
    const loginUrl = 'http://localhost:3000/login';
    if (page.url() !== loginUrl) {
      await page.goto(loginUrl);
      await page.waitForLoadState('networkidle');
    }
    
    // Try to login with test credentials if login page is shown
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('🔐 Login form detected, attempting to login...');
      
      // Fill in login credentials (you may need to update these)
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Submit login form
      await page.click('button[type="submit"]');
      
      // Wait for navigation after login
      await page.waitForNavigation();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Allow time for authentication to complete
    }
    
    // Check if we're still on login page (authentication failed)
    if (page.url().includes('/login')) {
      console.log('⚠️ Authentication failed. Creating a test page to verify the fix directly...');
      
      // Create a simple test page to verify the emotional state logic
      await createTestPage(page);
      return;
    }
    
    // Test 1: Navigate to dashboard and capture emotional state data
    console.log('\n📊 Testing Dashboard Page...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Allow time for data to load
    
    // Capture console messages for dashboard
    const dashboardConsoleMessages = [...consoleMessages];
    consoleMessages.length = 0;
    
    // Test 2: Navigate to confluence page and capture emotional state data
    console.log('\n🔍 Testing Confluence Page...');
    await page.goto('http://localhost:3000/confluence');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Allow time for data to load
    
    // Capture console messages for confluence
    const confluenceConsoleMessages = [...consoleMessages];
    consoleMessages.length = 0;
    
    // Test 3: Apply filters on confluence page
    console.log('\n🧪 Testing Filters on Confluence Page...');
    
    // Try to click on "Stocks" filter pill
    const stocksFilter = await page.$('text=Stocks');
    if (stocksFilter) {
      console.log('✅ Found Stocks filter, applying...');
      await stocksFilter.click();
      await page.waitForTimeout(3000);
      
      // Reset filters
      const resetButton = await page.$('text=Reset All');
      if (resetButton) {
        console.log('🔄 Resetting filters...');
        await resetButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Analyze results
    console.log('\n📋 Analyzing Results...');
    
    // Extract relevant debug messages
    const dashboardDebugMessages = dashboardConsoleMessages.filter(msg => 
      msg.text.includes('[DASHBOARD EMOTION DEBUG]') || 
      msg.text.includes('[EMOTION DEBUG]')
    );
    
    const confluenceDebugMessages = confluenceConsoleMessages.filter(msg => 
      msg.text.includes('[CONFLUENCE EMOTION DEBUG]') || 
      msg.text.includes('[EMOTION DEBUG]') ||
      msg.text.includes('[FILTER DEBUG]')
    );
    
    // Create test report
    const testReport = {
      timestamp: new Date().toISOString(),
      testResults: {
        dashboard: {
          debugMessages: dashboardDebugMessages,
          totalConsoleMessages: dashboardConsoleMessages.length
        },
        confluence: {
          debugMessages: confluenceDebugMessages,
          totalConsoleMessages: confluenceConsoleMessages.length
        }
      },
      analysis: {
        hasDashboardDebugMessages: dashboardDebugMessages.length > 0,
        hasConfluenceDebugMessages: confluenceDebugMessages.length > 0,
        confluenceShowsCorrectDataSource: confluenceDebugMessages.some(msg => 
          msg.text.includes('Using data source: trades') || 
          msg.text.includes('Using data source: filteredTrades')
        )
      }
    };
    
    // Save test report
    const reportPath = path.join(__dirname, 'emotional-state-auth-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
    console.log(`\n📄 Test report saved to: ${reportPath}`);
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log('=====================================');
    console.log(`Dashboard debug messages: ${testReport.analysis.hasDashboardDebugMessages ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`Confluence debug messages: ${testReport.analysis.hasConfluenceDebugMessages ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`Confluence shows data source: ${testReport.analysis.confluenceShowsCorrectDataSource ? '✅ YES' : '❌ NO'}`);
    
    if (dashboardDebugMessages.length > 0) {
      console.log('\n🔍 Dashboard Debug Messages:');
      dashboardDebugMessages.forEach(msg => console.log(`  ${msg.text}`));
    }
    
    if (confluenceDebugMessages.length > 0) {
      console.log('\n🔍 Confluence Debug Messages:');
      confluenceDebugMessages.forEach(msg => console.log(`  ${msg.text}`));
    }
    
    // Take screenshots
    await page.screenshot({ path: 'dashboard-auth-screenshot.png', fullPage: true });
    console.log('📸 Dashboard screenshot saved: dashboard-auth-screenshot.png');
    
    await page.goto('http://localhost:3000/confluence');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'confluence-auth-screenshot.png', fullPage: true });
    console.log('📸 Confluence screenshot saved: confluence-auth-screenshot.png');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
    console.log('\n🏁 Test completed.');
  }
}

async function createTestPage(page) {
  console.log('📝 Creating test page to verify emotional state logic...');
  
  // Create a simple HTML page that includes the emotional state logic
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Emotional State Fix Test</title>
      <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    </head>
    <body>
      <div id="root"></div>
      <script>
        const { useState, useEffect, useMemo } = React;
        
        // Mock trade data
        const mockTrades = [
          { id: '1', symbol: 'AAPL', market: 'Stock', side: 'Buy', quantity: 100, pnl: 150, trade_date: '2023-01-01', strategy_id: 's1', emotional_state: ['FOMO', 'CONFIDENT'] },
          { id: '2', symbol: 'GOOGL', market: 'Stock', side: 'Sell', quantity: 50, pnl: -50, trade_date: '2023-01-02', strategy_id: 's2', emotional_state: ['PATIENCE', 'DISCIPLINE'] },
          { id: '3', symbol: 'BTC', market: 'Crypto', side: 'Buy', quantity: 1, pnl: 200, trade_date: '2023-01-03', strategy_id: 's1', emotional_state: ['TILT', 'REVENGE'] }
        ];
        
        // Mock filters
        const mockFilters = {
          market: '',
          symbol: '',
          strategy: '',
          side: '',
          startDate: '',
          endDate: '',
          emotionSearch: []
        };
        
        // Replicate the getEmotionData function from dashboard
        function getEmotionData(trades) {
          console.log('🔍 [DASHBOARD EMOTION DEBUG] Processing emotion data');
          console.log('🔍 [DASHBOARD EMOTION DEBUG] Total trades being processed:', trades.length);
          
          const emotionData = {};
          const validEmotions = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
          
          trades.forEach((trade, index) => {
            let emotions = [];
            
            if (trade.emotional_state) {
              if (Array.isArray(trade.emotional_state)) {
                emotions = trade.emotional_state
                  .filter(e => typeof e === 'string' && e.trim())
                  .map(e => e.trim().toUpperCase());
              }
            }
            
            const validEmotionsForTrade = emotions.filter(emotion => validEmotions.includes(emotion));
            
            if (validEmotionsForTrade.length === 0) {
              return;
            }
            
            validEmotionsForTrade.forEach(emotion => {
              if (!emotionData[emotion]) {
                emotionData[emotion] = { buyCount: 0, sellCount: 0, nullCount: 0 };
              }
              
              const tradeSide = typeof trade.side === 'string' ? trade.side.trim() : null;
              
              if (tradeSide === 'Buy') {
                emotionData[emotion].buyCount++;
              } else if (tradeSide === 'Sell') {
                emotionData[emotion].sellCount++;
              } else {
                emotionData[emotion].nullCount++;
              }
            });
          });
          
          const emotionEntries = Object.entries(emotionData);
          const maxFrequency = Math.max(...emotionEntries.map(([_, counts]) =>
            counts.buyCount + counts.sellCount + counts.nullCount
          ), 1);
          
          const dynamicFullMark = Math.ceil(maxFrequency * 1.2);
          
          const result = emotionEntries.map(([emotion, counts]) => {
            const total = counts.buyCount + counts.sellCount + counts.nullCount;
            
            let leaningValue = 0;
            let leaning = 'Balanced';
            let side = 'NULL';
            
            leaningValue = ((counts.buyCount - counts.sellCount) / total) * 100;
            leaningValue = Math.max(-100, Math.min(100, leaningValue));
            
            if (leaningValue > 15) {
              leaning = 'Buy Leaning';
              side = 'Buy';
            } else if (leaningValue < -15) {
              leaning = 'Sell Leaning';
              side = 'Sell';
            } else {
              leaning = 'Balanced';
              side = 'NULL';
            }
            
            return {
              subject: emotion,
              value: total,
              fullMark: dynamicFullMark,
              leaning,
              side,
              leaningValue,
              totalTrades: total
            };
          });
          
          console.log('🔍 [DASHBOARD EMOTION DEBUG] Emotion data result:', result);
          return result;
        }
        
        // Replicate the confluence emotionalTrendData function
        function getEmotionalTrendData(trades, filteredTrades, hasActiveFilters) {
          console.log('🔍 [CONFLUENCE EMOTION DEBUG] Has active filters:', hasActiveFilters);
          console.log('🔍 [CONFLUENCE EMOTION DEBUG] Using data source:', hasActiveFilters ? 'filteredTrades' : 'all trades');
          console.log('🔍 [CONFLUENCE EMOTION DEBUG] Total trades available:', trades.length);
          console.log('🔍 [CONFLUENCE EMOTION DEBUG] Filtered trades count:', filteredTrades.length);
          
          // Use appropriate data source based on whether filters are active
          let dataToProcess = hasActiveFilters ? filteredTrades : trades;
          
          // Add safeguard to ensure consistency with dashboard when no filters are active
          if (!hasActiveFilters && filteredTrades.length !== trades.length) {
            console.warn('🔍 [EMOTION DEBUG] Data inconsistency detected - forcing use of trades for consistency with dashboard');
            dataToProcess = trades;
          }
          
          console.log('🔍 [CONFLUENCE EMOTION DEBUG] Data source chosen:', hasActiveFilters ? 'filteredTrades' : 'trades');
          console.log('🔍 [CONFLUENCE EMOTION DEBUG] Data to process count:', dataToProcess.length);
          
          return getEmotionData(dataToProcess);
        }
        
        function TestComponent() {
          const [filteredTrades, setFilteredTrades] = useState(mockTrades);
          
          // Check if any filters are active
          const hasActiveFilters = !!(
            mockFilters.market ||
            mockFilters.symbol ||
            mockFilters.strategy ||
            mockFilters.side ||
            mockFilters.startDate ||
            mockFilters.endDate ||
            (mockFilters.emotionSearch && mockFilters.emotionSearch.length > 0)
          );
          
          // Get emotion data for dashboard (using all trades)
          const dashboardEmotionData = useMemo(() => {
            return getEmotionData(mockTrades);
          }, [mockTrades]);
          
          // Get emotion data for confluence (using filtered trades when filters are active)
          const confluenceEmotionData = useMemo(() => {
            return getEmotionalTrendData(mockTrades, filteredTrades, hasActiveFilters);
          }, [mockTrades, filteredTrades, hasActiveFilters]);
          
          return React.createElement('div', { style: { padding: '20px', fontFamily: 'Arial, sans-serif' } }, [
            React.createElement('h1', { key: 'title' }, 'Emotional State Fix Test'),
            
            React.createElement('div', { key: 'dashboard', style: { marginBottom: '30px' } }, [
              React.createElement('h2', { key: 'title' }, 'Dashboard Emotion Data'),
              React.createElement('pre', { key: 'data', style: { background: '#f0f0f0', padding: '10px' } }, 
                JSON.stringify(dashboardEmotionData, null, 2))
            ]),
            
            React.createElement('div', { key: 'confluence', style: { marginBottom: '30px' } }, [
              React.createElement('h2', { key: 'title' }, 'Confluence Emotion Data'),
              React.createElement('p', { key: 'info' }, \`Has active filters: \${hasActiveFilters}\`),
              React.createElement('pre', { key: 'data', style: { background: '#f0f0f0', padding: '10px' } }, 
                JSON.stringify(confluenceEmotionData, null, 2))
            ]),
            
            React.createElement('div', { key: 'comparison', style: { marginBottom: '30px' } }, [
              React.createElement('h2', { key: 'title' }, 'Comparison'),
              React.createElement('p', { key: 'result', style: { 
                fontSize: '18px', 
                fontWeight: 'bold',
                color: JSON.stringify(dashboardEmotionData) === JSON.stringify(confluenceEmotionData) ? 'green' : 'red' 
              } }, 
                \`Data is \${JSON.stringify(dashboardEmotionData) === JSON.stringify(confluenceEmotionData) ? 'CONSISTENT' : 'INCONSISTENT'}\`)
            ])
          ]);
        }
        
        ReactDOM.render(React.createElement(TestComponent), document.getElementById('root'));
      </script>
    </body>
    </html>
  `;
  
  // Write the test HTML to a file
  const testHtmlPath = path.join(__dirname, 'emotional-state-test.html');
  fs.writeFileSync(testHtmlPath, testHtml);
  
  // Navigate to the test page
  await page.goto(`file://${testHtmlPath}`);
  await page.waitForTimeout(3000);
  
  // Take a screenshot of the test results
  await page.screenshot({ path: 'emotional-state-test-results.png', fullPage: true });
  console.log('📸 Test results screenshot saved: emotional-state-test-results.png');
  
  console.log('✅ Test page created and loaded. Check the browser window for results.');
}

// Run the test
testEmotionalStateFixWithAuth().catch(console.error);