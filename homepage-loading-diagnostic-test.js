const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function diagnoseHomepageLoading() {
  console.log('🔍 Starting Homepage Loading Diagnostic Test...');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the browser
  page.on('console', msg => {
    console.log(`🌐 BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`);
  });
  
  // Enable request/response logging
  page.on('request', request => {
    console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  });
  
  // Enable request failure logging
  page.on('requestfailed', request => {
    console.log(`💥 REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
  });
  
  try {
    console.log('\n📍 Step 1: Navigating to http://localhost:3000...');
    const startTime = Date.now();
    
    const response = await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Page loaded in ${loadTime}ms`);
    console.log(`📄 Response status: ${response.status()}`);
    
    // Wait a bit more to see if anything loads
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📍 Step 2: Analyzing page content...');
    
    // Check if we have the expected home page content
    const homePageContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body?.innerText?.substring(0, 200) || 'No body text found',
        bodyHTML: document.body?.innerHTML?.substring(0, 500) || 'No body HTML found',
        hasWelcomeText: document.body?.innerText?.includes('Trading Journal') || false,
        hasBackground: window.getComputedStyle(document.body).backgroundColor,
        authGuardExists: !!document.querySelector('[data-testid="auth-guard"]') || !!document.querySelector('*')?.textContent?.includes('Loading...'),
        hasLoadingSpinner: !!document.querySelector('.animate-spin') || !!document.querySelector('[class*="spin"]') || !!document.querySelector('[class*="loading"]'),
        allElements: document.querySelectorAll('*').length,
        visibleElements: Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        }).length
      };
    });
    
    console.log('📊 Page Content Analysis:');
    console.log(`   Title: ${homePageContent.title}`);
    console.log(`   Body Text (first 200 chars): "${homePageContent.bodyText}"`);
    console.log(`   Has Welcome Text: ${homePageContent.hasWelcomeText}`);
    console.log(`   Background Color: ${homePageContent.hasBackground}`);
    console.log(`   Auth Guard Exists: ${homePageContent.authGuardExists}`);
    console.log(`   Has Loading Spinner: ${homePageContent.hasLoadingSpinner}`);
    console.log(`   Total Elements: ${homePageContent.allElements}`);
    console.log(`   Visible Elements: ${homePageContent.visibleElements}`);
    
    console.log('\n📍 Step 3: Checking for authentication state...');
    
    const authState = await page.evaluate(() => {
      // Check localStorage
      const localStorage = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        localStorage[key] = window.localStorage.getItem(key);
      }
      
      // Check sessionStorage
      const sessionStorage = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        sessionStorage[key] = window.sessionStorage.getItem(key);
      }
      
      // Check for Supabase auth
      const hasSupabaseAuth = !!(window.supabase) || !!(window.__supabase);
      
      return {
        localStorage,
        sessionStorage,
        hasSupabaseAuth,
        cookies: document.cookie
      };
    });
    
    console.log('🔐 Authentication State:');
    console.log(`   Has Supabase Auth: ${authState.hasSupabaseAuth}`);
    console.log(`   Cookies: ${authState.cookies || 'None'}`);
    console.log(`   Local Storage Keys: ${Object.keys(authState.localStorage).join(', ') || 'None'}`);
    console.log(`   Session Storage Keys: ${Object.keys(authState.sessionStorage).join(', ') || 'None'}`);
    
    console.log('\n📍 Step 4: Checking for JavaScript errors and network issues...');
    
    // Check for any unhandled promise rejections
    const jsErrors = await page.evaluate(() => {
      const errors = [];
      const originalHandler = window.onerror;
      window.onerror = function(message, source, lineno, colno, error) {
        errors.push({
          message,
          source,
          lineno,
          colno,
          stack: error?.stack
        });
        return false;
      };
      return errors;
    });
    
    if (jsErrors.length > 0) {
      console.log('❌ JavaScript Errors Found:');
      jsErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.message} at ${error.source}:${error.lineno}:${error.colno}`);
      });
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    console.log('\n📍 Step 5: Taking screenshot for visual analysis...');
    
    const screenshotPath = path.join(__dirname, `homepage-diagnostic-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    // Generate diagnostic report
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      loadTime,
      response: {
        status: response.status(),
        url: response.url()
      },
      pageContent: homePageContent,
      authState,
      jsErrors,
      screenshot: screenshotPath
    };
    
    const reportPath = path.join(__dirname, `homepage-diagnostic-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(diagnosticReport, null, 2));
    console.log(`📄 Diagnostic report saved: ${reportPath}`);
    
    console.log('\n🎯 Diagnosis Summary:');
    console.log('=' .repeat(60));
    
    if (homePageContent.hasWelcomeText) {
      console.log('✅ Home page content is loading correctly');
    } else {
      console.log('❌ Home page content is NOT loading as expected');
    }
    
    if (homePageContent.hasLoadingSpinner) {
      console.log('⏳ Loading spinner detected - authentication might be in progress');
    }
    
    if (homePageContent.visibleElements < 10) {
      console.log('⚠️  Very few visible elements - possible CSS or rendering issue');
    }
    
    if (authState.hasSupabaseAuth) {
      console.log('✅ Supabase auth is available');
    } else {
      console.log('❌ Supabase auth is NOT available - possible initialization issue');
    }
    
    if (jsErrors.length > 0) {
      console.log('❌ JavaScript errors detected - these could prevent proper rendering');
    }
    
    console.log('\n🔧 Recommended Actions:');
    
    if (!homePageContent.hasWelcomeText && !homePageContent.hasLoadingSpinner) {
      console.log('   - Check if AuthGuard is properly rendering');
      console.log('   - Verify authentication flow is not stuck');
    }
    
    if (!authState.hasSupabaseAuth) {
      console.log('   - Check Supabase client initialization');
      console.log('   - Verify environment variables are loaded');
    }
    
    if (jsErrors.length > 0) {
      console.log('   - Fix JavaScript errors that are preventing proper rendering');
    }
    
    if (homePageContent.visibleElements < 10) {
      console.log('   - Check CSS styles that might be hiding content');
      console.log('   - Verify Tailwind CSS is properly loaded');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await browser.close();
    console.log('\n🏁 Diagnostic test completed');
  }
}

// Run the diagnostic test
diagnoseHomepageLoading().catch(console.error);