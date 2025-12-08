const puppeteer = require('puppeteer');

async function testSimpleDashboard() {
  console.log('🧪 Starting simple dashboard test...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('📝 Browser Console:', msg.type(), msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.error('🚨 Page Error:', error.message);
  });
  
  // Enable request/response logging for module resolution issues
  page.on('requestfailed', request => {
    console.error('❌ Request Failed:', request.url(), request.failure().errorText);
  });
  
  try {
    console.log('🌐 Navigating to simple dashboard...');
    await page.goto('http://localhost:3000/dashboard-simple', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Simple dashboard page loaded successfully');
    
    // Wait for key elements to render
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✅ Page header loaded');
    
    // Check for dashboard metrics
    const metricCards = await page.$$('p');
    console.log(`📈 Found ${metricCards.length} paragraph elements`);
    
    // Check for table
    const tableElement = await page.$('table');
    if (tableElement) {
      console.log('✅ Table element found');
    } else {
      console.log('⚠️ Table element not found');
    }
    
    // Check for status indicators
    const statusElements = await page.$$('.text-green-500, .text-red-500');
    console.log(`📊 Found ${statusElements.length} status indicators`);
    
    // Take a screenshot for verification
    await page.screenshot({ 
      path: 'simple-dashboard-test-success.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved as simple-dashboard-test-success.png');
    
    // Test responsive design by resizing
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(2000);
    console.log('📱 Tablet layout tested');
    
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    console.log('📱 Mobile layout tested');
    
    console.log('✅ Simple dashboard test completed successfully!');
    
  } catch (error) {
    console.error('❌ Simple dashboard test failed:', error.message);
    
    // Take screenshot of error state
    try {
      await page.screenshot({ 
        path: 'simple-dashboard-test-error.png',
        fullPage: true 
      });
      console.log('📸 Error screenshot saved as simple-dashboard-test-error.png');
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
  }
}

// Run the test
testSimpleDashboard().catch(console.error);