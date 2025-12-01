// AUTHENTICATION STATE DIAGNOSTIC
const puppeteer = require('puppeteer');

async function diagnoseAuthState() {
  console.log('🔍 AUTHENTICATION STATE DIAGNOSTIC');
  console.log('='.repeat(50));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from page
    page.on('console', msg => {
      console.log('🌐 BROWSER:', msg.text());
    });
    
    // Test 1: Check login page
    console.log('\n🔐 Testing Login Page:');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Wait for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const loginPageState = await page.evaluate(() => {
      // Check for form elements
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButton = document.querySelector('button[type="submit"]');
      
      // Check localStorage and sessionStorage
      const storage = {
        localStorage: {
          auth: localStorage.getItem('supabase.auth.token'),
          user: localStorage.getItem('supabase.auth.user'),
          allKeys: Object.keys(localStorage).filter(k => k.includes('supabase'))
        },
        sessionStorage: {
          auth: sessionStorage.getItem('supabase.auth.token'),
          user: sessionStorage.getItem('supabase.auth.user'),
          allKeys: Object.keys(sessionStorage).filter(k => k.includes('supabase'))
        }
      };
      
      return {
        hasLoginForm: !!(emailInput && passwordInput && submitButton),
        storage: storage,
        url: window.location.href
      };
    });
    
    console.log('Login form available:', loginPageState.hasLoginForm);
    console.log('Storage state:', JSON.stringify(loginPageState.storage, null, 2));
    
    // Test 2: Try to manually log in with test credentials
    console.log('\n🔑 Testing Manual Login:');
    
    const loginAttempt = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButton = document.querySelector('button[type="submit"]');
      
      if (emailInput && passwordInput && submitButton) {
        emailInput.value = 'test@example.com'; // Test email
        passwordInput.value = 'testpassword'; // Test password
        
        // Click submit button
        submitButton.click();
        
        return {
          attempted: true,
          emailFilled: emailInput.value,
          passwordFilled: !!passwordInput.value
        };
      }
      
      return { attempted: false };
    });
    
    console.log('Login attempt:', loginAttempt);
    
    // Wait for login to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test 3: Check dashboard after login attempt
    console.log('\n📊 Testing Dashboard After Login:');
    
    const dashboardState = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasSidebar: !!document.querySelector('.verotrade-sidebar-overlay'),
        hasTopNav: !!document.querySelector('.verotrade-persistent-top-nav'),
        hasMobileMenu: !!document.querySelector('.verotrade-mobile-menu-btn'),
        bodyText: document.body.innerText.substring(0, 200)
      };
    });
    
    console.log('After login - URL:', dashboardState.url);
    console.log('After login - Has sidebar:', dashboardState.hasSidebar);
    console.log('After login - Has top nav:', dashboardState.hasTopNav);
    console.log('After login - Has mobile menu:', dashboardState.hasMobileMenu);
    
    // Test 4: Check if there are any authentication errors
    console.log('\n❌ Checking for Authentication Errors:');
    
    const errorCheck = await page.evaluate(() => {
      // Look for error messages
      const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [role="alert"]');
      const errors = Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text);
      
      // Check console errors
      const consoleErrors = [];
      
      return {
        errorMessages: errors,
        hasErrors: errors.length > 0
      };
    });
    
    console.log('Authentication errors:', errorCheck.errorMessages);
    
    console.log('\n🎯 DIAGNOSTIC SUMMARY:');
    console.log('='.repeat(40));
    console.log('1. Login form available:', loginPageState.hasLoginForm ? '✅' : '❌');
    console.log('2. Login attempt made:', loginAttempt.attempted ? '✅' : '❌');
    console.log('3. Redirected from login:', !dashboardState.url.includes('/login') ? '✅' : '❌');
    console.log('4. Sidebar appears after login:', dashboardState.hasSidebar ? '✅' : '❌');
    console.log('5. Authentication errors present:', errorCheck.hasErrors ? '❌' : '✅');
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (!loginPageState.hasLoginForm) {
      console.log('- Login page may not be loading properly');
    }
    if (loginAttempt.attempted && dashboardState.url.includes('/login')) {
      console.log('- Login failed - check credentials or authentication flow');
    }
    if (dashboardState.hasSidebar && loginPageState.storage.localStorage.auth) {
      console.log('- Authentication appears to be working - sidebar should be visible');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  } finally {
    setTimeout(() => browser.close(), 3000);
  }
}

diagnoseAuthState();