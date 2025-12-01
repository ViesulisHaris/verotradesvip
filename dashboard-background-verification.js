const puppeteer = require('puppeteer');
const path = require('path');

async function verifyDashboardBackgrounds() {
  console.log('Starting dashboard background verification...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the dashboard page
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for the page to load completely
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we need to login first
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('Redirected to login page, attempting to login...');
      
      // Fill in login credentials
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Navigate to dashboard again
      await page.goto('http://localhost:3000/dashboard');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Get all dashboard card elements with multiple selectors
    const dashboardCards = await page.$$('[class*="group"][class*="relative"][class*="rounded-xl"]');
    
    // If still no cards, try more specific selectors
    if (dashboardCards.length === 0) {
      console.log('Trying alternative selectors...');
      const altCards = await page.$$('.shadow-2xl');
      console.log(`Found ${altCards.length} cards with shadow-2xl selector`);
      
      // Try one more selector
      const moreCards = await page.$$('[class*="overflow-hidden"][class*="rounded-xl"]');
      console.log(`Found ${moreCards.length} cards with overflow-hidden rounded-xl selector`);
    }
    
    console.log(`Found ${dashboardCards.length} dashboard cards`);
    
    // Test each card for background transparency
    for (let i = 0; i < dashboardCards.length; i++) {
      const card = dashboardCards[i];
      
      // Get computed background style
      const backgroundStyle = await page.evaluate((el) => {
        return window.getComputedStyle(el).background;
      }, card);
      
      // Get computed background color
      const backgroundColor = await page.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      }, card);
      
      // Check if card has transparent background
      const isTransparent = backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent';
      
      // Get card title to identify which card this is
      const cardTitle = await page.evaluate((el) => {
        const titleElement = el.querySelector('h3');
        return titleElement ? titleElement.textContent.trim() : 'Unknown Card';
      }, card);
      
      console.log(`\nCard ${i + 1}: ${cardTitle}`);
      console.log(`Background Style: ${backgroundStyle}`);
      console.log(`Background Color: ${backgroundColor}`);
      console.log(`Is Transparent: ${isTransparent}`);
      
      // Check for background patterns (SVG data URLs)
      const hasBackgroundPattern = backgroundStyle.includes('data:image/svg+xml');
      console.log(`Has Background Pattern: ${hasBackgroundPattern}`);
      
      if (!isTransparent || hasBackgroundPattern) {
        console.log(`⚠️  ISSUE: ${cardTitle} still has background issues`);
      } else {
        console.log(`✅ OK: ${cardTitle} has transparent background`);
      }
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: 'dashboard-background-verification.png', 
      fullPage: true 
    });
    
    console.log('\nScreenshot saved as dashboard-background-verification.png');
    
    // Test the Balatro background visibility
    const balatroBackground = await page.$('#balatro-background');
    if (balatroBackground) {
      const isVisible = await page.evaluate((el) => {
        return el && window.getComputedStyle(el).display !== 'none';
      }, balatroBackground);
      console.log(`\nBalatro Background Visible: ${isVisible}`);
    }
    
    // Test overall page background
    const pageBackground = await page.evaluate(() => {
      return window.getComputedStyle(document.body).background;
    });
    console.log(`Page Background: ${pageBackground}`);
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
}

// Run the verification
verifyDashboardBackgrounds().then(() => {
  console.log('\nDashboard background verification completed.');
}).catch(error => {
  console.error('Verification failed:', error);
});