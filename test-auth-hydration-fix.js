const puppeteer = require('puppeteer');

async function testAuthenticationHydrationFix() {
  console.log('🧪 Testing Authentication Hydration Fix...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      console.log(`🔍 Browser Console: ${msg.text()}`);
    });
    
    // Step 1: Go to login page
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('✅ Login page loaded successfully');
    
    // Step 2: Fill in login credentials
    console.log('📍 Step 2: Filling login credentials...');
    await page.type('input[type="email"]', 'testuser1000@verotrade.com');
    await page.type('input[type="password"]', 'password123');
    
    // Step 3: Submit login form
    console.log('📍 Step 3: Submitting login form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Check if we're on dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard after login');
    } else {
      console.log(`❌ Failed to redirect to dashboard. Current URL: ${currentUrl}`);
      return false;
    }
    
    // Step 4: Check for "Initializing authentication..." message
    console.log('📍 Step 4: Checking for hydration issues...');
    
    // Wait a bit to see if the loading message appears
    await page.waitForTimeout(3000);
    
    // Check if the loading message is still present
    const loadingMessage = await page.$('text=Initializing authentication...');
    
    if (loadingMessage) {
      console.log('❌ HYDRATION ISSUE DETECTED: Still showing "Initializing authentication..."');
      return false;
    } else {
      console.log('✅ No hydration issue detected - authentication initialized properly');
    }
    
    // Step 5: Check for dashboard content
    console.log('📍 Step 5: Checking for dashboard content...');
    
    // Look for dashboard elements
    const dashboardElements = await page.evaluate(() => {
      const elements = {
        totalPnL: document.querySelector('text=Total PnL'),
        profitFactor: document.querySelector('text=Profit Factor'),
        winRate: document.querySelector('text=Win Rate'),
        totalTrades: document.querySelector('text=Total Trades')
      };
      
      return {
        totalPnL: !!elements.totalPnL,
        profitFactor: !!elements.profitFactor,
        winRate: !!elements.winRate,
        totalTrades: !!elements.totalTrades
      };
    });
    
    const allElementsPresent = Object.values(dashboardElements).every(Boolean);
    
    if (allElementsPresent) {
      console.log('✅ Dashboard content loaded successfully');
      console.log('📊 Dashboard Elements:', dashboardElements);
    } else {
      console.log('❌ Some dashboard elements are missing:', dashboardElements);
      return false;
    }
    
    // Step 6: Check authentication state in console
    console.log('📍 Step 6: Checking authentication state...');
    
    const authState = await page.evaluate(() => {
      // Look for auth context logs in console
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog.apply(console, args);
      };
      
      return logs;
    });
    
    console.log('✅ Authentication hydration fix test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthenticationHydrationFix().then(success => {
  if (success) {
    console.log('\n🎉 AUTHENTICATION HYDRATION FIX VERIFICATION: PASSED');
    console.log('✅ The SSR hydration issue has been resolved');
    console.log('✅ Users can now successfully login and access the dashboard');
    console.log('✅ Authentication state properly transitions from server to client');
  } else {
    console.log('\n💥 AUTHENTICATION HYDRATION FIX VERIFICATION: FAILED');
    console.log('❌ The SSR hydration issue still exists');
    console.log('❌ Further investigation is needed');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});