const puppeteer = require('puppeteer');
const { expect } = require('chai');

describe('Navigation Test', function() {
  this.timeout(60000); // Increase timeout for navigation tests
  
  let browser;
  let page;
  
  before(async function() {
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--start-maximized']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });
  
  after(async function() {
    await browser.close();
  });
  
  it('should navigate to all pages and verify top navigation is present', async function() {
    // List of pages to test
    const pagesToTest = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Trades', path: '/trades' },
      { name: 'Log Trade', path: '/log-trade' },
      { name: 'Calendar', path: '/calendar' },
      { name: 'Strategies', path: '/strategies' },
      { name: 'Confluence', path: '/confluence' },
      { name: 'Settings', path: '/settings' }
    ];
    
    // Start with the dashboard
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for page to load
    await page.waitForSelector('.verotrade-top-navigation', { visible: true, timeout: 10000 });
    
    // Test navigation to each page
    for (const pageInfo of pagesToTest) {
      console.log(`Testing navigation to ${pageInfo.name} page...`);
      
      // Navigate to the page
      await page.goto(`http://localhost:3000${pageInfo.path}`);
      
      // Wait for page to load
      await page.waitForSelector('.verotrade-top-navigation', { visible: true, timeout: 10000 });
      
      // Verify top navigation is present
      const topNavigationExists = await page.$('.verotrade-top-navigation') !== null;
      expect(topNavigationExists).to.be.true;
      
      // Verify navigation items are present
      const navItems = await page.$$eval('.verotrade-top-navigation a', elements => 
        elements.map(el => el.getAttribute('href'))
      );
      
      // Check that all expected navigation links are present
      const expectedPaths = pagesToTest.map(p => p.path);
      for (const expectedPath of expectedPaths) {
        expect(navItems).to.include(expectedPath);
      }
      
      console.log(`✓ Successfully verified navigation to ${pageInfo.name} page`);
    }
    
    console.log('✓ All navigation tests passed!');
  });
  
  it('should be able to navigate between pages using top navigation', async function() {
    // Start with the dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForSelector('.verotrade-top-navigation', { visible: true, timeout: 10000 });
    
    // Test navigation from dashboard to each page and back
    const pagesToTest = [
      { name: 'Trades', path: '/trades' },
      { name: 'Log Trade', path: '/log-trade' },
      { name: 'Calendar', path: '/calendar' },
      { name: 'Strategies', path: '/strategies' },
      { name: 'Confluence', path: '/confluence' },
      { name: 'Settings', path: '/settings' }
    ];
    
    for (const pageInfo of pagesToTest) {
      console.log(`Testing navigation from Dashboard to ${pageInfo.name} and back...`);
      
      // Navigate to the page
      await page.click(`.verotrade-top-navigation a[href="${pageInfo.path}"]`);
      
      // Wait for page to load
      await page.waitForSelector('.verotrade-top-navigation', { visible: true, timeout: 10000 });
      
      // Verify we're on the correct page by checking URL
      const currentUrl = page.url();
      expect(currentUrl).to.include(pageInfo.path);
      
      // Navigate back to dashboard
      await page.click('.verotrade-top-navigation a[href="/dashboard"]');
      
      // Wait for page to load
      await page.waitForSelector('.verotrade-top-navigation', { visible: true, timeout: 10000 });
      
      // Verify we're back on the dashboard
      const dashboardUrl = page.url();
      expect(dashboardUrl).to.include('/dashboard');
      
      console.log(`✓ Successfully navigated to ${pageInfo.name} and back to Dashboard`);
    }
    
    console.log('✓ All inter-page navigation tests passed!');
  });
});