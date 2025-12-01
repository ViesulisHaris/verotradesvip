/**
 * Authentication State Persistence Diagnostic Test
 * 
 * This test identifies and fixes authentication state persistence issues
 * across page refreshes, navigation, and browser sessions.
 */

const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  testEmail: 'testuser1000@verotrade.com',
  testPassword: 'TestPassword123!',
  timeout: 30000,
  retryAttempts: 3
};

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  issues: [],
  recommendations: []
};

function logTest(testName, status, details, duration = 0) {
  const result = {
    testName,
    status, // 'pass', 'fail', 'warning'
    details,
    duration: `${duration.toFixed(2)}ms`,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (status === 'pass') {
    testResults.summary.passed++;
    console.log(`✅ [PASS] ${testName}: ${details} (${duration.toFixed(2)}ms)`);
  } else if (status === 'fail') {
    testResults.summary.failed++;
    console.log(`❌ [FAIL] ${testName}: ${details} (${duration.toFixed(2)}ms)`);
    testResults.issues.push({ testName, details });
  } else if (status === 'warning') {
    testResults.summary.warnings++;
    console.log(`⚠️  [WARN] ${testName}: ${details} (${duration.toFixed(2)}ms)`);
  }
}

async function runDiagnosticTest() {
  console.log('🔍 Starting Authentication State Persistence Diagnostic Test...');
  console.log(`📅 Test started at: ${new Date().toISOString()}`);
  console.log(`🌐 Base URL: ${TEST_CONFIG.baseURL}`);
  console.log(`👤 Test credentials: ${TEST_CONFIG.testEmail}`);
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  try {
    // Test 1: Initial Login and Session Creation
    console.log('\n🧪 Test 1: Initial Login and Session Creation');
    const page = await context.newPage();
    
    try {
      const startTime = Date.now();
      
      // Navigate to login page
      await page.goto(`${TEST_CONFIG.baseURL}/login`, { 
        waitUntil: 'networkidle',
        timeout: TEST_CONFIG.timeout 
      });
      
      // Wait for login form to be ready
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      // Fill login form
      await page.fill('input[type="email"]', TEST_CONFIG.testEmail);
      await page.fill('input[type="password"]', TEST_CONFIG.testPassword);
      
      // Submit login form
      await page.click('button[type="submit"]');
      
      // Wait for successful login (redirect to dashboard)
      await page.waitForURL('**/dashboard', { timeout: TEST_CONFIG.timeout });
      
      // Check if user is authenticated
      const userElement = await page.waitForSelector('[data-testid="user-info"], .user-info, [class*="user"]', { 
        timeout: 10000 
      }).catch(() => null);
      
      if (userElement) {
        logTest('Initial Login', 'pass', 'User successfully logged in and redirected to dashboard', Date.now() - startTime);
      } else {
        logTest('Initial Login', 'fail', 'Login completed but user element not found', Date.now() - startTime);
      }
      
      // Check localStorage for session data
      const localStorage = await page.evaluate(() => {
        const storage = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          storage[key] = localStorage.getItem(key);
        }
        return storage;
      });
      
      const hasSupabaseData = Object.keys(localStorage).some(key => 
        key.includes('supabase') || key.includes('auth')
      );
      
      if (hasSupabaseData) {
        logTest('Session Storage', 'pass', 'Authentication data found in localStorage', Date.now() - startTime);
      } else {
        logTest('Session Storage', 'fail', 'No authentication data found in localStorage', Date.now() - startTime);
      }
      
    } catch (error) {
      logTest('Initial Login', 'fail', `Login failed: ${error.message}`, 0);
    }
    
    // Test 2: Page Refresh Persistence
    console.log('\n🧪 Test 2: Page Refresh Persistence');
    
    try {
      const startTime = Date.now();
      
      // Refresh the page
      await page.reload({ waitUntil: 'networkidle', timeout: TEST_CONFIG.timeout });
      
      // Wait for page to stabilize
      await page.waitForTimeout(2000);
      
      // Check if user is still authenticated after refresh
      const userAfterRefresh = await page.waitForSelector('[data-testid="user-info"], .user-info, [class*="user"]', { 
        timeout: 10000 
      }).catch(() => null);
      
      if (userAfterRefresh) {
        logTest('Page Refresh Persistence', 'pass', 'User session persisted after page refresh', Date.now() - startTime);
      } else {
        logTest('Page Refresh Persistence', 'fail', 'User session lost after page refresh', Date.now() - startTime);
      }
      
      // Check URL - should still be on dashboard
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        logTest('URL Persistence', 'pass', 'User remained on dashboard after refresh', Date.now() - startTime);
      } else {
        logTest('URL Persistence', 'fail', `User redirected to ${currentUrl} after refresh`, Date.now() - startTime);
      }
      
    } catch (error) {
      logTest('Page Refresh Persistence', 'fail', `Page refresh test failed: ${error.message}`, 0);
    }
    
    // Test 3: Navigation Persistence
    console.log('\n🧪 Test 3: Navigation Persistence');
    
    try {
      const startTime = Date.now();
      
      // Navigate to different authenticated pages
      const authenticatedRoutes = ['/trades', '/strategies', '/dashboard'];
      
      for (const route of authenticatedRoutes) {
        await page.goto(`${TEST_CONFIG.baseURL}${route}`, { 
          waitUntil: 'networkidle',
          timeout: TEST_CONFIG.timeout 
        });
        
        // Check if user remains authenticated
        const userOnRoute = await page.waitForSelector('[data-testid="user-info"], .user-info, [class*="user"]', { 
          timeout: 5000 
        }).catch(() => null);
        
        if (userOnRoute) {
          logTest(`Navigation to ${route}`, 'pass', `User remained authenticated on ${route}`, Date.now() - startTime);
        } else {
          logTest(`Navigation to ${route}`, 'fail', `User lost authentication on ${route}`, Date.now() - startTime);
        }
      }
      
    } catch (error) {
      logTest('Navigation Persistence', 'fail', `Navigation test failed: ${error.message}`, 0);
    }
    
    // Test 4: Browser Close/Reopen Persistence
    console.log('\n🧪 Test 4: Browser Close/Reopen Persistence');
    
    try {
      const startTime = Date.now();
      
      // Close current page and create new one (simulating browser close/reopen)
      await page.close();
      
      const newPage = await context.newPage();
      await newPage.goto(`${TEST_CONFIG.baseURL}/dashboard`, { 
        waitUntil: 'networkidle',
        timeout: TEST_CONFIG.timeout 
      });
      
      // Check if user is still authenticated
      const userAfterReopen = await newPage.waitForSelector('[data-testid="user-info"], .user-info, [class*="user"]', { 
        timeout: 10000 
      }).catch(() => null);
      
      if (userAfterReopen) {
        logTest('Browser Reopen Persistence', 'pass', 'User session persisted after browser reopen', Date.now() - startTime);
      } else {
        logTest('Browser Reopen Persistence', 'fail', 'User session lost after browser reopen', Date.now() - startTime);
      }
      
      await newPage.close();
      
    } catch (error) {
      logTest('Browser Reopen Persistence', 'fail', `Browser reopen test failed: ${error.message}`, 0);
    }
    
    // Test 5: AuthContext State Analysis
    console.log('\n🧪 Test 5: AuthContext State Analysis');
    
    try {
      const startTime = Date.now();
      const analysisPage = await context.newPage();
      
      // Navigate to a page where we can analyze AuthContext
      await analysisPage.goto(`${TEST_CONFIG.baseURL}/dashboard`, { 
        waitUntil: 'networkidle',
        timeout: TEST_CONFIG.timeout 
      });
      
      // Inject script to analyze AuthContext state
      const authContextState = await analysisPage.evaluate(() => {
        return new Promise((resolve) => {
          // Try to access React DevTools or check for auth state in window
          setTimeout(() => {
            const authData = {
              hasReactDevTools: !!(window.__REACT_DEVTOOLS_GLOBAL_HOOK__),
              hasSupabaseAuth: !!(window.supabase?.auth),
              localStorageKeys: Object.keys(localStorage),
              sessionStorageKeys: Object.keys(sessionStorage),
              hasAuthCookies: document.cookie.includes('auth') || document.cookie.includes('session')
            };
            resolve(authData);
          }, 2000);
        });
      });
      
      logTest('AuthContext Analysis', 'pass', `AuthContext state analyzed: ${JSON.stringify(authContextState)}`, Date.now() - startTime);
      
      await analysisPage.close();
      
    } catch (error) {
      logTest('AuthContext Analysis', 'fail', `AuthContext analysis failed: ${error.message}`, Date.now() - startTime);
    }
    
    // Test 6: Session Storage vs LocalStorage Analysis
    console.log('\n🧪 Test 6: Storage Analysis');
    
    try {
      const startTime = Date.now();
      const storagePage = await context.newPage();
      
      await storagePage.goto(`${TEST_CONFIG.baseURL}/dashboard`, { 
        waitUntil: 'networkidle',
        timeout: TEST_CONFIG.timeout 
      });
      
      // Analyze storage contents
      const storageAnalysis = await storagePage.evaluate(() => {
        const localStorage = {};
        const sessionStorage = {};
        
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          localStorage[key] = {
            size: window.localStorage.getItem(key).length,
            preview: window.localStorage.getItem(key).substring(0, 100)
          };
        }
        
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          sessionStorage[key] = {
            size: window.sessionStorage.getItem(key).length,
            preview: window.sessionStorage.getItem(key).substring(0, 100)
          };
        }
        
        return {
          localStorage,
          sessionStorage,
          localStorageSize: JSON.stringify(localStorage).length,
          sessionStorageSize: JSON.stringify(sessionStorage).length
        };
      });
      
      const hasAuthInLocalStorage = Object.keys(storageAnalysis.localStorage).some(key => 
        key.toLowerCase().includes('supabase') || key.toLowerCase().includes('auth')
      );
      
      const hasAuthInSessionStorage = Object.keys(storageAnalysis.sessionStorage).some(key => 
        key.toLowerCase().includes('supabase') || key.toLowerCase().includes('auth')
      );
      
      if (hasAuthInLocalStorage) {
        logTest('LocalStorage Auth', 'pass', 'Authentication data properly stored in localStorage', Date.now() - startTime);
      } else {
        logTest('LocalStorage Auth', 'fail', 'No authentication data found in localStorage', Date.now() - startTime);
      }
      
      if (hasAuthInSessionStorage) {
        logTest('SessionStorage Auth', 'warning', 'Authentication data found in sessionStorage (may not persist)', Date.now() - startTime);
      } else {
        logTest('SessionStorage Auth', 'pass', 'No sensitive auth data in sessionStorage (good for security)', Date.now() - startTime);
      }
      
      await storagePage.close();
      
    } catch (error) {
      logTest('Storage Analysis', 'fail', `Storage analysis failed: ${error.message}`, Date.now() - startTime);
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    logTest('Test Execution', 'fail', `Overall test execution failed: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Generate recommendations
  generateRecommendations();
  
  // Save results
  saveResults();
  
  // Print summary
  printSummary();
}

function generateRecommendations() {
  const recommendations = [];
  
  // Analyze failed tests and generate recommendations
  const failedTests = testResults.tests.filter(test => test.status === 'fail');
  
  failedTests.forEach(test => {
    switch (test.testName) {
      case 'Page Refresh Persistence':
        recommendations.push({
          issue: 'Authentication state not persisting across page refreshes',
          solution: 'Ensure Supabase client is configured with persistSession: true and autoRefreshToken: true',
          priority: 'HIGH'
        });
        break;
        
      case 'Session Storage':
        recommendations.push({
          issue: 'No authentication data found in localStorage',
          solution: 'Check Supabase client configuration and ensure proper session storage setup',
          priority: 'HIGH'
        });
        break;
        
      case 'Browser Reopen Persistence':
        recommendations.push({
          issue: 'Session not persisting across browser sessions',
          solution: 'Implement proper localStorage persistence and session restoration logic',
          priority: 'HIGH'
        });
        break;
        
      case 'Navigation Persistence':
        recommendations.push({
          issue: 'Authentication lost during navigation',
          solution: 'Fix AuthContext state management and ensure proper session synchronization',
          priority: 'MEDIUM'
        });
        break;
    }
  });
  
  // Add general recommendations
  recommendations.push({
    issue: 'AuthContext initialization timing',
    solution: 'Implement proper loading states and prevent race conditions during auth initialization',
    priority: 'MEDIUM'
  });
  
  recommendations.push({
    issue: 'Session refresh token management',
    solution: 'Ensure automatic token refresh is properly configured and handled',
    priority: 'MEDIUM'
  });
  
  testResults.recommendations = recommendations;
}

function saveResults() {
  const reportPath = './auth-persistence-diagnostic-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 AUTHENTICATION PERSISTENCE DIAGNOSTIC SUMMARY');
  console.log('='.repeat(80));
  console.log(`📅 Test completed at: ${new Date().toISOString()}`);
  console.log(`📈 Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${testResults.summary.warnings}`);
  
  if (testResults.issues.length > 0) {
    console.log('\n🚨 IDENTIFIED ISSUES:');
    testResults.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.testName}: ${issue.details}`);
    });
  }
  
  if (testResults.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    testResults.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`   Solution: ${rec.solution}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

// Run the diagnostic test
runDiagnosticTest().catch(console.error);