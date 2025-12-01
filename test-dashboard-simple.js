const { chromium } = require('playwright');

// Test user credentials (use existing test user)
const TEST_USER = {
  email: 'testuser1000@verotrade.com',
  password: 'TestPassword123!'
};

(async () => {
  console.log('🧪 Testing Dashboard functionality with existing user...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate to login page and authenticate
    console.log('🔐 Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    
    // Wait for login form to load
    await page.waitForSelector('form');
    console.log('✅ Login form loaded');
    
    // Fill in login credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Check if we were redirected to dashboard or home page
    const currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    
    // If not on dashboard, navigate to it
    if (!currentUrl.includes('/dashboard')) {
      console.log('📈 Navigating to dashboard...');
      await page.goto('http://localhost:3000/dashboard');
    }
    
    // After successful login, navigate to confluence tab
    console.log('📋 Navigating to confluence tab...');
    
    // Try multiple approaches to click the Confluence tab
    try {
      // First try to click by text
      await page.click('text=Confluence', { timeout: 5000 });
    } catch (error) {
      console.log('⚠️  First click attempt failed, trying alternative selector...');
      
      try {
        // Try to click by selector
        await page.click('a[href*="confluence"]', { timeout: 5000 });
      } catch (error2) {
        console.log('⚠️  Second click attempt failed, trying navigation directly...');
        
        // If clicking fails, navigate directly to the confluence page
        await page.goto('http://localhost:3000/confluence');
      }
    }
    
    await page.waitForLoadState('networkidle');
    
    // Step 2: Wait for dashboard content to load
    console.log('⏳ Waiting for dashboard content to load...');
    
    // Wait for either dashboard content or error/loading state
    await Promise.race([
      page.waitForSelector('.verotrade-content-wrapper', { timeout: 30000 }),
      page.waitForSelector('.animate-spin', { timeout: 10000 }),
      page.waitForSelector('text=Error Loading Dashboard', { timeout: 10000 })
    ]);
    
    // Check current state
    const loadingSpinner = await page.$('.animate-spin');
    const errorMessage = await page.$('text=Error Loading Dashboard');
    const contentWrapper = await page.$('.verotrade-content-wrapper');
    
    if (loadingSpinner) {
      console.log('⚠️  Loading spinner detected - waiting for content to load...');
      // Wait for loading to complete
      await page.waitForSelector('.verotrade-content-wrapper:not(:has(.animate-spin))', { timeout: 30000 })
        .then(() => console.log('✅ Loading completed'))
        .catch(() => console.log('⚠️  Loading timed out - continuing with test'));
    }
    
    if (errorMessage) {
      const errorText = await errorMessage.textContent();
      console.log(`❌ Error message detected: ${errorText}`);
    } else {
      console.log('✅ No error message detected');
    }
    
    if (contentWrapper) {
      console.log('✅ Dashboard content wrapper found');
      
      // Check for key metrics cards
      const metricsCards = await page.$$('.dashboard-card');
      if (metricsCards.length > 0) {
        console.log(`✅ Found ${metricsCards.length} metrics cards`);
      } else {
        console.log('⚠️  No metrics cards found');
      }
      
      // Check for charts
      const charts = await page.$$('.recharts-wrapper');
      if (charts.length > 0) {
        console.log(`✅ Found ${charts.length} charts`);
      } else {
        console.log('⚠️  No charts found');
      }
      
      // Check for recent trades table
      const tradesTable = await page.$('table');
      if (tradesTable) {
        console.log('✅ Recent trades table found');
        
        // Check table rows
        const tableRows = await tradesTable.$$('tbody tr');
        console.log(`✅ Found ${tableRows.length} table rows`);
      } else {
        console.log('⚠️  No recent trades table found');
      }
      
      // Take a screenshot for verification
      await page.screenshot({ path: 'dashboard-test-simple-success.png' });
      console.log('📸 Success screenshot saved as dashboard-test-simple-success.png');
      
      console.log('\n🎉 Dashboard functionality test completed successfully!');
    } else {
      console.log('❌ Dashboard content wrapper not found');
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'dashboard-test-simple-no-content.png' });
      console.log('📸 Debug screenshot saved as dashboard-test-simple-no-content.png');
    }
    
  } catch (error) {
    console.error('❌ Error testing Dashboard functionality:', error);
    
    // Take a screenshot of the error state
    await page.screenshot({ path: 'dashboard-test-simple-error.png' });
    console.log('📸 Error screenshot saved as dashboard-test-simple-error.png');
    
    // Get page content for debugging
    const pageContent = await page.content();
    console.log('Page content snippet:', pageContent.substring(0, 500));
  } finally {
    await browser.close();
  }
})();