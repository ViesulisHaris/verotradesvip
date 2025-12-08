const puppeteer = require('puppeteer');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 15000; // 15 seconds timeout

async function diagnoseAuthInitialization() {
  console.log('🔍 DIAGNOSING AUTHENTICATION INITIALIZATION ISSUE...');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Monitor console for authentication-related logs
    const authLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('AUTH') || text.includes('auth') || text.includes('Initializing')) {
        authLogs.push({
          type: msg.type(),
          text: text,
          timestamp: new Date().toISOString()
        });
        console.log(`[${msg.type().toUpperCase()}] ${text}`);
      }
    });
    
    // Navigate to main page and monitor auth initialization
    console.log('\n📋 Testing main page auth initialization...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Wait a bit to see if auth initializes
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check auth state directly in the browser
    const authState = await page.evaluate(() => {
      // Try to access auth context through window or global variables
      const authElements = document.querySelectorAll('[data-auth]');
      const loadingElements = document.querySelectorAll('*');
      
      // Look for "Initializing authentication..." text
      let initializingText = false;
      for (const elem of loadingElements) {
        if (elem.textContent && elem.textContent.includes('Initializing authentication')) {
          initializingText = true;
          break;
        }
      }
      
      return {
        hasAuthElements: authElements.length > 0,
        initializingText,
        pageContent: document.body.innerText.substring(0, 500),
        url: window.location.href
      };
    });
    
    console.log('\n📊 Current Page State:', authState);
    
    // Test login page specifically
    console.log('\n📋 Testing login page auth initialization...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Wait for auth to potentially initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const loginAuthState = await page.evaluate(() => {
      const loadingElements = document.querySelectorAll('*');
      let initializingText = false;
      for (const elem of loadingElements) {
        if (elem.textContent && elem.textContent.includes('Initializing authentication')) {
          initializingText = true;
          break;
        }
      }
      
      return {
        initializingText,
        hasLoginForm: !!document.querySelector('form'),
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        url: window.location.href
      };
    });
    
    console.log('\n📊 Login Page State:', loginAuthState);
    
    // Test dashboard to see redirect behavior
    console.log('\n📋 Testing dashboard redirect behavior...');
    const dashboardStartTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    const dashboardLoadTime = Date.now() - dashboardStartTime;
    
    const dashboardState = await page.evaluate(() => {
      const loadingElements = document.querySelectorAll('*');
      let initializingText = false;
      for (const elem of loadingElements) {
        if (elem.textContent && elem.textContent.includes('Initializing authentication')) {
          initializingText = true;
          break;
        }
      }
      
      return {
        initializingText,
        currentUrl: window.location.href,
        pageTitle: document.title,
        pageContent: document.body.innerText.substring(0, 300)
      };
    });
    
    console.log('\n📊 Dashboard State:', {
      loadTime: dashboardLoadTime,
      ...dashboardState
    });
    
    // Analyze the authentication logs
    console.log('\n📋 Authentication Log Analysis:');
    const errorLogs = authLogs.filter(log => log.type === 'error');
    const warningLogs = authLogs.filter(log => log.type === 'warning');
    const initLogs = authLogs.filter(log => log.text.includes('initialization') || log.text.includes('initialized'));
    
    console.log(`Total auth logs: ${authLogs.length}`);
    console.log(`Error logs: ${errorLogs.length}`);
    console.log(`Warning logs: ${warningLogs.length}`);
    console.log(`Initialization logs: ${initLogs.length}`);
    
    if (errorLogs.length > 0) {
      console.log('\n🚨 Authentication Errors:');
      errorLogs.forEach(log => console.log(`  - ${log.text}`));
    }
    
    if (warningLogs.length > 0) {
      console.log('\n⚠️  Authentication Warnings:');
      warningLogs.forEach(log => console.log(`  - ${log.text}`));
    }
    
    // Generate diagnosis
    console.log('\n🔍 DIAGNOSIS SUMMARY:');
    
    if (authState.initializingText || loginAuthState.initializingText || dashboardState.initializingText) {
      console.log('❌ CRITICAL ISSUE: Authentication is stuck in "Initializing authentication..." state');
      console.log('   This indicates the AuthContext initialization is not completing properly');
    } else {
      console.log('✅ Authentication initialization appears to complete');
    }
    
    if (dashboardState.currentUrl === `${BASE_URL}/dashboard`) {
      console.log('❌ ISSUE: Protected route (/dashboard) is not redirecting to login when unauthenticated');
      console.log('   This suggests the AuthGuard is not properly handling unauthenticated access');
    } else if (dashboardState.currentUrl.includes('/login')) {
      console.log('✅ Protected route properly redirects to login');
    }
    
    if (loginAuthState.hasLoginForm && loginAuthState.hasEmailInput && loginAuthState.hasPasswordInput) {
      console.log('✅ Login page form elements are present and functional');
    } else {
      console.log('❌ Login page is missing required form elements');
    }
    
    // Save diagnostic report
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      authState,
      loginAuthState,
      dashboardState: {
        loadTime: dashboardLoadTime,
        ...dashboardState
      },
      authLogs: authLogs.slice(-20), // Last 20 logs
      errorLogs,
      warningLogs,
      initLogs
    };
    
    fs.writeFileSync('./auth-initialization-diagnostic-report.json', JSON.stringify(diagnosticReport, null, 2));
    console.log('\n📁 Diagnostic report saved to: ./auth-initialization-diagnostic-report.json');
    
    return diagnosticReport;
    
  } catch (error) {
    console.error('🚨 Diagnostic error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run diagnostic
if (require.main === module) {
  diagnoseAuthInitialization()
    .then(() => {
      console.log('\n✅ Authentication diagnostic completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Authentication diagnostic failed:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseAuthInitialization };