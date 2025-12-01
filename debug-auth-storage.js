const { chromium } = require('playwright');

async function debugAuthStorage() {
  let browser;
  let page;
  
  try {
    console.log('🔍 Starting authentication storage debug...');
    
    // Launch browser
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000
    });
    
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Set viewport and timeout
    await page.setViewportSize({ width: 1280, height: 720 });
    page.setDefaultTimeout(30000);
    
    // Navigate to login page
    console.log('🔍 Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Fill in login form
    console.log('🔍 Filling login credentials...');
    await page.fill('input[type="email"]', 'testuser@verotrade.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Click login button
    console.log('🔍 Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ timeout: 30000 });
    
    // Verify successful login
    const currentUrl = page.url();
    console.log(`🔍 Post-login URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/trades')) {
      console.log('✅ Successfully authenticated');
    } else {
      console.log('❌ Authentication failed');
      return;
    }
    
    // Wait a bit for authentication to be fully established
    await page.waitForTimeout(5000);
    
    // Debug localStorage contents
    console.log('🔍 Debugging localStorage contents...');
    const localStorageContents = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        storage[key] = value;
      }
      return storage;
    });
    
    console.log('🔍 localStorage contents:', JSON.stringify(localStorageContents, null, 2));
    
    // Debug sessionStorage contents
    console.log('🔍 Debugging sessionStorage contents...');
    const sessionStorageContents = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        storage[key] = value;
      }
      return storage;
    });
    
    console.log('🔍 sessionStorage contents:', JSON.stringify(sessionStorageContents, null, 2));
    
    // Debug cookies
    console.log('🔍 Debugging cookies...');
    const cookies = await context.cookies();
    console.log('🔍 Cookies:', JSON.stringify(cookies, null, 2));
    
    // Try to get Supabase session directly
    console.log('🔍 Attempting to get Supabase session...');
    const supabaseSession = await page.evaluate(async () => {
      try {
        // Import and use the Supabase client
        const { supabase } = await import('/supabase/client.js');
        const { data: { session } } = await supabase.auth.getSession();
        return {
          hasSession: !!session,
          session: session,
          user: session?.user,
          accessToken: session?.access_token
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('🔍 Supabase session result:', JSON.stringify(supabaseSession, null, 2));
    
    // Try making an authenticated API request directly
    console.log('🔍 Testing direct API request...');
    const apiTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/generate-test-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ action: 'verify-data' })
        });
        
        const data = await response.json();
        return {
          status: response.status,
          ok: response.ok,
          data: data
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });
    
    console.log('🔍 Direct API test result:', JSON.stringify(apiTest, null, 2));
    
    // Wait for user to see results
    console.log('🔍 Waiting 30 seconds before closing...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugAuthStorage().catch(console.error);