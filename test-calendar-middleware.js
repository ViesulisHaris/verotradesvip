const { chromium } = require('playwright');

async function testCalendarMiddleware() {
  console.log('🧪 Testing calendar middleware protection...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  try {
    // Test 1: Direct access to /calendar without authentication
    console.log('\n📋 Test 1: Direct access to /calendar without authentication');
    const page1 = await context.newPage();
    
    // Listen for console logs from the page
    page1.on('console', msg => {
      if (msg.text().includes('[MIDDLEWARE]')) {
        console.log('🔍 Browser Console:', msg.text());
      }
    });
    
    const response1 = await page1.goto('http://localhost:3000/calendar', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    console.log(`Response status: ${response1.status()}`);
    console.log(`Current URL after navigation: ${page1.url()}`);
    
    // Check if we were redirected to login
    if (page1.url().includes('/login')) {
      console.log('✅ SUCCESS: /calendar correctly redirected to login');
    } else if (page1.url().includes('/calendar')) {
      console.log('❌ FAILURE: /calendar did not redirect to login - middleware not working');
      
      // Take a screenshot for debugging
      await page1.screenshot({ path: 'calendar-middleware-test-failure.png' });
      console.log('📸 Screenshot saved as calendar-middleware-test-failure.png');
    } else {
      console.log(`⚠️ UNEXPECTED: Redirected to ${page1.url()} instead of login`);
    }
    
    await page1.close();
    
    // Test 2: Compare with a known protected route (e.g., /dashboard)
    console.log('\n📋 Test 2: Comparing with /dashboard (known protected route)');
    const page2 = await context.newPage();
    
    page2.on('console', msg => {
      if (msg.text().includes('[MIDDLEWARE]')) {
        console.log('🔍 Browser Console (Dashboard):', msg.text());
      }
    });
    
    const response2 = await page2.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    console.log(`Response status: ${response2.status()}`);
    console.log(`Current URL after navigation: ${page2.url()}`);
    
    if (page2.url().includes('/login')) {
      console.log('✅ SUCCESS: /dashboard correctly redirected to login');
    } else {
      console.log('❌ FAILURE: /dashboard did not redirect to login');
    }
    
    await page2.close();
    
    // Test 3: Compare with a known public route (e.g., /)
    console.log('\n📋 Test 3: Comparing with / (known public route)');
    const page3 = await context.newPage();
    
    page3.on('console', msg => {
      if (msg.text().includes('[MIDDLEWARE]')) {
        console.log('🔍 Browser Console (Home):', msg.text());
      }
    });
    
    const response3 = await page3.goto('http://localhost:3000/', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    console.log(`Response status: ${response3.status()}`);
    console.log(`Current URL after navigation: ${page3.url()}`);
    
    if (page3.url().includes('/login')) {
      console.log('❌ FAILURE: / incorrectly redirected to login');
    } else {
      console.log('✅ SUCCESS: / correctly accessible without authentication');
    }
    
    await page3.close();
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

// Check if the dev server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if dev server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('❌ Dev server is not running on http://localhost:3000');
    console.log('Please start the dev server with: npm run dev');
    process.exit(1);
  }
  
  await testCalendarMiddleware();
}

main().catch(console.error);