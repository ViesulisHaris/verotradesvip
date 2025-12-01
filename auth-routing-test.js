/**
 * AUTHENTICATION ROUTING TEST
 * Tests that unauthenticated users are automatically redirected from home page to login
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testAuthRouting() {
  console.log('🧪 Starting authentication routing test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', (msg) => {
      console.log('📝 Browser Console:', msg.text());
    });
    
    page.on('pageerror', (error) => {
      console.error('🚨 Browser Page Error:', error.message);
    });
    
    // Test 1: Navigate to home page without authentication
    console.log('\n📍 Test 1: Navigate to http://localhost:3000 without authentication');
    
    // Clear any existing authentication data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Navigate to home page
    const response = await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    console.log('📊 Initial navigation response:', response.status());
    
    // Wait for either redirect to login or home page content
    await page.waitForTimeout(3000); // Give time for auth initialization and redirect
    
    // Check current URL
    const currentUrl = page.url();
    console.log('🔍 Current URL after navigation:', currentUrl);
    
    // Test 2: Check if redirected to login
    console.log('\n📍 Test 2: Check if redirected to login page');
    
    if (currentUrl.includes('/login')) {
      console.log('✅ SUCCESS: Automatically redirected to login page');
      
      // Verify login page is loaded
      const loginContent = await page.$('button[type="submit"], form');
      if (loginContent) {
        console.log('✅ SUCCESS: Login page content is loaded');
      } else {
        console.log('⚠️  WARNING: Redirected to login but content may not be fully loaded');
      }
    } else if (currentUrl.includes('localhost:3000/')) {
      console.log('❌ FAILURE: Still on home page - redirect did not work');
      
      // Check for loader or home page content
      const loaderElement = await page.$('div[style*="animation: spin"]');
      const homeContent = await page.$('button:has-text("Login"), button:has-text("Register")');
      
      if (loaderElement) {
        console.log('❌ FAILURE: Still showing loader instead of redirecting');
      } else if (homeContent) {
        console.log('❌ FAILURE: Showing home page content instead of redirecting');
      } else {
        console.log('❌ FAILURE: Unknown page state');
      }
    } else {
      console.log('❓ UNKNOWN: Redirected to unexpected URL:', currentUrl);
    }
    
    // Test 3: Check console logs for auth routing messages
    console.log('\n📍 Test 3: Analyze authentication routing logs');
    
    // Get console logs
    const logs = await page.evaluate(() => {
      return window.consoleLogs || [];
    });
    
    const authRoutingLogs = logs.filter(log => 
      log.includes('AUTH_ROUTING_FIX') || 
      log.includes('AUTH_GUARD_FIX') ||
      log.includes('Redirecting to login')
    );
    
    if (authRoutingLogs.length > 0) {
      console.log('✅ SUCCESS: Found authentication routing logs:');
      authRoutingLogs.forEach(log => console.log('   📝', log));
    } else {
      console.log('⚠️  WARNING: No authentication routing logs found');
    }
    
    // Test 4: Test manual navigation to login works
    console.log('\n📍 Test 4: Verify manual navigation to login still works');
    
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    const loginUrl = page.url();
    if (loginUrl.includes('/login')) {
      console.log('✅ SUCCESS: Manual navigation to login works');
    } else {
      console.log('❌ FAILURE: Manual navigation to login failed');
    }
    
    // Final assessment
    console.log('\n📋 FINAL ASSESSMENT:');
    console.log('==================');
    
    if (currentUrl.includes('/login')) {
      console.log('✅ AUTHENTICATION ROUTING FIX SUCCESSFUL');
      console.log('   - Unauthenticated users are automatically redirected from / to /login');
      console.log('   - No more need to manually add /login to the URL');
      console.log('   - Authentication routing works correctly');
    } else {
      console.log('❌ AUTHENTICATION ROUTING FIX FAILED');
      console.log('   - Users are still not being redirected from home page to login');
      console.log('   - Manual navigation to /login is still required');
      console.log('   - Further investigation needed');
    }
    
  } catch (error) {
    console.error('🚨 Test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthRouting().catch(console.error);