const puppeteer = require('puppeteer');
const path = require('path');

async function testHomePageDisplay() {
  console.log('🔍 Testing home page display...');
  
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
  
  // Wait for authentication to initialize
  await page.waitForTimeout(3000);
  
  // Check if home page content is visible
  const homePageState = await page.evaluate(() => {
    const homeTitle = document.querySelector('h1');
    const homeContent = document.querySelector('.main-container');
    const loadingSpinner = document.querySelector('div[style*="animation: spin"]');
    
    return {
      homeTitleVisible: !!homeTitle,
      homeTitleText: homeTitle ? homeTitle.textContent : null,
      homeContentVisible: !!homeContent,
      loadingSpinnerVisible: !!loadingSpinner,
      backgroundColor: window.getComputedStyle(document.body).backgroundColor,
      textColor: window.getComputedStyle(document.body).color
    };
  });
  
  console.log('Home page state:', homePageState);
  
  // Take a screenshot
  await page.screenshot({ 
    path: path.join(__dirname, 'home-page-test-result.png'),
    fullPage: true
  });
  
  await browser.close();
  
  return homePageState;
}

testHomePageDisplay().then(result => {
  console.log('\n=== TEST RESULTS ===');
  console.log(`Home title visible: ${result.homeTitleVisible}`);
  console.log(`Home title text: ${result.homeTitleText}`);
  console.log(`Home content visible: ${result.homeContentVisible}`);
  console.log(`Loading spinner visible: ${result.loadingSpinnerVisible}`);
  console.log(`Background color: ${result.backgroundColor}`);
  console.log(`Text color: ${result.textColor}`);
  
  const success = result.homeTitleVisible && !result.loadingSpinnerVisible;
  console.log(`\nTest ${success ? 'PASSED' : 'FAILED'}: Home page ${success ? 'is displaying correctly' : 'is not displaying correctly'}`);
}).catch(console.error);