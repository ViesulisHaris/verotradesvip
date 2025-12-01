const { chromium } = require('playwright');

(async () => {
  console.log('🔍 [DEBUG] Starting sidebar console debug test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--enable-precise-memory-info', '--disable-web-security']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    bypassCSP: true
  });
  
  const page = await context.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('[DEBUG]')) {
      console.log(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });
  
  try {
    // Navigate to login page
    console.log('🔍 [DEBUG] Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Login
    console.log('🔍 [DEBUG] Logging in...');
    await page.fill('[type="email"]', 'testuser@verotrade.com');
    await page.fill('[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    console.log('🔍 [DEBUG] Waiting for dashboard...');
    await page.waitForURL('http://localhost:3000/dashboard', { timeout: 10000 });
    
    // Wait for sidebar to be visible
    console.log('🔍 [DEBUG] Waiting for sidebar...');
    await page.waitForSelector('.sidebar-performance-optimized', { timeout: 10000 });
    
    // Trigger sidebar toggle to see debug logs
    console.log('🔍 [DEBUG] Triggering sidebar toggle...');
    await page.click('[title="Toggle sidebar"]');
    
    // Wait a bit to see all debug logs
    console.log('🔍 [DEBUG] Waiting for debug logs...');
    await page.waitForTimeout(2000);
    
    console.log('🔍 [DEBUG] Debug test completed');
    
  } catch (error) {
    console.error('🔍 [DEBUG] Test failed:', error);
  } finally {
    await browser.close();
  }
})();