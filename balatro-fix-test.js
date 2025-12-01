const playwright = require('playwright');

async function testBalatroFix() {
  console.log('=== BALATRO FIX TEST ===');
  
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test 1: Check if original Balatro component loads without errors
    console.log('Test 1: Testing original Balatro component...');
    await page.goto('http://localhost:3000/test-balatro-debug');
    await page.waitForTimeout(3000);
    
    // Check for console errors
    const consoleErrors = await page.evaluate(() => {
      return window.consoleErrors || [];
    });
    
    if (consoleErrors.length > 0) {
      console.log('❌ Original Balatro has console errors:', consoleErrors);
    } else {
      console.log('✅ Original Balatro loads without console errors');
    }
    
    // Test 2: Check if simplified Balatro component works
    console.log('Test 2: Testing simplified Balatro component...');
    await page.goto('http://localhost:3000/test-balatro-simple');
    await page.waitForTimeout(3000);
    
    const simpleConsoleErrors = await page.evaluate(() => {
      return window.consoleErrors || [];
    });
    
    if (simpleConsoleErrors.length > 0) {
      console.log('❌ Simple Balatro has console errors:', simpleConsoleErrors);
    } else {
      console.log('✅ Simple Balatro loads without console errors');
    }
    
    // Test 3: Check main dashboard
    console.log('Test 3: Testing main dashboard with Balatro...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(5000);
    
    const dashboardErrors = await page.evaluate(() => {
      return window.consoleErrors || [];
    });
    
    if (dashboardErrors.length > 0) {
      console.log('❌ Dashboard has console errors:', dashboardErrors);
    } else {
      console.log('✅ Dashboard loads without console errors');
    }
    
    console.log('=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Capture console errors
const pageConsoleErrors = [];
const originalConsoleError = console.error;
console.error = (...args) => {
  pageConsoleErrors.push(args.join(' '));
  originalConsoleError.apply(console, args);
};

testBalatroFix().catch(console.error);