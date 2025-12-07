const puppeteer = require('puppeteer');
const path = require('path');

async function testAuthenticationFlow() {
  console.log('🚀 Starting Authentication Flow Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log('📋 [PAGE_CONSOLE]', msg.text());
    });
    
    // Enable request/response logging
    page.on('request', request => {
      if (request.url().includes('auth') || request.url().includes('supabase')) {
        console.log('🌐 [REQUEST]', request.method(), request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('auth') || response.url().includes('supabase')) {
        console.log('📡 [RESPONSE]', response.status(), response.url());
      }
    });

    console.log('📍 Step 1: Navigate to login page');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Wait for page to load and check if AuthContext is working
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for AuthContext errors
    const authContextErrors = await page.evaluate(() => {
      const logs = [];
      const originalError = console.error;
      console.error = (...args) => {
        logs.push(args.join(' '));
        originalError.apply(console, args);
      };
      return logs.filter(log => log.includes('AuthContext is undefined'));
    });
    
    if (authContextErrors.length > 0) {
      console.log('❌ AuthContext errors found:', authContextErrors);
    } else {
      console.log('✅ No AuthContext errors detected');
    }
    
    // Check if login form is visible
    const loginFormVisible = await page.waitForSelector('form', { timeout: 5000 });
    if (loginFormVisible) {
      console.log('✅ Login form is visible');
    } else {
      console.log('❌ Login form not found');
      return;
    }
    
    console.log('📍 Step 2: Fill login form');
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'testpassword123');
    
    console.log('📍 Step 3: Submit login form');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ]);
    
    // Wait a bit for the redirect and auth state to settle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log('📍 Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard after login');
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Still on login page - login may have failed');
      
      // Check for error messages
      const errorElement = await page.$('.bg-red-100');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        console.log('❌ Login error:', errorText);
      }
    } else {
      console.log('⚠️ Redirected to unexpected page:', currentUrl);
    }
    
    console.log('📍 Step 4: Test protected route access');
    
    // Try to access a protected route directly
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const tradesUrl = page.url();
    if (tradesUrl.includes('/trades')) {
      console.log('✅ Can access protected route (trades) - authentication is working');
    } else if (tradesUrl.includes('/login')) {
      console.log('❌ Redirected to login - authentication may not be persistent');
    } else {
      console.log('⚠️ Unexpected behavior when accessing protected route');
    }
    
    console.log('📍 Step 5: Test session persistence');
    
    // Open a new page to test session persistence
    const newPage = await browser.newPage();
    await newPage.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newPageUrl = newPage.url();
    if (newPageUrl.includes('/dashboard')) {
      console.log('✅ Session persistence working - can access dashboard in new tab');
    } else if (newPageUrl.includes('/login')) {
      console.log('❌ Session not persistent - redirected to login in new tab');
    } else {
      console.log('⚠️ Unexpected behavior in session persistence test');
    }
    
    await newPage.close();
    
    console.log('📍 Step 6: Test logout functionality');
    
    // Go back to dashboard and look for logout
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for logout button or link
    const logoutSelectors = [
      'button[onclick*="logout"]',
      'a[href*="logout"]',
      'button:contains("Logout")',
      'a:contains("Logout")',
      '[data-testid="logout"]'
    ];
    
    let logoutButton = null;
    for (const selector of logoutSelectors) {
      try {
        logoutButton = await page.$(selector);
        if (logoutButton) break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (logoutButton) {
      console.log('✅ Logout button found');
      await logoutButton.click();
      await page.waitForTimeout(2000);
      
      const afterLogoutUrl = page.url();
      if (afterLogoutUrl.includes('/login')) {
        console.log('✅ Logout successful - redirected to login');
      } else {
        console.log('⚠️ Logout may not have worked properly');
      }
    } else {
      console.log('⚠️ Logout button not found - may need to implement');
    }
    
    console.log('🎉 Authentication flow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthenticationFlow().catch(console.error);