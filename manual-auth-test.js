const puppeteer = require('puppeteer');

async function testManualLogin() {
  console.log('Starting manual authentication test...');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    page.setDefaultTimeout(30000);
    
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot before login
    await page.screenshot({ path: './manual-login-before.png', fullPage: true });
    console.log('Screenshot saved: manual-login-before.png');
    
    // Fill in the form
    console.log('Filling in login form...');
    await page.type('input[type="email"]', 'testuser1000@verotrade.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot of filled form
    await page.screenshot({ path: './manual-login-filled.png', fullPage: true });
    console.log('Screenshot saved: manual-login-filled.png');
    
    // Submit the form
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      console.log('Navigation detected, checking current URL...');
    } catch (e) {
      console.log('Navigation timeout or error:', e.message);
    }
    
    // Wait a bit more for any error messages to appear
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take final screenshot
    await page.screenshot({ path: './manual-login-after.png', fullPage: true });
    console.log('Screenshot saved: manual-login-after.png');
    
    // Check current URL and page content
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check for any error messages
    const hasError = await page.evaluate(() => {
      const errorElement = document.querySelector('.error-message');
      return errorElement ? errorElement.textContent.trim() : null;
    });
    
    if (hasError) {
      console.log('Error message found:', hasError);
    } else {
      console.log('No error message found');
    }
    
    // Check if we're on dashboard
    const isOnDashboard = currentUrl.includes('/dashboard');
    console.log('Is on dashboard:', isOnDashboard);
    
    if (isOnDashboard) {
      // Look for sidebar
      const hasSidebar = await page.evaluate(() => {
        const sidebar = document.querySelector('nav, aside, .sidebar');
        return sidebar ? true : false;
      });
      console.log('Sidebar found:', hasSidebar);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testManualLogin();