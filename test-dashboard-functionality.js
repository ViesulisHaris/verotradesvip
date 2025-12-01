const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🧪 Testing Dashboard functionality...');
    
    // Navigate to the dashboard page
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for either the dashboard content, login form, or auth loading spinner
    await Promise.race([
      page.waitForSelector('.verotrade-content-wrapper', { timeout: 30000 }),
      page.waitForSelector('form', { timeout: 10000 }),
      page.waitForSelector('.animate-spin', { timeout: 10000 })
    ]);
    
    // Check if we're on the login page
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('🔐 Login page detected, attempting to authenticate...');
      
      // Fill in login credentials (you may need to adjust these)
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Wait for dashboard to load after login
      await page.waitForSelector('.verotrade-content-wrapper', { timeout: 30000 });
      console.log('✅ Authentication successful, dashboard loaded');
    } else {
      // Check if we're still in authentication loading state
      const authLoading = await page.$('.animate-spin');
      if (authLoading) {
        console.log('⏳ Authentication loading, waiting for completion...');
        // Wait for auth to complete
        await page.waitForSelector('.verotrade-content-wrapper', { timeout: 30000 });
        console.log('✅ Authentication completed, dashboard loaded');
      } else {
        console.log('✅ Dashboard loaded without authentication');
      }
    }
    
    // Check if the dashboard loaded successfully
    const dashboardContent = await page.textContent('.verotrade-content-wrapper');
    
    if (dashboardContent) {
      console.log('✅ Dashboard content loaded successfully');
      
      // Check for loading state
      const loadingSpinner = await page.$('.animate-spin');
      if (loadingSpinner) {
        console.log('⚠️  Loading spinner still present - possible infinite loading');
      } else {
        console.log('✅ No loading spinner detected - dashboard loaded properly');
      }
      
      // Check for error state
      const errorMessage = await page.$('text=Error Loading Dashboard');
      if (errorMessage) {
        console.log('⚠️  Error message detected on dashboard');
      } else {
        console.log('✅ No error message detected on dashboard');
      }
      
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
      await page.screenshot({ path: 'dashboard-test-result.png' });
      console.log('📸 Screenshot saved as dashboard-test-result.png');
      
      console.log('\n🎉 Dashboard functionality test completed successfully!');
    } else {
      console.log('❌ Dashboard content not found');
    }
    
  } catch (error) {
    console.error('❌ Error testing Dashboard functionality:', error);
    
    // Take a screenshot of the error state
    await page.screenshot({ path: 'dashboard-error-state.png' });
    console.log('📸 Error screenshot saved as dashboard-error-state.png');
  } finally {
    await browser.close();
  }
})();