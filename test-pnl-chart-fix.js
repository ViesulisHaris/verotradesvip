const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testPnLChartFix() {
  console.log('🚀 Starting PnL Chart Fix Verification Test');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ 
    headless: false, // Set to false for visual verification
    slowMo: 1000 // Slow down for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Collect console logs for analysis
  const consoleLogs = [];
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    
    // Filter for PnL chart related logs
    if (msg.text().includes('PNL') || msg.text().includes('PnL') || msg.text().includes('[PnL DEBUG')) {
      console.log(`🔍 [CONSOLE] ${msg.type()}: ${msg.text()}`);
    }
  });
  
  // Collect network requests
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('supabase') || request.url().includes('trades')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  try {
    console.log('📍 Step 1: Navigating to dashboard page...');
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    console.log('📍 Step 2: Checking if user is authenticated...');
    // Check if we're redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('🔐 User not authenticated, attempting login...');
      
      // Fill in login credentials (assuming test user exists)
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.waitForTimeout(2000);
    }
    
    console.log('📍 Step 3: Analyzing PnL Chart component...');
    
    // Check if PnL Chart container exists
    const pnlChartContainer = await page.locator('div').filter({ hasText: 'P&L Performance' }).first();
    const containerExists = await pnlChartContainer.isVisible();
    
    console.log(`📊 P&L Performance container visible: ${containerExists}`);
    
    // Look for the actual chart element
    const chartElement = await page.locator('.recharts-wrapper').first();
    const chartExists = await chartElement.isVisible({ timeout: 5000 });
    
    console.log(`📈 Chart element visible: ${chartExists}`);
    
    // Check for "No P&L data available" message (should NOT be present)
    const emptyStateMessage = await page.locator('text="No P&L data available"').first();
    const emptyStateExists = await emptyStateMessage.isVisible({ timeout: 3000 }).catch(() => false);
    
    console.log(`❌ Empty state message visible: ${emptyStateExists} (should be false)`);
    
    // Check for sample data indicators in console logs
    const sampleDataLogs = consoleLogs.filter(log => 
      log.text.includes('Sample') && log.text.includes('PnL')
    );
    
    console.log(`🔍 Sample data logs found: ${sampleDataLogs.length}`);
    
    // Check for chart rendering logs
    const chartRenderLogs = consoleLogs.filter(log => 
      log.text.includes('[PNL CHART DEBUG]') && log.text.includes('Rendering actual chart')
    );
    
    console.log(`📊 Chart render logs found: ${chartRenderLogs.length}`);
    
    // Check for empty state diagnosis logs
    const emptyStateDiagnosisLogs = consoleLogs.filter(log => 
      log.text.includes('EMPTY DATA DETECTED') || log.text.includes('will show empty state')
    );
    
    console.log(`🔍 Empty state diagnosis logs: ${emptyStateDiagnosisLogs.length}`);
    
    console.log('📍 Step 4: Taking screenshot evidence...');
    
    // Take a screenshot of the dashboard
    const screenshotPath = `pnl-chart-test-screenshot-${Date.now()}.png`;
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    // Take a close-up screenshot of the PnL chart area
    const chartScreenshotPath = `pnl-chart-closeup-${Date.now()}.png`;
    if (containerExists) {
      await pnlChartContainer.screenshot({ 
        path: chartScreenshotPath 
      });
      console.log(`📸 Chart close-up saved: ${chartScreenshotPath}`);
    }
    
    console.log('📍 Step 5: Analyzing test results...');
    
    // Compile test results
    const testResults = {
      timestamp: new Date().toISOString(),
      testStatus: 'PASSED',
      findings: {
        containerVisible: containerExists,
        chartVisible: chartExists,
        emptyStateHidden: !emptyStateExists,
        sampleDataUsed: sampleDataLogs.length > 0,
        chartRendered: chartRenderLogs.length > 0,
        emptyStateDiagnosed: emptyStateDiagnosisLogs.length > 0
      },
      evidence: {
        screenshotPath,
        chartScreenshotPath,
        consoleLogs: consoleLogs.filter(log => 
          log.text.includes('PNL') || 
          log.text.includes('PnL') || 
          log.text.includes('[PnL DEBUG') ||
          log.text.includes('[PNL CHART DEBUG]')
        ),
        networkRequests
      },
      summary: {
        chartAlwaysRenders: chartExists,
        noEmptyStateMessage: !emptyStateExists,
        debugLogsWorking: consoleLogs.some(log => log.text.includes('[PNL CHART DEBUG]')),
        sampleDataFallback: sampleDataLogs.length > 0
      }
    };
    
    // Determine overall test status
    if (chartExists && !emptyStateExists) {
      testResults.testStatus = 'PASSED';
      console.log('✅ PnL Chart Fix VERIFICATION: PASSED');
      console.log('   - Chart is rendering correctly');
      console.log('   - No empty state message displayed');
      console.log('   - Component always shows either real data or sample data');
    } else {
      testResults.testStatus = 'FAILED';
      console.log('❌ PnL Chart Fix VERIFICATION: FAILED');
      console.log('   - Chart may not be rendering');
      console.log('   - Empty state message might still be showing');
    }
    
    // Save detailed test results
    const resultsPath = `pnl-chart-test-results-${Date.now()}.json`;
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`📄 Detailed results saved: ${resultsPath}`);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 PnL CHART FIX TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Chart Container Visible: ${containerExists}`);
    console.log(`✅ Chart Element Visible: ${chartExists}`);
    console.log(`✅ Empty State Hidden: ${!emptyStateExists}`);
    console.log(`✅ Sample Data Used: ${sampleDataLogs.length > 0}`);
    console.log(`✅ Chart Rendered: ${chartRenderLogs.length > 0}`);
    console.log(`✅ Debug Logs Working: ${consoleLogs.some(log => log.text.includes('[PNL CHART DEBUG]'))}`);
    console.log('='.repeat(60));
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    
    // Take error screenshot
    const errorScreenshotPath = `pnl-chart-error-${Date.now()}.png`;
    await page.screenshot({ path: errorScreenshotPath });
    console.log(`📸 Error screenshot saved: ${errorScreenshotPath}`);
    
    return {
      testStatus: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString(),
      consoleLogs: consoleLogs.filter(log => 
        log.text.includes('PNL') || 
        log.text.includes('PnL') || 
        log.text.includes('error') ||
        log.text.includes('Error')
      )
    };
  } finally {
    await browser.close();
  }
}

// Run the test
testPnLChartFix().then(results => {
  console.log('\n🏁 Test completed!');
  process.exit(results.testStatus === 'PASSED' ? 0 : 1);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});