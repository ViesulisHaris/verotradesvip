const { chromium } = require('playwright');

async function runAuthenticationDiagnostic() {
  console.log('🚀 Starting Authentication Diagnostic Test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test 1: Check if login page loads
    console.log('📋 Test 1: Checking login page accessibility...');
    await page.goto('http://localhost:3000/login');
    
    const loginTitle = await page.locator('h1').first().textContent();
    console.log(`✅ Login page loaded successfully: "${loginTitle}"`);

    // Test 2: Check environment variables (via API)
    console.log('\n📋 Test 2: Checking environment variables...');
    const envResponse = await page.request.get('http://localhost:3000/api/debug-env');
    if (envResponse.ok()) {
      const envData = await envResponse.json();
      console.log('✅ Environment variables check:', envData);
    } else {
      console.log('❌ Environment variables endpoint not accessible');
    }

    // Test 3: Attempt login with test credentials
    console.log('\n📋 Test 3: Testing login with test credentials...');
    
    // Fill in login form
    await page.fill('input[type="email"]', 'testuser@verotrade.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Capture network requests to see authentication flow
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('supabase.co') || request.url().includes('/api/')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });

    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for either successful redirect or error message
    await Promise.race([
      page.waitForURL('**/dashboard', { timeout: 10000 }),
      page.waitForSelector('.bg-red-600\\/20', { timeout: 10000 })
    ]);

    const currentUrl = page.url();
    console.log(`📍 Current URL after login attempt: ${currentUrl}`);

    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful - redirected to dashboard');
      
      // Test 4: Check if session persists
      console.log('\n📋 Test 4: Checking session persistence...');
      
      // Check for auth cookies
      const cookies = await context.cookies();
      const authCookies = cookies.filter(cookie => 
        cookie.name.includes('sb-') || 
        cookie.name.includes('supabase')
      );
      
      console.log(`🍪 Found ${authCookies.length} authentication cookies:`);
      authCookies.forEach(cookie => {
        console.log(`   - ${cookie.name}: ${cookie.value ? 'SET' : 'EMPTY'} (expires: ${new Date(cookie.expires * 1000).toISOString()})`);
      });

      // Test 5: Check if dashboard loads properly
      console.log('\n📋 Test 5: Checking dashboard functionality...');
      
      try {
        // Look for user-specific content
        const userContent = await page.locator('text=Welcome back').isVisible({ timeout: 5000 });
        if (userContent) {
          console.log('✅ Dashboard loaded with user content');
        } else {
          console.log('⚠️ Dashboard loaded but no user content found');
        }
      } catch (error) {
        console.log('❌ Dashboard failed to load properly:', error.message);
      }

      // Test 6: Try to access a protected route
      console.log('\n📋 Test 6: Testing protected route access...');
      
      await page.goto('http://localhost:3000/strategies');
      const strategiesUrl = page.url();
      
      if (strategiesUrl.includes('/strategies')) {
        console.log('✅ Successfully accessed protected strategies route');
      } else if (strategiesUrl.includes('/login')) {
        console.log('❌ Redirected to login - session not persisted');
      } else {
        console.log('⚠️ Unexpected redirect to:', strategiesUrl);
      }

    } else {
      console.log('❌ Login failed - not redirected to dashboard');
      
      // Check for error message
      const errorElement = await page.locator('.bg-red-600\\/20').first();
      if (await errorElement.isVisible()) {
        const errorMessage = await errorElement.textContent();
        console.log(`❌ Error message: "${errorMessage.trim()}"`);
      }
    }

    // Test 7: Check network requests
    console.log('\n📋 Test 7: Analyzing network requests...');
    console.log(`📡 Captured ${networkRequests.length} relevant network requests:`);
    
    const supabaseRequests = networkRequests.filter(req => req.url.includes('supabase.co'));
    supabaseRequests.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.method} ${req.url.split('?')[0]}`);
      if (req.url.includes('/auth/v1/token')) {
        console.log('      → Authentication token request');
      } else if (req.url.includes('/auth/v1/user')) {
        console.log('      → User information request');
      }
    });

    // Test 8: Check browser console for errors
    console.log('\n📋 Test 8: Checking for console errors...');
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console error: ${msg.text()}`);
      }
    });

    // Wait a bit to catch any console errors
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  } finally {
    await browser.close();
  }

  console.log('\n🏁 Authentication Diagnostic Test Complete');
}

// Run the test
runAuthenticationDiagnostic().catch(console.error);