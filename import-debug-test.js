const { chromium } = require('playwright');

/**
 * Import Debug Test
 * 
 * This test will check what's happening with the UnifiedSidebar import and rendering
 */

async function importDebugTest() {
  console.log('🔍 Starting Import Debug Test...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for all console events
  page.on('console', msg => {
    console.log(`Console [${msg.type()}]: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`Page Error: ${error.message}`);
    console.log(`Page Error Stack: ${error.stack}`);
  });
  
  page.on('requestfailed', request => {
    console.log(`Request Failed: ${request.url()} - ${request.failure().errorText}`);
  });
  
  try {
    // Step 1: Check the dashboard and wait for any errors
    console.log('\n📍 Step 1: Loading dashboard and checking for import errors...');
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait longer to see if there are any runtime errors
    await page.waitForTimeout(5000);
    
    // Step 2: Check what's actually in the DOM
    console.log('\n📍 Step 2: Analyzing DOM content...');
    
    // Get the page content and check for specific patterns
    const content = await page.content();
    
    // Check for error indicators
    const hasError = content.includes('error') || content.includes('Error') || content.includes('ERROR');
    const hasModuleNotFound = content.includes('Module not found') || content.includes('Cannot find module');
    const hasImportError = content.includes('Cannot resolve module') || content.includes('Failed to resolve');
    
    console.log(`Error indicators:`);
    console.log(`- Has error: ${hasError}`);
    console.log(`- Module not found: ${hasModuleNotFound}`);
    console.log(`- Import error: ${hasImportError}`);
    
    // Check for UnifiedSidebar in the content
    const hasUnifiedSidebarText = content.includes('UnifiedSidebar');
    const hasUnifiedSidebarClass = content.includes('unified-sidebar') || content.includes('bg-[#121212]');
    
    console.log(`\nUnifiedSidebar indicators:`);
    console.log(`- Has UnifiedSidebar text: ${hasUnifiedSidebarText}`);
    console.log(`- Has UnifiedSidebar styling: ${hasUnifiedSidebarClass}`);
    
    // Step 3: Look for any sidebar-like elements
    console.log('\n📍 Step 3: Looking for sidebar elements...');
    
    const selectors = [
      'aside',
      '[data-testid="sidebar"]',
      '.sidebar',
      '[class*="sidebar"]',
      '[class*="navigation"]',
      'nav',
      '[role="navigation"]'
    ];
    
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`Found ${count} elements with selector: ${selector}`);
        
        // Get the first element's classes
        const firstElement = await page.locator(selector).first();
        const classes = await firstElement.getAttribute('class');
        const bgStyle = await firstElement.evaluate(el => getComputedStyle(el).backgroundColor);
        
        console.log(`  - Classes: ${classes}`);
        console.log(`  - Background: ${bgStyle}`);
      }
    }
    
    // Step 4: Check if there are any hidden elements
    console.log('\n📍 Step 4: Checking for hidden elements...');
    
    const hiddenSelectors = [
      'aside[style*="display: none"]',
      'aside[style*="visibility: hidden"]',
      'aside.hidden',
      '.sidebar[style*="display: none"]'
    ];
    
    for (const selector of hiddenSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`Found ${count} hidden sidebar elements with: ${selector}`);
      }
    }
    
    // Step 5: Take screenshot for manual inspection
    console.log('\n📍 Step 5: Taking screenshot for manual inspection...');
    await page.screenshot({ path: 'import-debug-dashboard.png', fullPage: true });
    
    // Step 6: Check browser console for any specific errors
    console.log('\n📍 Step 6: Checking browser console...');
    
    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('❌ Import debug test failed:', error);
  }
  
  await browser.close();
  console.log('\n🔍 Import debug test completed');
  console.log('📸 Screenshot saved: import-debug-dashboard.png');
}

// Run the import debug test
importDebugTest().catch(console.error);