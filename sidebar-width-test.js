const { chromium } = require('playwright');

(async () => {
  console.log('Starting sidebar width test...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Authenticate
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'testuser@verotrade.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    console.log('Login submitted, waiting...');
    await page.waitForTimeout(3000);
    
    // Check sidebar width
    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(2000);
    
    console.log('Checking sidebar width...');
    const sidebarWidth = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      return sidebar ? sidebar.offsetWidth : 'Sidebar not found';
    });
    console.log('Current sidebar width:', sidebarWidth);
    
    // Try to toggle
    console.log('Attempting to toggle sidebar...');
    await page.click('.sidebar-button');
    await page.waitForTimeout(500);
    
    const newSidebarWidth = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      return sidebar ? sidebar.offsetWidth : 'Sidebar not found';
    });
    console.log('After toggle sidebar width:', newSidebarWidth);
    
    // Check if collapsed
    const isCollapsed = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      return sidebar ? sidebar.classList.contains('sidebar-collapsed') : 'Sidebar not found';
    });
    console.log('Sidebar is collapsed:', isCollapsed);
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await browser.close();
  }
})();