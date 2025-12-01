const puppeteer = require('puppeteer');
const path = require('path');

async function takeLoginScreenshot() {
  let browser;
  try {
    console.log('Step 1: Launching browser...');
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('Browser launched successfully');
    
    console.log('Step 2: Creating new page...');
    const page = await browser.newPage();
    console.log('New page created successfully');
    
    // Set viewport to a common desktop size
    console.log('Step 3: Setting viewport...');
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('Viewport set successfully');
    
    // Navigate to the login page
    console.log('Step 4: Navigating to login page...');
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 // 30 seconds timeout
    });
    console.log('Navigation completed');
    
    // Wait for the page to be fully loaded
    console.log('Step 5: Waiting for page to fully load...');
    try {
      // Try different waiting strategies
      await page.waitForSelector('form', { timeout: 10000 });
      console.log('Form element found');
    } catch (err) {
      console.log('Form selector not found, waiting for timeout instead...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds
    }
    
    // Check page title to confirm we're on the right page
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Take a screenshot
    console.log('Step 6: Taking screenshot...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(__dirname, `login-page-current-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    return screenshotPath;
  } catch (error) {
    console.error('Error in takeLoginScreenshot:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
      console.log('Browser closed');
    }
  }
}

takeLoginScreenshot()
  .then(result => {
    console.log('Script completed successfully:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });