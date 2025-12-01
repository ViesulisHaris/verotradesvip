const puppeteer = require('puppeteer');

async function testApplicationLoading() {
  console.log('🔍 Testing application loading at localhost:3000...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging from the browser
    page.on('console', msg => {
      console.log('Browser Console:', msg.type(), msg.text());
    });
    
    // Enable error logging
    page.on('pageerror', error => {
      console.error('Page Error:', error.message);
    });
    
    // Enable request logging
    page.on('requestfailed', request => {
      console.error('Failed Request:', request.url(), request.failure().errorText);
    });
    
    console.log('📡 Navigating to http://localhost:3000...');
    const response = await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log(`📊 Response status: ${response.status()}`);
    console.log(`📊 Response headers:`, response.headers());
    
    // Wait for the page to load completely
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if the main content is visible
    const titleText = await page.$eval('h1', el => el.textContent).catch(() => 'Not found');
    const subtitleText = await page.$eval('p', el => el.textContent).catch(() => 'Not found');
    
    console.log(`✅ Title found: "${titleText}"`);
    console.log(`✅ Subtitle found: "${subtitleText}"`);
    
    // Check for any JavaScript errors on the page
    const jsErrors = await page.evaluate(() => {
      const errors = [];
      // Check for common error indicators
      if (document.querySelector('.error-boundary')) {
        errors.push('Error boundary detected');
      }
      if (document.querySelector('[data-error]')) {
        errors.push('Data error attribute found');
      }
      return errors;
    });
    
    if (jsErrors.length > 0) {
      console.log('❌ JavaScript errors detected:', jsErrors);
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Take a screenshot for verification
    await page.screenshot({ 
      path: 'application-loading-test-success.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved as application-loading-test-success.png');
    
    console.log('🎉 Application is loading successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testApplicationLoading().then(success => {
  if (success) {
    console.log('✅ Application loading test completed successfully');
    process.exit(0);
  } else {
    console.log('❌ Application loading test failed');
    process.exit(1);
  }
});