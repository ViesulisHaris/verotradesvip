const puppeteer = require('puppeteer');
const path = require('path');

async function testAuthInitialization() {
  console.log('🔍 Testing AuthContext initialization...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  // Enable console log monitoring
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.text()}`);
  });
  
  // Navigate to home page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Wait for a moment to see if AuthContext initializes
  await page.waitForTimeout(3000);
  
  // Check if we're still seeing the loading spinner
  const isLoading = await page.evaluate(() => {
    const loadingElement = document.querySelector('div[style*="animation: spin"]');
    return !!loadingElement;
  });
  
  console.log(`Loading spinner present: ${isLoading}`);
  
  // Check if home page content is visible
  const homeContentVisible = await page.evaluate(() => {
    const homeTitle = document.querySelector('h1');
    return homeTitle && homeTitle.textContent.includes('VeroTrade');
  });
  
  console.log(`Home page content visible: ${homeContentVisible}`);
  
  // Take a screenshot
  await page.screenshot({ 
    path: path.join(__dirname, 'auth-test-result.png'),
    fullPage: true
  });
  
  await browser.close();
  
  console.log(`Test completed. Loading spinner: ${isLoading}, Home content visible: ${homeContentVisible}`);
  
  return {
    loadingSpinner: isLoading,
    homeContentVisible: homeContentVisible
  };
}

testAuthInitialization().catch(console.error);