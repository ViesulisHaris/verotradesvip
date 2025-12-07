const puppeteer = require('puppeteer');
const fs = require('fs');

// Test configuration with provided credentials
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  loginUrl: 'http://localhost:3000/login',
  credentials: {
    email: 'Testuser1000@verotrade.com',
    password: 'TestPassword123!'
  },
  timeouts: {
    pageLoad: 30000,
    authentication: 15000,
    elementLoad: 10000,
    authContextCheck: 5000
  },
  protectedRoutes: [
    '/dashboard',
    '/trades',
    '/log-trade',
    '/calendar',
    '/strategies',
    '/confluence',
    '/settings'
  ]
};

// Test results storage
let testResults = {
  authContextTests: [],
  loginFlowTests: [],
  protectedRouteTests: [],
  authStateTests: [],
  performanceMetrics: {},
  screenshots: [],
  errors: [],
  overallSuccess: false
};

// Utility functions
function logStep(step, status, details = '') {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    step,
    status,
    details
  };
  console.log(`${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'} ${step}${details ? ` - ${details}` : ''}`);
  return logEntry;
}

function logError(step, error) {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    step,
    error: error.message || error,
    stack: error.stack
  };
  testResults.errors.push(errorEntry);
  console.error(`❌ ERROR in ${step}:`, error);
  return errorEntry;
}

async function takeScreenshot(page, filename, description) {
  try {
    await page.screenshot({ 
      path: filename,
      fullPage: true 
    });
    console.log(`📸 Screenshot saved: ${filename} - ${description}`);
    testResults.screenshots.push({
      filename,
      description,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log(`⚠️ Could not save screenshot: ${filename}`);
  }
}

// Check AuthContext availability and state
async function checkAuthContext(page, testName) {
  try {
    const authContextState = await page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          // Check if React is available
          if (typeof window.React === 'undefined') {
            resolve({ error: 'React not available' });
            return;
          }

          // Try to access AuthContext through various methods
          let authState = null;
          let authContextAvailable = false;
          let hasProvider = false;
          let authInitialized = false;
          let hasUser = false;
          let hasSession = false;
          let userEmail = null;
          let loading = false;

          // Method 1: Check for AuthContext in window
          if (window.__AUTH_CONTEXT__) {
            authContextAvailable = true;
            authState = window.__AUTH_CONTEXT__;
          }

          // Method 2: Check for useAuth hook availability
          try {
            // Look for auth-related elements that indicate AuthContext is working
            const authElements = document.querySelectorAll('[data-auth], [data-testid*="auth"], .auth-guard');
            if (authElements.length > 0) {
              authContextAvailable = true;
            }
          } catch (e) {
            // Continue
          }

          // Method 3: Check console logs for AuthContext messages
          const logs = [];
          if (window.console && window.console.logs) {
            window.console.logs.forEach(log => {
              if (log.includes('AUTH_CONTEXT') || log.includes('AuthContext')) {
                logs.push(log);
              }
            });
          }

          // Method 4: Check for auth state in localStorage
          try {
            const authData = localStorage.getItem('sb-bzmixuxautbmqbrqtufx-auth-token');
            if (authData) {
              hasSession = true;
              const parsed = JSON.parse(authData);
              hasUser = !!parsed.user;
              userEmail = parsed.user?.email || null;
            }
          } catch (e) {
            // Continue
          }

          // Method 5: Check for Supabase auth state
          try {
            if (window.supabase && window.supabase.auth) {
              hasProvider = true;
              // Try to get current session
              window.supabase.auth.getSession().then(({ data, error }) => {
                if (data.session) {
                  hasSession = true;
                  hasUser = !!data.session.user;
                  userEmail = data.session.user?.email || null;
                }
                resolve({
                  authContextAvailable,
                  hasProvider,
                  authInitialized: true,
                  hasUser,
                  hasSession,
                  userEmail,
                  loading: false,
                  logs
                });
              }).catch(() => {
                resolve({
                  authContextAvailable,
                  hasProvider,
                  authInitialized: true,
                  hasUser,
                  hasSession,
                  userEmail,
                  loading: false,
                  logs
                });
              });
              return;
            }
          } catch (e) {
            // Continue
          }

          resolve({
            authContextAvailable,
            hasProvider,
            authInitialized: true,
            hasUser,
            hasSession,
            userEmail,
            loading: false,
            logs
          });
        } catch (error) {
          resolve({ error: error.message });
        }
      });
    });

    return authContextState;
  } catch (error) {
    return { error: error.message };
  }
}

// Main test function
async function runCompleteAuthFlowTest() {
  console.log('🚀 Starting Complete Authentication Flow Test');
  console.log('=' .repeat(70));
  console.log(`📍 Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`🔑 Test Email: ${TEST_CONFIG.credentials.email}`);
  console.log('=' .repeat(70));

  const browser = await puppeteer.launch({ 
    headless: false, // Set to false for debugging
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Enable comprehensive logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('AuthContext') || text.includes('AUTH_CONTEXT') || text.includes('AUTH_DEBUG')) {
      console.log('🌐 Browser Auth Context:', text);
    }
  });

  page.on('request', request => {
    if (request.url().includes('auth') || request.url().includes('session')) {
      console.log('🌐 Auth Request:', request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('auth') || response.url().includes('session')) {
      console.log('🌐 Auth Response:', response.url(), response.status());
    }
  });

  try {
    // Step 1: Test initial page load and AuthContext availability
    console.log('\n📍 Step 1: Testing Initial Page Load and AuthContext');
    console.log('-'.repeat(50));
    
    const startTime = Date.now();
    await page.goto(TEST_CONFIG.baseUrl, { 
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeouts.pageLoad 
    });
    
    const initialLoadTime = Date.now() - startTime;
    testResults.performanceMetrics.initialLoad = initialLoadTime;
    
    logStep('Initial page load', 'PASS', `${initialLoadTime}ms`);
    
    // Check AuthContext on initial load
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for AuthContext to initialize
    const initialAuthState = await checkAuthContext(page, 'Initial Load');
    testResults.authContextTests.push({
      test: 'Initial AuthContext Availability',
      ...initialAuthState,
      timestamp: new Date().toISOString()
    });
    
    if (initialAuthState.error) {
      logError('Initial AuthContext Check', new Error(initialAuthState.error));
    } else {
      logStep('Initial AuthContext Check', initialAuthState.authContextAvailable ? 'PASS' : 'FAIL', 
        `Available: ${initialAuthState.authContextAvailable}, Provider: ${initialAuthState.hasProvider}`);
    }
    
    await takeScreenshot(page, 'auth-test-initial-load.png', 'Initial page load with AuthContext');

    // Step 2: Navigate to login page and test AuthContext
    console.log('\n📍 Step 2: Testing Login Page and AuthContext');
    console.log('-'.repeat(50));
    
    const loginStartTime = Date.now();
    await page.goto(TEST_CONFIG.loginUrl, { 
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeouts.pageLoad 
    });
    
    const loginLoadTime = Date.now() - loginStartTime;
    testResults.performanceMetrics.loginPageLoad = loginLoadTime;
    
    logStep('Login page load', 'PASS', `${loginLoadTime}ms`);
    
    // Wait for login form to be ready
    try {
      await page.waitForSelector('input[type="email"]', { timeout: TEST_CONFIG.timeouts.elementLoad });
      await page.waitForSelector('input[type="password"]', { timeout: TEST_CONFIG.timeouts.elementLoad });
      await page.waitForSelector('button[type="submit"]', { timeout: TEST_CONFIG.timeouts.elementLoad });
      logStep('Login form elements', 'PASS', 'All form elements found');
    } catch (error) {
      logError('Login form elements', error);
      throw error;
    }
    
    // Check AuthContext on login page
    await new Promise(resolve => setTimeout(resolve, 2000));
    const loginAuthState = await checkAuthContext(page, 'Login Page');
    testResults.authContextTests.push({
      test: 'Login Page AuthContext',
      ...loginAuthState,
      timestamp: new Date().toISOString()
    });
    
    if (loginAuthState.error) {
      logError('Login Page AuthContext Check', new Error(loginAuthState.error));
    } else {
      logStep('Login Page AuthContext Check', loginAuthState.authContextAvailable ? 'PASS' : 'FAIL',
        `Available: ${loginAuthState.authContextAvailable}, Provider: ${loginAuthState.hasProvider}`);
    }
    
    await takeScreenshot(page, 'auth-test-login-page.png', 'Login page with AuthContext');

    // Step 3: Test login with provided credentials
    console.log('\n📍 Step 3: Testing Login with Provided Credentials');
    console.log('-'.repeat(50));
    
    // Fill in login form
    await page.type('input[type="email"]', TEST_CONFIG.credentials.email);
    await page.type('input[type="password"]', TEST_CONFIG.credentials.password);
    
    logStep('Login form fill', 'PASS', `Email: ${TEST_CONFIG.credentials.email}`);
    
    // Submit login form
    const authStartTime = Date.now();
    
    await Promise.all([
      page.waitForNavigation({ 
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeouts.authentication 
      }),
      page.click('button[type="submit"]')
    ]);
    
    const authTime = Date.now() - authStartTime;
    testResults.performanceMetrics.authentication = authTime;
    
    logStep('Login submission', 'PASS', `${authTime}ms`);
    
    // Check where we ended up after login
    const currentUrl = page.url();
    console.log('📍 Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      logStep('Login redirect', 'PASS', 'Successfully redirected to dashboard');
    } else if (currentUrl.includes('/login')) {
      logStep('Login redirect', 'FAIL', 'Still on login page - authentication failed');
      // Check for error messages
      try {
        const errorMessage = await page.$eval('.error, .alert, [role="alert"]', el => el.textContent);
        logStep('Login error message', 'INFO', errorMessage);
      } catch (e) {
        // No error message found
      }
    } else {
      logStep('Login redirect', 'PARTIAL', `Redirected to: ${currentUrl}`);
    }
    
    await takeScreenshot(page, 'auth-test-after-login.png', 'After login attempt');

    // Step 4: Test AuthContext state after login
    console.log('\n📍 Step 4: Testing AuthContext State After Login');
    console.log('-'.repeat(50));
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for AuthContext to update
    const postLoginAuthState = await checkAuthContext(page, 'Post Login');
    testResults.authContextTests.push({
      test: 'Post-Login AuthContext',
      ...postLoginAuthState,
      timestamp: new Date().toISOString()
    });
    
    if (postLoginAuthState.error) {
      logError('Post-Login AuthContext Check', new Error(postLoginAuthState.error));
    } else {
      logStep('Post-Login AuthContext Check', postLoginAuthState.authContextAvailable ? 'PASS' : 'FAIL',
        `Available: ${postLoginAuthState.authContextAvailable}, User: ${postLoginAuthState.hasUser}, Email: ${postLoginAuthState.userEmail}`);
    }

    // Step 5: Test dashboard access and functionality
    console.log('\n📍 Step 5: Testing Dashboard Access and Functionality');
    console.log('-'.repeat(50));
    
    // Navigate to dashboard if not already there
    if (!currentUrl.includes('/dashboard')) {
      await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { 
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeouts.pageLoad 
      });
    }
    
    const dashboardLoadTime = Date.now() - authStartTime;
    testResults.performanceMetrics.dashboardLoad = dashboardLoadTime;
    
    // Check dashboard elements
    try {
      await page.waitForSelector('main, .dashboard, [role="main"]', { timeout: TEST_CONFIG.timeouts.elementLoad });
      logStep('Dashboard load', 'PASS', 'Dashboard elements found');
    } catch (error) {
      logError('Dashboard load', error);
    }
    
    // Check for user-specific elements
    try {
      const userElements = await page.$$eval('[data-user], .user-info, .avatar', elements => 
        elements.map(el => el.textContent || el.className)
      );
      logStep('User elements check', 'PASS', `Found ${userElements.length} user elements`);
    } catch (error) {
      logStep('User elements check', 'PARTIAL', 'No user elements found');
    }
    
    await takeScreenshot(page, 'auth-test-dashboard.png', 'Dashboard after successful login');

    // Step 6: Test protected routes access
    console.log('\n📍 Step 6: Testing Protected Routes Access');
    console.log('-'.repeat(50));
    
    for (const route of TEST_CONFIG.protectedRoutes) {
      try {
        await page.goto(`${TEST_CONFIG.baseUrl}${route}`, { 
          waitUntil: 'networkidle2',
          timeout: TEST_CONFIG.timeouts.pageLoad 
        });
        
        const routeUrl = page.url();
        const canAccess = !routeUrl.includes('/login');
        
        testResults.protectedRouteTests.push({
          route,
          canAccess,
          finalUrl: routeUrl,
          timestamp: new Date().toISOString()
        });
        
        logStep(`Protected route ${route}`, canAccess ? 'PASS' : 'FAIL', 
          canAccess ? 'Accessible' : 'Redirected to login');
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause between routes
        
      } catch (error) {
        testResults.protectedRouteTests.push({
          route,
          canAccess: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        logError(`Protected route ${route}`, error);
      }
    }

    // Step 7: Test authentication state persistence
    console.log('\n📍 Step 7: Testing Authentication State Persistence');
    console.log('-'.repeat(50));
    
    // Go back to dashboard
    await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { 
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeouts.pageLoad 
    });
    
    // Refresh page to test persistence
    await page.reload({ waitUntil: 'networkidle2' });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    const persistenceAuthState = await checkAuthContext(page, 'Persistence Test');
    testResults.authStateTests.push({
      test: 'Authentication Persistence',
      ...persistenceAuthState,
      timestamp: new Date().toISOString()
    });
    
    const stillAuthenticated = !page.url().includes('/login');
    logStep('Auth state persistence', stillAuthenticated ? 'PASS' : 'FAIL',
      `Still authenticated: ${stillAuthenticated}`);
    
    await takeScreenshot(page, 'auth-test-persistence.png', 'After page refresh');

    // Step 8: Test logout functionality
    console.log('\n📍 Step 8: Testing Logout Functionality');
    console.log('-'.repeat(50));
    
    try {
      // Look for logout button
      const logoutSelectors = [
        'button[aria-label*="logout"]',
        'a[href*="logout"]',
        'button:contains("Logout")',
        'button:contains("Sign out")',
        '[data-testid="logout-button"]'
      ];
      
      let logoutButton = null;
      for (const selector of logoutSelectors) {
        try {
          logoutButton = await page.$(selector);
          if (logoutButton) break;
        } catch (e) {
          // Continue
        }
      }
      
      // If no specific selector works, try text content
      if (!logoutButton) {
        logoutButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button, a'));
          return buttons.find(btn => 
            btn.textContent.toLowerCase().includes('logout') ||
            btn.textContent.toLowerCase().includes('sign out')
          );
        });
      }
      
      if (logoutButton) {
        const logoutStartTime = Date.now();
        await logoutButton.click();
        
        // Wait for logout to complete
        await page.waitForNavigation({ 
          waitUntil: 'networkidle2',
          timeout: TEST_CONFIG.timeouts.authentication 
        });
        
        const logoutTime = Date.now() - logoutStartTime;
        testResults.performanceMetrics.logout = logoutTime;
        
        const finalUrl = page.url();
        const logoutSuccess = finalUrl.includes('/login');
        
        logStep('Logout functionality', logoutSuccess ? 'PASS' : 'FAIL',
          logoutSuccess ? `Successfully logged out (${logoutTime}ms)` : `Ended up at: ${finalUrl}`);
        
        await takeScreenshot(page, 'auth-test-logout.png', 'After logout');
        
      } else {
        logStep('Logout button', 'FAIL', 'Logout button not found');
      }
    } catch (error) {
      logError('Logout functionality', error);
    }

    // Calculate overall success
    const authContextTestsPassed = testResults.authContextTests.filter(t => !t.error && t.authContextAvailable).length;
    const protectedRoutesPassed = testResults.protectedRouteTests.filter(t => t.canAccess).length;
    const hasSuccessfulLogin = testResults.authContextTests.some(t => t.hasUser && t.userEmail === TEST_CONFIG.credentials.email);
    
    testResults.overallSuccess = 
      authContextTestsPassed > 0 && // At least some AuthContext tests pass
      hasSuccessfulLogin && // Login was successful
      protectedRoutesPassed > 0; // Can access protected routes

    // Generate comprehensive report
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('=' .repeat(70));
    
    console.log('\n🔐 AUTHCONTEXT TESTS:');
    testResults.authContextTests.forEach(test => {
      const status = test.error ? 'FAIL' : test.authContextAvailable ? 'PASS' : 'PARTIAL';
      console.log(`   ${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'} ${test.test}: ${status}`);
      if (test.error) console.log(`      Error: ${test.error}`);
      if (test.userEmail) console.log(`      User: ${test.userEmail}`);
    });
    
    console.log('\n🛡️ PROTECTED ROUTE TESTS:');
    testResults.protectedRouteTests.forEach(test => {
      console.log(`   ${test.canAccess ? '✅' : '❌'} ${test.route}: ${test.canAccess ? 'Accessible' : 'Blocked'}`);
    });
    
    console.log('\n⏱️ PERFORMANCE METRICS:');
    Object.entries(testResults.performanceMetrics).forEach(([metric, time]) => {
      console.log(`   ${metric}: ${time}ms`);
    });
    
    console.log('\n📸 SCREENSHOTS:');
    testResults.screenshots.forEach(ss => {
      console.log(`   ${ss.filename}: ${ss.description}`);
    });
    
    if (testResults.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      testResults.errors.forEach(error => {
        console.log(`   ${error.step}: ${error.error}`);
      });
    }
    
    console.log(`\n🏆 OVERALL SUCCESS: ${testResults.overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Save detailed report
    const reportFilename = `auth-flow-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportFilename, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFilename}`);
    
    return testResults;
    
  } catch (error) {
    logError('Main test execution', error);
    await takeScreenshot(page, 'auth-test-error.png', 'Error state');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  runCompleteAuthFlowTest()
    .then(results => {
      console.log('\n✅ Complete authentication flow test finished');
      process.exit(results.overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Complete authentication flow test failed:', error);
      process.exit(1);
    });
}

module.exports = { runCompleteAuthFlowTest, TEST_CONFIG };