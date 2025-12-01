// Debug Authentication Flow Test
// More detailed analysis of what's happening during login

const puppeteer = require('puppeteer');

async function debugAuthFlow() {
  console.log('🔍 Starting Authentication Flow Debug...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', (msg) => {
    console.log(`🖥️ [Browser Console] ${msg.type()}: ${msg.text()}`);
  });
  
  // Enable request/response logging
  page.on('request', (request) => {
    if (request.url().includes('supabase') || request.url().includes('auth')) {
      console.log(`🌐 [Request] ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', (response) => {
    if (response.url().includes('supabase') || response.url().includes('auth')) {
      console.log(`📡 [Response] ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('📍 Step 1: Navigate to login page...');
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    console.log('📍 Step 2: Fill and submit login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'testuser1000@verotrade.com');
    await page.type('input[type="password"]', 'Test123456!');
    
    console.log('📍 Step 3: Submit login and monitor redirects...');
    
    // Monitor navigation events
    let navigationCount = 0;
    page.on('framenavigated', (frame) => {
      navigationCount++;
      console.log(`🧭 Navigation ${navigationCount}: Frame navigated to ${frame.url()}`);
    });
    
    // Submit login
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    
    console.log('📍 Step 4: Check current URL and page state...');
    const currentUrl = page.url();
    const pageTitle = await page.title();
    
    console.log(`📍 Current URL after login: ${currentUrl}`);
    console.log(`📍 Page title: ${pageTitle}`);
    
    // Wait a bit more to see if auth state settles
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalUrl = page.url();
    const finalTitle = await page.title();
    
    console.log(`📍 Final URL after 5 seconds: ${finalUrl}`);
    console.log(`📍 Final page title: ${finalTitle}`);
    
    // Check if we're on dashboard
    if (finalUrl.includes('/dashboard')) {
      console.log('✅ Successfully reached dashboard!');
      
      // Wait for dashboard content
      try {
        await page.waitForFunction(() => {
          const h1 = document.querySelector('h1');
          return h1 && h1.textContent && h1.textContent.includes('Trading Dashboard');
        }, { timeout: 10000 });
        
        console.log('✅ Dashboard title found');
        
        // Measure dashboard load time
        const dashboardStartTime = Date.now();
        await page.waitForSelector('[style*="backgroundColor: #1c1c1c"]', { timeout: 10000 });
        const dashboardLoadTime = Date.now() - dashboardStartTime;
        
        console.log(`📊 Dashboard Load Time: ${dashboardLoadTime}ms`);
        console.log(`🎯 Target: <3000ms | Status: ${dashboardLoadTime < 3000 ? 'PASS' : 'FAIL'}`);
        
      } catch (error) {
        console.log('❌ Dashboard content not found:', error.message);
      }
    } else {
      console.log('❌ Failed to reach dashboard, still on:', finalUrl);
      
      // Check for error messages
      try {
        const errorElement = await page.$('.error-message');
        if (errorElement) {
          const errorText = await errorElement.evaluate(el => el.textContent, errorElement);
          console.log(`🚨 Error message found: ${errorText}`);
        }
      } catch (e) {
        // No error message found
      }
    }
    
    // Take screenshot
    const screenshotPath = `auth-debug-screenshot-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the debug test
debugAuthFlow()
  .then(() => {
    console.log('\n✅ Authentication Flow Debug Completed');
  })
  .catch((error) => {
    console.error('❌ Debug test execution failed:', error);
  });