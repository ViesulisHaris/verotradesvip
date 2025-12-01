const puppeteer = require('puppeteer');

async function testAuthenticationDiagnosis() {
  console.log('🔍 Starting Authentication Diagnosis Test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to the authentication diagnosis page
  await page.goto('http://localhost:3000/test-authentication-diagnosis');
  
  // Wait for the page to load and run the diagnosis
  await page.waitForTimeout(3000);
  
  // Get the environment status
  const envStatus = await page.evaluate(() => {
    const envElements = document.querySelectorAll('.glass p');
    return Array.from(envElements).map(el => el.textContent);
  });
  
  // Get the diagnosis results
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
  
  const hasMissingEnvVars = diagnosisResults.some(result => 
    result.includes('MISSING') && result.includes('NEXT_PUBLIC')
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
  
  if (hasSupabaseKeyError || hasMissingEnvVars) {
    console.log('\n🚨 CRITICAL ISSUES FOUND:');
    console.log('1. Environment variables are not properly loaded');
    console.log('2. Check .env file configuration');
    console.log('3. Restart development server');
  } else if (hasConnectionSuccess && hasAuthSuccess && hasDeletionSuccess) {
    console.log('\n✅ ALL TESTS PASSED - Authentication is working correctly!');
  } else {
    console.log('\n⚠️ PARTIAL SUCCESS - Some issues remain');
  }
  
  await browser.close();
}

testAuthenticationDiagnosis().catch(console.error);