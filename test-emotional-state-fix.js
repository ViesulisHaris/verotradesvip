const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testEmotionalStateFix() {
  console.log('🔍 Starting emotional state fix verification test...');
  
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
    
    // Check if user needs to login
    const loginButton = await page.$('text=Login');
    if (loginButton) {
      console.log('🔐 Login required, attempting to navigate directly to dashboard...');
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // If still redirected to login, we'll need to handle authentication
      if (page.url().includes('/login')) {
        console.log('⚠️ Authentication required. Please login manually and then run this test again.');
        await browser.close();
        return;
      }
    }
    
    // Test 1: Navigate to dashboard and capture emotional state data
    console.log('\n📊 Testing Dashboard Page...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow time for data to load
    
    // Clear console messages for dashboard
    const dashboardConsoleMessages = [...consoleMessages];
    consoleMessages.length = 0;
    
    // Get emotional state data from dashboard
    const dashboardEmotionData = await page.evaluate(() => {
      const emotionDataElement = document.querySelector('[data-testid="emotion-radar"]');
      if (emotionDataElement) {
        // Try to get the data from the component
        const reactKey = Object.keys(emotionDataElement).find(key => key.startsWith('__react'));
        if (reactKey) {
          const reactInstance = emotionDataElement[reactKey];
          if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.data) {
            return reactInstance.memoizedProps.data;
          }
        }
      }
      return null;
    });
    
    // Wait a bit more to capture all console messages
    await page.waitForTimeout(2000);
    const dashboardConsoleOutput = [...consoleMessages];
    
    // Test 2: Navigate to confluence page and capture emotional state data
    console.log('\n🔍 Testing Confluence Page...');
    await page.goto('http://localhost:3000/confluence');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow time for data to load
    
    // Clear console messages for confluence
    consoleMessages.length = 0;
    
    // Get emotional state data from confluence
    const confluenceEmotionData = await page.evaluate(() => {
      const emotionDataElement = document.querySelector('[data-testid="emotion-radar"]');
      if (emotionDataElement) {
        // Try to get the data from the component
        const reactKey = Object.keys(emotionDataElement).find(key => key.startsWith('__react'));
        if (reactKey) {
          const reactInstance = emotionDataElement[reactKey];
          if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.data) {
            return reactInstance.memoizedProps.data;
          }
        }
      }
      return null;
    });
    
    // Wait a bit more to capture all console messages
    await page.waitForTimeout(2000);
    const confluenceConsoleOutput = [...consoleMessages];
    
    // Test 3: Apply filters on confluence page
    console.log('\n🧪 Testing Filters on Confluence Page...');
    
    // Try to click on "Stocks" filter pill
    const stocksFilter = await page.$('text=Stocks');
    if (stocksFilter) {
      console.log('✅ Found Stocks filter, applying...');
      await stocksFilter.click();
      await page.waitForTimeout(2000);
      
      // Check if filtered data is different
      const filteredEmotionData = await page.evaluate(() => {
        const emotionDataElement = document.querySelector('[data-testid="emotion-radar"]');
        if (emotionDataElement) {
          const reactKey = Object.keys(emotionDataElement).find(key => key.startsWith('__react'));
          if (reactKey) {
            const reactInstance = emotionDataElement[reactKey];
            if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.data) {
              return reactInstance.memoizedProps.data;
            }
          }
        }
        return null;
      });
      
      console.log('📊 Filtered emotion data:', filteredEmotionData);
    }
    
    // Reset filters
    const resetButton = await page.$('text=Reset All');
    if (resetButton) {
      console.log('🔄 Resetting filters...');
      await resetButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Analyze results
    console.log('\n📋 Analyzing Results...');
    
    // Extract relevant debug messages
    const dashboardDebugMessages = dashboardConsoleOutput.filter(msg => 
      msg.text.includes('[DASHBOARD EMOTION DEBUG]') || 
      msg.text.includes('[EMOTION DEBUG]')
    );
    
    const confluenceDebugMessages = confluenceConsoleOutput.filter(msg => 
      msg.text.includes('[CONFLUENCE EMOTION DEBUG]') || 
      msg.text.includes('[EMOTION DEBUG]') ||
      msg.text.includes('[FILTER DEBUG]')
    );
    
    // Create test report
    const testReport = {
      timestamp: new Date().toISOString(),
      testResults: {
        dashboard: {
          emotionData: dashboardEmotionData,
          debugMessages: dashboardDebugMessages,
          totalConsoleMessages: dashboardConsoleOutput.length
        },
        confluence: {
          emotionData: confluenceEmotionData,
          debugMessages: confluenceDebugMessages,
          totalConsoleMessages: confluenceConsoleOutput.length
        }
      },
      analysis: {
        dataConsistency: JSON.stringify(dashboardEmotionData) === JSON.stringify(confluenceEmotionData),
        dashboardDataPoints: dashboardEmotionData ? dashboardEmotionData.length : 0,
        confluenceDataPoints: confluenceEmotionData ? confluenceEmotionData.length : 0
      }
    };
    
    // Save test report
    const reportPath = path.join(__dirname, 'emotional-state-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
    console.log(`\n📄 Test report saved to: ${reportPath}`);
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log('=====================================');
    console.log(`Dashboard emotion data points: ${testReport.analysis.dashboardDataPoints}`);
    console.log(`Confluence emotion data points: ${testReport.analysis.confluenceDataPoints}`);
    console.log(`Data consistency: ${testReport.analysis.dataConsistency ? '✅ CONSISTENT' : '❌ INCONSISTENT'}`);
    
    if (dashboardDebugMessages.length > 0) {
      console.log('\n🔍 Dashboard Debug Messages:');
      dashboardDebugMessages.forEach(msg => console.log(`  ${msg.text}`));
    }
    
    if (confluenceDebugMessages.length > 0) {
      console.log('\n🔍 Confluence Debug Messages:');
      confluenceDebugMessages.forEach(msg => console.log(`  ${msg.text}`));
    }
    
    // Take screenshots
    await page.screenshot({ path: 'dashboard-screenshot.png', fullPage: true });
    console.log('📸 Dashboard screenshot saved: dashboard-screenshot.png');
    
    await page.goto('http://localhost:3000/confluence');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'confluence-screenshot.png', fullPage: true });
    console.log('📸 Confluence screenshot saved: confluence-screenshot.png');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
    console.log('\n🏁 Test completed.');
  }
}

// Run the test
testEmotionalStateFix().catch(console.error);