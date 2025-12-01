const puppeteer = require('puppeteer');

async function testBrowserAuthentication() {
  console.log('🔍 Starting Browser Authentication Test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to the authentication diagnosis page
  console.log('📄 Navigating to authentication diagnosis page...');
  await page.goto('http://localhost:3000/test-authentication-diagnosis');
  
  // Wait for the page to load and run the diagnosis
  await page.waitForTimeout(3000);
  
  // Get the environment status from the page
  const envStatus = await page.evaluate(() => {
    const envElements = document.querySelectorAll('.glass .text-green-400, .glass .text-red-400');
    return Array.from(envElements).map(el => el.textContent);
  });
  
  // Get the diagnosis results from the page
  const diagnosisResults = await page.evaluate(() => {
    const resultElements = document.querySelectorAll('.bg-black\\/30 .text-green-300, .bg-black\\/30 .text-red-400, .bg-black\\/30 .text-blue-400');
    return Array.from(resultElements).map(el => el.textContent);
  });
  
  console.log('\n=== ENVIRONMENT STATUS ===');
  envStatus.forEach(status => console.log(status));
  
  console.log('\n=== DIAGNOSIS RESULTS ===');
  diagnosisResults.forEach(result => console.log(result));
  
  // Check for specific issues
  const hasSupabaseKeyError = diagnosisResults.some(result => 
    result.includes('supabaseKey is required')
  );
  
  const hasMissingEnvVars = envStatus.some(status => 
    status.includes('MISSING') && status.includes('NEXT_PUBLIC')
  );
  
  const hasConnectionSuccess = diagnosisResults.some(result => 
    result.includes('✅ Basic connection test successful')
  );
  
  const hasAuthSuccess = diagnosisResults.some(result => 
    result.includes('✅ Active session found')
  );
  
  const hasDeletionSuccess = diagnosisResults.some(result => 
    result.includes('✅ Strategy deletion test successful')
  );
  
  console.log('\n=== ANALYSIS ===');
  console.log(`Supabase Key Error: ${hasSupabaseKeyError ? '❌ YES' : '✅ NO'}`);
  console.log(`Missing Environment Variables: ${hasMissingEnvVars ? '❌ YES' : '✅ NO'}`);
  console.log(`Connection Success: ${hasConnectionSuccess ? '✅ YES' : '❌ NO'}`);
  console.log(`Authentication Success: ${hasAuthSuccess ? '✅ YES' : '❌ NO'}`);
  console.log(`Strategy Deletion Success: ${hasDeletionSuccess ? '✅ YES' : '❌ NO'}`);
  
  // Test login functionality
  console.log('\n🔍 Testing Login Functionality...');
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(2000);
  
  // Fill in login form
  await page.type('input[type="email"]', 'testuser@verotrade.com');
  await page.type('input[type="password"]', 'TestPassword123!');
  
  // Submit login form
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Check if login was successful
  const currentUrl = page.url();
  const loginSuccessful = currentUrl.includes('/dashboard');
  
  console.log(`Login Successful: ${loginSuccessful ? '✅ YES' : '❌ NO'}`);
  console.log(`Current URL: ${currentUrl}`);
  
  if (loginSuccessful) {
    // Test strategy deletion
    console.log('\n🔍 Testing Strategy Deletion...');
    await page.goto('http://localhost:3000/strategies');
    await page.waitForTimeout(3000);
    
    // Check if strategies are displayed
    const strategiesFound = await page.evaluate(() => {
      const strategyCards = document.querySelectorAll('[data-testid="strategy-card"], .glass');
      return strategyCards.length > 0;
    });
    
    console.log(`Strategies Found: ${strategiesFound ? '✅ YES' : '❌ NO'}`);
    
    if (strategiesFound) {
      // Try to find and click a delete button
      const deleteButtonFound = await page.evaluate(() => {
        const deleteButtons = document.querySelectorAll('button[title="Delete Strategy"]');
        return deleteButtons.length > 0;
      });
      
      console.log(`Delete Button Found: ${deleteButtonFound ? '✅ YES' : '❌ NO'}`);
      
      if (deleteButtonFound) {
        // Note: We won't actually delete, just test that the button exists and is clickable
        console.log('✅ Strategy deletion functionality is accessible');
      }
    }
  }
  
  // Final assessment
  console.log('\n=== FINAL ASSESSMENT ===');
  if (hasSupabaseKeyError || hasMissingEnvVars) {
    console.log('🚨 CRITICAL ISSUES FOUND:');
    console.log('1. Environment variables are not properly loaded in browser context');
    console.log('2. This is causing "supabaseKey is required" errors');
    console.log('3. SOLUTION: Restart development server and ensure .env file is properly configured');
  } else if (hasConnectionSuccess && loginSuccessful && strategiesFound) {
    console.log('✅ AUTHENTICATION SYSTEM WORKING CORRECTLY!');
    console.log('✅ Environment variables are properly loaded');
    console.log('✅ Supabase connection is working');
    console.log('✅ User authentication is working');
    console.log('✅ Strategy functionality is accessible');
  } else {
    console.log('⚠️ PARTIAL SUCCESS - Some issues remain');
    console.log('Further investigation needed for specific components');
  }
  
  await browser.close();
}

testBrowserAuthentication().catch(console.error);