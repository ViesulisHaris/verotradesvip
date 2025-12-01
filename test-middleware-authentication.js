const { chromium } = require('playwright');

/**
 * Test script to verify authentication middleware is working correctly
 * This script tests that protected routes redirect to login when not authenticated
 */

async function testMiddlewareAuthentication() {
  console.log('🧪 Testing authentication middleware...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  // List of protected routes to test
  const protectedRoutes = [
    '/dashboard',
    '/trades',
    '/strategies',
    '/strategies/create',
    '/log-trade',
    '/confluence',
    '/calendar',
    '/analytics',
    '/strategies/edit/test-id',
    '/strategies/performance/test-id'
  ];
  
  // List of public routes that should be accessible
  const publicRoutes = [
    '/login',
    '/register',
    '/'
  ];
  
  const baseUrl = 'http://localhost:3000';
  let testResults = {
    protected: { passed: 0, failed: 0, details: [] },
    public: { passed: 0, failed: 0, details: [] }
  };
  
  try {
    console.log('\n🔒 Testing protected routes (should redirect to login):');
    
    for (const route of protectedRoutes) {
      try {
        const page = await context.newPage();
        
        // Navigate to protected route without authentication
        const response = await page.goto(`${baseUrl}${route}`, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
        
        const currentUrl = page.url();
        const isRedirectedToLogin = currentUrl.includes('/login');
        
        if (isRedirectedToLogin) {
          console.log(`✅ ${route} - Correctly redirected to login`);
          testResults.protected.passed++;
          testResults.protected.details.push({ route, status: 'PASS', message: 'Redirected to login' });
        } else {
          console.log(`❌ ${route} - FAILED: Should redirect to login but went to ${currentUrl}`);
          testResults.protected.failed++;
          testResults.protected.details.push({ route, status: 'FAIL', message: `Did not redirect to login, went to: ${currentUrl}` });
        }
        
        await page.close();
      } catch (error) {
        console.log(`❌ ${route} - ERROR: ${error.message}`);
        testResults.protected.failed++;
        testResults.protected.details.push({ route, status: 'ERROR', message: error.message });
      }
    }
    
    console.log('\n🌐 Testing public routes (should be accessible):');
    
    for (const route of publicRoutes) {
      try {
        const page = await context.newPage();
        
        // Navigate to public route without authentication
        const response = await page.goto(`${baseUrl}${route}`, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
        
        const currentUrl = page.url();
        const isNotRedirectedToLogin = !currentUrl.includes('/login') && currentUrl.endsWith(route) || (route === '/' && currentUrl === baseUrl + '/');
        
        if (isNotRedirectedToLogin) {
          console.log(`✅ ${route} - Correctly accessible without authentication`);
          testResults.public.passed++;
          testResults.public.details.push({ route, status: 'PASS', message: 'Accessible without authentication' });
        } else {
          console.log(`❌ ${route} - FAILED: Should be accessible but redirected to ${currentUrl}`);
          testResults.public.failed++;
          testResults.public.details.push({ route, status: 'FAIL', message: `Unexpectedly redirected to: ${currentUrl}` });
        }
        
        await page.close();
      } catch (error) {
        console.log(`❌ ${route} - ERROR: ${error.message}`);
        testResults.public.failed++;
        testResults.public.details.push({ route, status: 'ERROR', message: error.message });
      }
    }
    
    // Test authentication flow
    console.log('\n🔐 Testing authentication flow:');
    try {
      const page = await context.newPage();
      
      // Go to login page
      await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
      
      // Fill in login form
      await page.fill('input[type="email"]', 'testuser@verotrade.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      
      // Submit login form
      await page.click('button[type="submit"]');
      
      // Wait for navigation after login
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 });
      
      const currentUrl = page.url();
      const isLoggedIn = currentUrl.includes('/dashboard') || !currentUrl.includes('/login');
      
      if (isLoggedIn) {
        console.log('✅ Login flow - Successfully authenticated and redirected');
        
        // Now test accessing protected routes while authenticated
        for (const route of ['/dashboard', '/trades', '/analytics']) {
          await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
          const routeUrl = page.url();
          const canAccess = !routeUrl.includes('/login');
          
          if (canAccess) {
            console.log(`✅ Authenticated access to ${route} - SUCCESS`);
          } else {
            console.log(`❌ Authenticated access to ${route} - FAILED: Still redirected to login`);
          }
        }
      } else {
        console.log(`❌ Login flow - FAILED: Login did not work, current URL: ${currentUrl}`);
      }
      
      await page.close();
    } catch (error) {
      console.log(`❌ Authentication flow - ERROR: ${error.message}`);
    }
    
  } catch (error) {
    console.error('💥 Critical error during testing:', error);
  } finally {
    await browser.close();
  }
  
  // Generate final report
  console.log('\n📊 FINAL TEST REPORT:');
  console.log('========================');
  
  console.log(`\n🔒 Protected Routes Test Results:`);
  console.log(`✅ Passed: ${testResults.protected.passed}`);
  console.log(`❌ Failed: ${testResults.protected.failed}`);
  
  if (testResults.protected.failed > 0) {
    console.log('\nFailed protected routes:');
    testResults.protected.details
      .filter(detail => detail.status === 'FAIL' || detail.status === 'ERROR')
      .forEach(detail => console.log(`  - ${detail.route}: ${detail.message}`));
  }
  
  console.log(`\n🌐 Public Routes Test Results:`);
  console.log(`✅ Passed: ${testResults.public.passed}`);
  console.log(`❌ Failed: ${testResults.public.failed}`);
  
  if (testResults.public.failed > 0) {
    console.log('\nFailed public routes:');
    testResults.public.details
      .filter(detail => detail.status === 'FAIL' || detail.status === 'ERROR')
      .forEach(detail => console.log(`  - ${detail.route}: ${detail.message}`));
  }
  
  const totalPassed = testResults.protected.passed + testResults.public.passed;
  const totalFailed = testResults.protected.failed + testResults.public.failed;
  const totalTests = totalPassed + totalFailed;
  
  console.log(`\n🎯 Overall Results:`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Authentication middleware is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the middleware implementation.');
  }
  
  return {
    totalPassed,
    totalFailed,
    totalTests,
    successRate: (totalPassed / totalTests) * 100,
    details: testResults
  };
}

// Run the test
testMiddlewareAuthentication()
  .then(results => {
    console.log('\n✅ Test completed successfully');
    process.exit(results.totalFailed === 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });