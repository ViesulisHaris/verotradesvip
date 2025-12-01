const puppeteer = require('puppeteer');
const path = require('path');

async function takeLoginScreenshot() {
  let browser;
  try {
    // Launch browser with necessary arguments
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport to a common desktop size
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to the login page with timeout
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle2',
      timeout: 30000 // 30 seconds timeout
    });
    
    // Wait for the page to be fully loaded using a working alternative
    try {
      // Try to wait for a form element to be present
      await page.waitForSelector('form', { timeout: 10000 });
    } catch (err) {
      // If selector not found, use setTimeout as fallback
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds
    }
    
    // Take a screenshot
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
      await browser.close();
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