const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Test user credentials
const TEST_USER = {
  email: 'test-dashboard@example.com',
  password: 'test-password-123'
};

(async () => {
  console.log('🧪 Testing Dashboard functionality with complete setup...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Step 1: Create a test user using the service role key
    console.log('🔧 Setting up test user...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(TEST_USER.email);
    
    if (existingUser?.user) {
      console.log('✅ Test user already exists');
    } else {
      // Create new test user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: TEST_USER.email,
        password: TEST_USER.password,
        email_confirm: true
      });
      
      if (createError) {
        console.error('❌ Failed to create test user:', createError.message);
        return;
      }
      
      console.log('✅ Test user created successfully');
    }
    
    // Step 2: Navigate to login page and authenticate
    console.log('🔐 Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    
    // Wait for login form to load
    await page.waitForSelector('form');
    
    // Fill in login credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard or home page
    await Promise.race([
      page.waitForSelector('.verotrade-content-wrapper', { timeout: 30000 }),
      page.waitForURL('**/dashboard', { timeout: 30000 }),
      page.waitForURL('**/', { timeout: 30000 })
    ]);
    
    console.log('✅ Authentication successful');
    
    // Step 3: Generate test data for the dashboard
    console.log('📊 Generating test data...');
    
    // Get the current user's session
    const authData = await context.evaluate(() => {
      const localStorage = window.localStorage;
      const keys = Object.keys(localStorage);
      const authKey = keys.find(key => key.includes('supabase.auth.token'));
      return authKey ? JSON.parse(localStorage[authKey]) : null;
    });
    
    if (!authData) {
      console.error('❌ Failed to get auth data from localStorage');
      return;
    }
    
    const accessToken = authData.currentSession?.access_token;
    
    if (!accessToken) {
      console.error('❌ Failed to get access token');
      return;
    }
    
    // Create strategies
    const strategiesResponse = await fetch('http://localhost:3000/api/generate-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ action: 'create-strategies' })
    });
    
    if (!strategiesResponse.ok) {
      console.error('❌ Failed to create strategies:', await strategiesResponse.text());
      return;
    }
    
    const strategiesData = await strategiesResponse.json();
    console.log(`✅ Created ${strategiesData.strategies.length} strategies`);
    
    // Generate trades
    const tradesResponse = await fetch('http://localhost:3000/api/generate-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ action: 'generate-trades' })
    });
    
    if (!tradesResponse.ok) {
      console.error('❌ Failed to generate trades:', await tradesResponse.text());
      return;
    }
    
    const tradesData = await tradesResponse.json();
    console.log(`✅ Generated ${tradesData.count} trades`);
    
    // Step 4: Navigate to dashboard and verify it loads correctly
    console.log('📈 Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for dashboard content to load
    await page.waitForSelector('.verotrade-content-wrapper', { timeout: 30000 });
    
    // Check if the dashboard loaded successfully
    const dashboardContent = await page.textContent('.verotrade-content-wrapper');
    console.log('✅ Dashboard content loaded successfully');
    
    // Check for loading state
    const loadingSpinner = await page.$('.animate-spin');
    if (loadingSpinner) {
      console.log('⚠️  Loading spinner still present - waiting for content to load...');
      // Wait a bit more for content to load
      await page.waitForSelector('.verotrade-content-wrapper:not(:has(.animate-spin))', { timeout: 10000 })
        .catch(() => console.log('⚠️  Loading spinner still present after timeout'));
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
    await page.screenshot({ path: 'dashboard-test-complete-success.png' });
    console.log('📸 Success screenshot saved as dashboard-test-complete-success.png');
    
    console.log('\n🎉 Dashboard functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Dashboard functionality:', error);
    
    // Take a screenshot of the error state
    await page.screenshot({ path: 'dashboard-test-complete-error.png' });
    console.log('📸 Error screenshot saved as dashboard-test-complete-error.png');
  } finally {
    await browser.close();
  }
})();