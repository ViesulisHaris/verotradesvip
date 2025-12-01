const { chromium } = require('playwright');

async function testDashboardPnLDiagnosis() {
  console.log('🔧 [TEST] Starting PnL graph diagnosis test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('PnL DEBUG') || text.includes('PNL CHART DEBUG')) {
      console.log('🔍 [CONSOLE]', text);
    }
  });
  
  try {
    // Navigate to login first
    console.log('🔧 [TEST] Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    
    // Wait for login page to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in login credentials (assuming test user exists)
    console.log('🔧 [TEST] Filling login credentials...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit login
    console.log('🔧 [TEST] Submitting login...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    console.log('🔧 [TEST] Waiting for dashboard...');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Wait for dashboard to load
    await page.waitForSelector('.glass', { timeout: 10000 });
    
    console.log('🔧 [TEST] Dashboard loaded, checking for PnL chart...');
    
    // Wait a bit more for any async operations
    await page.waitForTimeout(3000);
    
    // Check if PnL chart is visible
    const pnlChart = await page.$('text=P&L Performance');
    const emptyState = await page.$('text=No P&L data available');
    
    console.log('🔧 [TEST] PnL Chart elements found:', {
      hasPnlChart: !!pnlChart,
      hasEmptyState: !!emptyState
    });
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'pnl-diagnosis-test.png', fullPage: true });
    console.log('🔧 [TEST] Screenshot saved as pnl-diagnosis-test.png');
    
    // Wait a bit more to capture all console logs
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('🔧 [TEST] Error during test:', error);
  } finally {
    await browser.close();
  }
  
  console.log('🔧 [TEST] PnL diagnosis test completed');
}

testDashboardPnLDiagnosis().catch(console.error);