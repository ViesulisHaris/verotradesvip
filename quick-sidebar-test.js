const { chromium } = require('playwright');

/**
 * Quick Sidebar UI Consistency Test
 * 
 * This is a simplified test to quickly check the main issues:
 * 1. Navigation flow between pages
 * 2. Settings link presence
 * 3. UnifiedSidebar vs old Sidebar
 */

async function quickTest() {
  console.log('🚀 Starting Quick Sidebar UI Consistency Test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    pages: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };
  
  const pages = [
    '/dashboard',
    '/settings', 
    '/trades',
    '/strategies',
    '/analytics',
    '/calendar',
    '/log-trade'
  ];
  
  for (const pagePath of pages) {
    try {
      console.log(`📍 Testing ${pagePath}...`);
      
      // Navigate to page
      await page.goto(`http://localhost:3000${pagePath}`);
      await page.waitForLoadState('networkidle');
      
      // Wait a bit for any dynamic content
      await page.waitForTimeout(2000);
      
      // Check for sidebar
      const sidebarExists = await page.locator('aside').count() > 0;
      
      // Check for Settings link
      const settingsLinkExists = await page.locator('a[href="/settings"]').count() > 0;
      
      // Check sidebar styling (UnifiedSidebar indicator)
      let hasUnifiedStyling = false;
      if (sidebarExists) {
        const sidebarElement = await page.locator('aside').first();
        hasUnifiedStyling = await sidebarElement.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.backgroundColor === 'rgb(18, 18, 18)' || 
                 style.backgroundColor === '#121212' ||
                 el.classList.contains('bg-[#121212]') ||
                 style.backgroundColor.includes('18, 18, 18');
        });
      }
      
      // Check for duplicate sidebars
      const sidebarCount = await page.locator('aside').count();
      const hasNoDuplicates = sidebarCount === 1;
      
      // Check for navigation items
      const navItems = await page.locator('nav a').count();
      
      const pageResult = {
        sidebarExists,
        settingsLinkExists,
        hasUnifiedStyling,
        hasNoDuplicates,
        navItems,
        sidebarCount,
        passed: sidebarExists && settingsLinkExists && hasUnifiedStyling && hasNoDuplicates
      };
      
      results.pages[pagePath] = pageResult;
      results.summary.total++;
      if (pageResult.passed) {
        results.summary.passed++;
        console.log(`✅ ${pagePath} - PASSED`);
      } else {
        results.summary.failed++;
        console.log(`❌ ${pagePath} - FAILED`);
        console.log(`   - Sidebar: ${sidebarExists}`);
        console.log(`   - Settings Link: ${settingsLinkExists}`);
        console.log(`   - Unified Styling: ${hasUnifiedStyling}`);
        console.log(`   - No Duplicates: ${hasNoDuplicates}`);
        console.log(`   - Sidebar Count: ${sidebarCount}`);
      }
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: `quick-test-${pagePath.replace('/', '-')}.png`,
        fullPage: true 
      });
      
    } catch (error) {
      console.error(`❌ Error testing ${pagePath}:`, error.message);
      results.pages[pagePath] = {
        error: error.message,
        passed: false
      };
      results.summary.total++;
      results.summary.failed++;
    }
  }
  
  // Test Settings link functionality
  console.log('\n🔗 Testing Settings link functionality...');
  try {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    const settingsLink = page.locator('a[href="/settings"]').first();
    const isVisible = await settingsLink.isVisible();
    
    if (isVisible) {
      await settingsLink.click();
      await page.waitForURL('**/settings', { timeout: 5000 });
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      const navigatedToSettings = currentUrl.includes('/settings');
      
      console.log(navigatedToSettings ? 
        '✅ Settings link navigation works' : 
        '❌ Settings link navigation failed');
    } else {
      console.log('❌ Settings link not visible on dashboard');
    }
  } catch (error) {
    console.error('❌ Error testing Settings link:', error.message);
  }
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`Total: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Pass Rate: ${results.summary.total > 0 ? ((results.summary.passed / results.summary.total) * 100).toFixed(1) : 0}%`);
  
  await browser.close();
  
  // Save results
  const fs = require('fs');
  fs.writeFileSync('quick-sidebar-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Results saved to quick-sidebar-test-results.json');
  
  return results;
}

// Run the test
quickTest().catch(console.error);