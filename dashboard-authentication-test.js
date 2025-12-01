// Comprehensive Authentication and Dashboard Test
// This test will verify that the authentication fixes work correctly

const puppeteer = require('puppeteer');

async function testAuthenticationFlow() {
  console.log('🔍 [AUTH_TEST] Starting comprehensive authentication test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('🔍 [BROWSER] Console:', msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.error('🔍 [BROWSER] Page error:', error.message);
  });
  
  try {
    console.log('🔍 [AUTH_TEST] Navigating to dashboard...');
    await page.goto('http://localhost:3001/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load and check if we get dashboard or login
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log('🔍 [AUTH_TEST] Current URL after navigation:', currentUrl);
    
    // Check if we're on dashboard or login page
    const isOnDashboard = currentUrl.includes('/dashboard');
    const isOnLogin = currentUrl.includes('/login');
    
    console.log('🔍 [AUTH_TEST] Page analysis:', {
      isOnDashboard,
      isOnLogin,
      currentUrl
    });
    
    if (isOnDashboard) {
      console.log('✅ [AUTH_TEST] SUCCESS: User is on dashboard page!');
      console.log('🔍 [AUTH_TEST] Authentication is working correctly');
      
      // Check for dashboard content
      const dashboardContent = await page.evaluate(() => {
        const dashboardElement = document.querySelector('.min-h-screen');
        const cards = document.querySelectorAll('.card-unified');
        const headers = document.querySelectorAll('h1, h2, h3');
        const textElements = document.querySelectorAll('p, span');
        
        return {
          hasDashboard: !!dashboardElement,
          cardsCount: cards.length,
          headersCount: headers.length,
          textElementsCount: textElements.length,
          dashboardVisible: dashboardElement ? window.getComputedStyle(dashboardElement).display !== 'none' : false
        };
      });
      
      console.log('🔍 [AUTH_TEST] Dashboard content analysis:', dashboardContent);
      
      if (dashboardContent.cardsCount > 0) {
        console.log('✅ [AUTH_TEST] Dashboard is rendering content properly!');
      } else {
        console.log('❌ [AUTH_TEST] Dashboard has no content cards');
      }
      
    } else {
      console.log('❌ [AUTH_TEST] User was redirected to login page');
      console.log('🔍 [AUTH_TEST] This indicates authentication is still failing');
    }
    
    // Take screenshot for verification
    const screenshot = await page.screenshot({ 
      path: 'dashboard-auth-test-result.png',
      fullPage: true 
    });
    
    console.log('🔍 [AUTH_TEST] Screenshot saved for verification');
    
  } catch (error) {
    console.error('🔍 [AUTH_TEST] Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthenticationFlow().catch(console.error);