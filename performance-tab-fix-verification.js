const { chromium } = require('playwright');
const fs = require('fs');

async function verifyPerformanceTabFix() {
  console.log('🔍 [VERIFICATION] Starting performance tab fix verification...');
  
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
    // Navigate to strategies page
    console.log('🔍 [VERIFICATION] Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle' });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for strategy cards
    console.log('🔍 [VERIFICATION] Looking for strategy cards...');
    const strategyCards = await page.locator('[data-testid="strategy-card"]').count();
    console.log(`🔍 [VERIFICATION] Found ${strategyCards} strategy cards`);
    
    if (strategyCards === 0) {
      // Try alternative selectors - look for any clickable elements that might be strategy cards
      const allClickableElements = await page.locator('div:has-text("View Performance")').count();
      const glassElements = await page.locator('.glass').count();
      console.log(`🔍 [VERIFICATION] Found ${allClickableElements} clickable elements with "View Performance" text`);
      console.log(`🔍 [VERIFICATION] Found ${glassElements} glass elements`);
      
      if (allClickableElements > 0) {
        console.log('🔍 [VERIFICATION] Clicking on element with "View Performance" text...');
        await page.locator('div:has-text("View Performance")').first().click();
      } else if (glassElements > 0) {
        console.log('🔍 [VERIFICATION] Clicking on first glass element...');
        await page.locator('.glass').first().click();
      } else {
        console.log('🔍 [VERIFICATION] No strategy elements found, skipping test');
        await browser.close();
        return;
      }
    } else {
      // Click on first strategy card to open the modal
      console.log('🔍 [VERIFICATION] Clicking on first strategy card...');
      await page.locator('[data-testid="strategy-card"]').first().click();
    }
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Check if modal is visible
    const modalVisible = await page.locator('[data-testid="strategy-performance-modal-backdrop"]').isVisible();
    console.log(`🔍 [VERIFICATION] Modal visible: ${modalVisible}`);
    
    if (!modalVisible) {
      // Try to find any modal-like element
      const modalExists = await page.locator('.fixed.inset-0').count();
      console.log(`🔍 [VERIFICATION] Found ${modalExists} fixed modal elements`);
    }
    
    // Wait for initial data loading
    await page.waitForTimeout(3000);
    
    // Click on the Performance tab
    console.log('🔍 [VERIFICATION] Clicking on Performance tab...');
    await page.locator('text=Performance').click();
    
    // Wait for tab content to render
    await page.waitForTimeout(3000);
    
    // Check for performance tab content
    console.log('🔍 [VERIFICATION] Checking for performance tab content...');
    
    // Look for loading indicators
    const loadingIndicators = await page.locator('.animate-spin').count();
    console.log(`🔍 [VERIFICATION] Loading indicators found: ${loadingIndicators}`);
    
    // Look for "No performance data available" message
    const noDataMessage = await page.locator('text=No performance data available').count();
    console.log(`🔍 [VERIFICATION] No data messages found: ${noDataMessage}`);
    
    // Look for chart container
    const chartContainer = await page.locator('.chart-container').count();
    console.log(`🔍 [VERIFICATION] Chart containers found: ${chartContainer}`);
    
    // Look for troubleshooting section
    const troubleshootingSection = await page.locator('text=Troubleshooting:').count();
    console.log(`🔍 [VERIFICATION] Troubleshooting sections found: ${troubleshootingSection}`);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'performance-tab-fix-verification-screenshot.png', 
      fullPage: true 
    });
    console.log('🔍 [VERIFICATION] Screenshot saved');
    
    // Wait a bit more to capture all console logs
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('🔍 [VERIFICATION] Error during test:', error);
  } finally {
    await browser.close();
  }
  
  // Analyze console messages
  console.log('\n🔍 [VERIFICATION] Analyzing console messages...');
  const performanceTabMessages = consoleMessages.filter(msg => 
    msg.includes('[PERFORMANCE_TAB_DEBUG]') || 
    msg.includes('[TAB_DEBUG]') || 
    msg.includes('[CHART_DATA_DEBUG]')
  );
  
  console.log(`🔍 [VERIFICATION] Found ${performanceTabMessages.length} performance-related debug messages:`);
  performanceTabMessages.forEach(msg => console.log('  ', msg));
  
  // Check for key fix indicators
  const hasLoadingState = performanceTabMessages.some(msg => msg.includes('Loading performance data'));
  const hasDataReload = performanceTabMessages.some(msg => msg.includes('Performance tab accessed but no data loaded'));
  const hasBetterErrorHandling = performanceTabMessages.some(msg => msg.includes('No trades found for') && msg.includes('strategy'));
  
  console.log('\n🔍 [VERIFICATION] Fix Analysis:');
  console.log(`  - Loading state handling: ${hasLoadingState ? '✅ Improved' : '❌ Missing'}`);
  console.log(`  - Data reload trigger: ${hasDataReload ? '✅ Working' : '❌ Missing'}`);
  console.log(`  - Better error messages: ${hasBetterErrorHandling ? '✅ Improved' : '❌ Missing'}`);
  
  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    consoleMessages: performanceTabMessages,
    allMessages: consoleMessages,
    fixAnalysis: {
      hasLoadingState,
      hasDataReload,
      hasBetterErrorHandling
    },
    testResults: {
      loadingIndicators,
      noDataMessage,
      chartContainer,
      troubleshootingSection
    }
  };
  
  fs.writeFileSync(
    'performance-tab-fix-verification-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('🔍 [VERIFICATION] Results saved to performance-tab-fix-verification-results.json');
  
  // Determine if fix was successful
  const fixSuccessful = hasLoadingState && hasDataReload && hasBetterErrorHandling;
  console.log(`\n🔍 [VERIFICATION] Overall fix status: ${fixSuccessful ? '✅ SUCCESS' : '❌ NEEDS MORE WORK'}`);
  
  return fixSuccessful;
}

verifyPerformanceTabFix().catch(console.error);