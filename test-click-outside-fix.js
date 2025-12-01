const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('🔧 Starting test of click outside fix...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.text()}`);
  });
  
  // Navigate to the app
  await page.goto('http://localhost:3000');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Read and execute the debug script
  const debugScript = fs.readFileSync('debug-click-outside.js', 'utf8');
  await page.evaluate(debugScript);
  
  // Wait for the tests to complete
  await page.waitForTimeout(6000);
  
  // Now run the actual test script
  console.log('\n🔧 Running official test script...');
  const testScript = fs.readFileSync('test-sidebar-click-outside.js', 'utf8');
  await page.evaluate(testScript);
  
  // Wait for the tests to complete
  await page.waitForTimeout(6000);
  
  // Close the browser
  await browser.close();
  
  console.log('✅ Test completed');
})();