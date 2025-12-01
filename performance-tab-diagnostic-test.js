const { chromium } = require('playwright');
const fs = require('fs');

async function diagnosePerformanceTabIssue() {
  console.log('🔍 [DIAGNOSTIC_TEST] Starting performance tab diagnostic test...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture console logs from the browser
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    if (text.includes('[PERFORMANCE_TAB_DEBUG]') || 
        text.includes('[TAB_DEBUG]') || 
        text.includes('[CHART_DATA_DEBUG]') ||
        text.includes('[DEBUG]')) {
      console.log('🔍 [BROWSER_CONSOLE]', text);
    }
  });
  
  try {
    // Navigate to the strategies page
    console.log('🔍 [DIAGNOSTIC_TEST] Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle' });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for strategy cards
    console.log('🔍 [DIAGNOSTIC_TEST] Looking for strategy cards...');
    const strategyCards = await page.locator('[data-testid="strategy-card"]').count();
    console.log(`🔍 [DIAGNOSTIC_TEST] Found ${strategyCards} strategy cards`);
    
    if (strategyCards === 0) {
      // Try alternative selectors
      const alternativeCards = await page.locator('.glass').count();
      console.log(`🔍 [DIAGNOSTIC_TEST] Found ${alternativeCards} glass elements`);
    }
    
    // Click on the first strategy card to open the modal
    console.log('🔍 [DIAGNOSTIC_TEST] Clicking on first strategy card...');
    await page.locator('[data-testid="strategy-card"]').first().click();
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Check if modal is visible
    const modalVisible = await page.locator('[data-testid="strategy-performance-modal-backdrop"]').isVisible();
    console.log(`🔍 [DIAGNOSTIC_TEST] Modal visible: ${modalVisible}`);
    
    if (!modalVisible) {
      // Try to find any modal-like element
      const modalExists = await page.locator('.fixed.inset-0').count();
      console.log(`🔍 [DIAGNOSTIC_TEST] Found ${modalExists} fixed modal elements`);
    }
    
    // Wait for initial data loading
    await page.waitForTimeout(3000);
    
    // Click on the Performance tab
    console.log('🔍 [DIAGNOSTIC_TEST] Clicking on Performance tab...');
    await page.locator('text=Performance').click();
    
    // Wait for tab content to render
    await page.waitForTimeout(2000);
    
    // Check for performance tab content
    console.log('🔍 [DIAGNOSTIC_TEST] Checking for performance tab content...');
    
    // Look for chart container
    const chartContainer = await page.locator('.chart-container').count();
    console.log(`🔍 [DIAGNOSTIC_TEST] Chart containers found: ${chartContainer}`);
    
    // Look for "No performance data available" message
    const noDataMessage = await page.locator('text=No performance data available').count();
    console.log(`🔍 [DIAGNOSTIC_TEST] No data messages found: ${noDataMessage}`);
    
    // Look for loading indicators
    const loadingIndicators = await page.locator('.animate-spin').count();
    console.log(`🔍 [DIAGNOSTIC_TEST] Loading indicators found: ${loadingIndicators}`);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'performance-tab-diagnostic-screenshot.png', 
      fullPage: true 
    });
    console.log('🔍 [DIAGNOSTIC_TEST] Screenshot saved');
    
    // Wait a bit more to capture all console logs
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('🔍 [DIAGNOSTIC_TEST] Error during test:', error);
  } finally {
    await browser.close();
  }
  
  // Analyze console messages
  console.log('\n🔍 [DIAGNOSTIC_TEST] Analyzing console messages...');
  const performanceTabMessages = consoleMessages.filter(msg => 
    msg.includes('[PERFORMANCE_TAB_DEBUG]') || 
    msg.includes('[TAB_DEBUG]') || 
    msg.includes('[CHART_DATA_DEBUG]')
  );
  
  console.log(`🔍 [DIAGNOSTIC_TEST] Found ${performanceTabMessages.length} performance-related debug messages:`);
  performanceTabMessages.forEach(msg => console.log('  ', msg));
  
  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    consoleMessages: performanceTabMessages,
    allMessages: consoleMessages
  };
  
  fs.writeFileSync(
    'performance-tab-diagnostic-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('🔍 [DIAGNOSTIC_TEST] Results saved to performance-tab-diagnostic-results.json');
}

diagnosePerformanceTabIssue().catch(console.error);