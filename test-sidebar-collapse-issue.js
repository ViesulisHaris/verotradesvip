/**
 * Test script to verify the sidebar collapse/expand issue
 * This script will open the application and test the sidebar functionality
 */

const { chromium } = require('playwright');

async function testSidebarIssue() {
  console.log('🔍 Testing sidebar collapse/expand issue...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 } // Desktop viewport
  });
  const page = await context.newPage();

  try {
    // Navigate to the dashboard (assuming user is already logged in or we can test without auth)
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'sidebar-test-initial.png' });
    console.log('📸 Initial state screenshot taken');
    
    // Check if sidebar is visible initially
    const sidebarVisible = await page.isVisible('aside');
    console.log(`🔍 Initial sidebar visibility: ${sidebarVisible}`);
    
    // Find the toggle button (chevron left/right icon)
    const toggleButton = await page.locator('button[aria-label*="sidebar"]').first();
    const toggleVisible = await toggleButton.isVisible();
    console.log(`🔍 Toggle button visible: ${toggleVisible}`);
    
    if (toggleVisible) {
      // Click the toggle button to close sidebar
      console.log('🔍 Clicking toggle button to close sidebar...');
      await toggleButton.click();
      await page.waitForTimeout(500); // Wait for transition
      
      // Take screenshot after closing
      await page.screenshot({ path: 'sidebar-test-after-close.png' });
      console.log('📸 After close screenshot taken');
      
      // Check if sidebar is still visible (should be minimized, not hidden)
      const sidebarAfterClose = await page.isVisible('aside');
      console.log(`🔍 Sidebar visibility after close: ${sidebarAfterClose}`);
      
      // Check sidebar width - should be w-16 (64px) when collapsed, not hidden
      const sidebarWidth = await page.evaluate(() => {
        const sidebar = document.querySelector('aside');
        if (sidebar) {
          const styles = window.getComputedStyle(sidebar);
          return {
            width: styles.width,
            transform: styles.transform,
            display: styles.display,
            visibility: styles.visibility
          };
        }
        return null;
      });
      
      console.log('🔍 Sidebar styles after close:', sidebarWidth);
      
      // Try to click toggle button again to reopen
      console.log('🔍 Clicking toggle button to reopen sidebar...');
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      // Take screenshot after reopening
      await page.screenshot({ path: 'sidebar-test-after-reopen.png' });
      console.log('📸 After reopen screenshot taken');
      
      // Check sidebar state after reopening
      const sidebarAfterReopen = await page.isVisible('aside');
      console.log(`🔍 Sidebar visibility after reopen: ${sidebarAfterReopen}`);
      
      const sidebarWidthAfterReopen = await page.evaluate(() => {
        const sidebar = document.querySelector('aside');
        if (sidebar) {
          const styles = window.getComputedStyle(sidebar);
          return {
            width: styles.width,
            transform: styles.transform,
            display: styles.display,
            visibility: styles.visibility
          };
        }
        return null;
      });
      
      console.log('🔍 Sidebar styles after reopen:', sidebarWidthAfterReopen);
      
    } else {
      console.log('❌ Toggle button not found - sidebar may not be rendered');
    }
    
    // Check console logs for any errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('🔍 Browser console error:', msg.text());
      } else if (msg.text().includes('🔍 [UnifiedSidebar]')) {
        console.log('🔍 Sidebar log:', msg.text());
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testSidebarIssue().catch(console.error);