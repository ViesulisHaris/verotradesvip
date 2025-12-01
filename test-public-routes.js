const puppeteer = require('puppeteer');

async function testPublicRoutes() {
  console.log('🌐 Testing public routes accessibility without authentication...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test login page (should be accessible)
    console.log('📍 Testing /login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    const loginUrl = page.url();
    console.log('Login page URL:', loginUrl);
    
    // Test register page (should be accessible)
    console.log('📍 Testing /register page...');
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle2' });
    const registerUrl = page.url();
    console.log('Register page URL:', registerUrl);
    
    // Test root redirect (should redirect to login when not authenticated)
    console.log('📍 Testing root path /...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    const rootUrl = page.url();
    console.log('Root path redirect URL:', rootUrl);
    
    // Test protected route when not authenticated (should redirect to login)
    console.log('📍 Testing protected route /dashboard without authentication...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    const protectedUrl = page.url();
    console.log('Protected route redirect URL:', protectedUrl);
    
    // Evaluate results
    const results = {
      loginAccessible: loginUrl.includes('/login'),
      registerAccessible: registerUrl.includes('/register'),
      rootRedirectsToLogin: rootUrl.includes('/login'),
      protectedRedirectsToLogin: protectedUrl.includes('/login') && protectedUrl.includes('redirectedFrom')
    };
    
    console.log('\n📊 Test Results:');
    console.log('✅ Login page accessible:', results.loginAccessible);
    console.log('✅ Register page accessible:', results.registerAccessible);
    console.log('✅ Root redirects to login:', results.rootRedirectsToLogin);
    console.log('✅ Protected routes redirect to login:', results.protectedRedirectsToLogin);
    
    const allPassed = Object.values(results).every(result => result === true);
    console.log('\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED!'));
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

testPublicRoutes();