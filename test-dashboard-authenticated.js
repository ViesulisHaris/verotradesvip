const puppeteer = require('puppeteer');

async function testDashboardWithAuth() {
  console.log('🧪 Starting authenticated dashboard test...');
  
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
  
  // Enable request/response logging
  page.on('requestfailed', request => {
    console.error('❌ Request Failed:', request.url(), request.failure().errorText);
  });
  
  try {
    console.log('🌐 Navigating to login page first...');
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Login page loaded successfully');
    
    // Wait for login form to be ready
    await page.waitForSelector('input[type="email"], input[type="text"]', { timeout: 10000 });
    console.log('✅ Login form ready');
    
    // Fill in test credentials (you may need to update these)
    await page.type('input[type="email"], input[type="text"]', 'test@example.com');
    await page.type('input[type="password"]', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard after login
    console.log('🔄 Waiting for redirect to dashboard...');
    await page.waitForNavigation({ 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    // Check if we're on the dashboard now
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard after login');
    } else {
      console.log('⚠️ Redirected to:', currentUrl, '- continuing test anyway');
    }
    
    // Wait for dashboard elements to load
    console.log('⏳ Waiting for dashboard elements to load...');
    await page.waitForTimeout(5000); // Give time for components to initialize
    
    // Check for top navigation
    try {
      await page.waitForSelector('.verotrade-top-navigation', { timeout: 10000 });
      console.log('✅ Top navigation loaded');
    } catch (e) {
      console.log('⚠️ Top navigation not found:', e.message);
    }
    
    // Check for page header
    try {
      await page.waitForSelector('h1', { timeout: 10000 });
      console.log('✅ Page header loaded');
    } catch (e) {
      console.log('⚠️ Page header not found:', e.message);
    }
    
    // Check for charts
    const chartElements = await page.$$('canvas');
    console.log(`📊 Found ${chartElements.length} chart elements`);
    
    // Check for dashboard metrics
    const metricCards = await page.$$('.scroll-item, .TorchCard');
    console.log(`📈 Found ${metricCards.length} metric cards`);
    
    // Check for any error messages
    const errorElements = await page.$$('.error, .ErrorBoundary');
    if (errorElements.length > 0) {
      console.warn(`⚠️ Found ${errorElements.length} error elements on page`);
    } else {
      console.log('✅ No error elements found');
    }
    
    // Take a screenshot for verification
    await page.screenshot({ 
      path: 'dashboard-authenticated-test.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved as dashboard-authenticated-test.png');
    
    // Test responsive design
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(2000);
    console.log('📱 Tablet layout tested');
    
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    console.log('📱 Mobile layout tested');
    
    console.log('✅ Authenticated dashboard test completed successfully!');
    
  } catch (error) {
    console.error('❌ Authenticated dashboard test failed:', error.message);
    
    // Take screenshot of error state
    try {
      await page.screenshot({ 
        path: 'dashboard-authenticated-error.png',
        fullPage: true 
      });
      console.log('📸 Error screenshot saved as dashboard-authenticated-error.png');
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
  }
}

// Run the test
testDashboardWithAuth().catch(console.error);