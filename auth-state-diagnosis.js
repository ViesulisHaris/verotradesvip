/**
 * Authentication State Diagnosis Script
 * 
 * This script checks if authentication is the root cause of desktop layout issues
 */

const puppeteer = require('puppeteer');

async function diagnoseAuthState() {
  console.log('🔍 Diagnosing Authentication State...');
  
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    // Set desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging from page
    page.on('console', msg => console.log('PAGE:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    console.log('\n📱 Testing different routes...');
    
    // Test home page first
    console.log('\n1. Testing home page...');
    await page.goto('http://localhost:3000/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    let homePageContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyContent: document.body.innerText.substring(0, 200),
        hasReact: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
        bodyClasses: document.body.className
      };
    });
    
    console.log('Home Page:', homePageContent);
    
    // Test login page
    console.log('\n2. Testing login page...');
    try {
      await page.goto('http://localhost:3000/login', { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      let loginPageContent = await page.evaluate(() => {
        return {
          title: document.title,
          bodyContent: document.body.innerText.substring(0, 200),
          hasLoginForm: !!document.querySelector('form'),
          hasReact: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__
        };
      });
      
      console.log('Login Page:', loginPageContent);
    } catch (error) {
      console.log('Login page not found or error:', error.message);
    }
    
    // Test dashboard with wait for React
    console.log('\n3. Testing dashboard with extended wait...');
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait longer for React to potentially load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    let dashboardContent = await page.evaluate(() => {
      // Check for any React content
      const reactContent = document.querySelector('#__next');
      const hasAuthGuard = !!document.querySelector('[data-testid="auth-guard"]');
      const hasLoading = !!document.querySelector('[class*="loading"]');
      const hasError = !!document.querySelector('[class*="error"]');
      
      return {
        title: document.title,
        url: window.location.href,
        bodyClasses: document.body.className,
        bodyContent: document.body.innerText.substring(0, 300),
        hasReact: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
        hasNextRoot: !!reactContent,
        hasAuthGuard,
        hasLoading,
        hasError,
        allElements: document.querySelectorAll('*').length
      };
    });
    
    console.log('Dashboard:', dashboardContent);
    
    // Check if we're being redirected
    console.log('\n4. Checking for redirects...');
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    // Try to manually inject authentication state
    console.log('\n5. Testing with mock authentication...');
    await page.evaluate(() => {
      // Mock localStorage auth state
      localStorage.setItem('supabase.auth.token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ 
        id: 'test-user', 
        email: 'test@example.com' 
      }));
      
      // Dispatch storage event to trigger React re-render
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'supabase.auth.token',
        newValue: 'mock-token'
      }));
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let mockAuthContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyClasses: document.body.className,
        bodyContent: document.body.innerText.substring(0, 200),
        hasAside: !!document.querySelector('aside'),
        hasMain: !!document.querySelector('main'),
        hasGrid: !!document.querySelector('.grid'),
        elementCount: document.querySelectorAll('*').length
      };
    });
    
    console.log('With Mock Auth:', mockAuthContent);
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await browser.close();
  }
}

// Run diagnosis
diagnoseAuthState();