// Session Persistence Validation Test
// This test validates that the session persistence fixes are working correctly

const puppeteer = require('puppeteer');

async function runSessionPersistenceTest() {
  console.log('🔍 Starting Session Persistence Validation Test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to the app and check initial auth state
    console.log('📊 Step 1: Checking initial authentication state...');
    await page.goto('http://localhost:3000/test-session-persistence');
    
    // Wait for the diagnostic page to load
    await page.waitForSelector('.min-h-screen', { timeout: 10000 });
    
    // Wait for diagnostics to complete (5 seconds monitoring + processing)
    await page.waitForTimeout(7000);
    
    // Get diagnostic results
    const diagnosticResults = await page.evaluate(() => {
      const preElement = document.querySelector('pre');
      if (preElement) {
        try {
          return JSON.parse(preElement.textContent);
        } catch (e) {
          return { error: 'Failed to parse diagnostic results', raw: preElement.textContent };
        }
      }
      return { error: 'No diagnostic results found' };
    });
    
    console.log('📊 Initial Diagnostic Results:', JSON.stringify(diagnosticResults, null, 2));
    
    // Step 2: Test session recovery
    console.log('🔄 Step 2: Testing session recovery...');
    await page.click('button:contains("Test Session Recovery")');
    await page.waitForTimeout(2000);
    
    // Handle alert
    page.on('dialog', async dialog => {
      console.log('🔔 Session Recovery Alert:', dialog.message());
      await dialog.accept();
    });
    
    // Step 3: Refresh page to test persistence
    console.log('🔄 Step 3: Testing page refresh persistence...');
    await page.reload();
    await page.waitForSelector('.min-h-screen', { timeout: 10000 });
    await page.waitForTimeout(7000);
    
    // Get post-refresh diagnostic results
    const postRefreshResults = await page.evaluate(() => {
      const preElement = document.querySelector('pre');
      if (preElement) {
        try {
          return JSON.parse(preElement.textContent);
        } catch (e) {
          return { error: 'Failed to parse diagnostic results', raw: preElement.textContent };
        }
      }
      return { error: 'No diagnostic results found' };
    });
    
    console.log('📊 Post-Refresh Diagnostic Results:', JSON.stringify(postRefreshResults, null, 2));
    
    // Step 4: Analyze results
    console.log('📊 Step 4: Analyzing session persistence...');
    
    const analysis = {
      initialDataLoss: diagnosticResults.tests?.dataLoss || { localStorage: 0, sessionStorage: 0 },
      postRefreshDataLoss: postRefreshResults.tests?.dataLoss || { localStorage: 0, sessionStorage: 0 },
      initialSession: diagnosticResults.tests?.currentSession?.hasSession || false,
      postRefreshSession: postRefreshResults.tests?.currentSession?.hasSession || false,
      storageOperationsCount: diagnosticResults.tests?.storageOperations?.length || 0,
      localStorageKeysBefore: diagnosticResults.tests?.localStorageBefore?.supabaseKeys?.length || 0,
      localStorageKeysAfter: diagnosticResults.tests?.localStorageAfter?.supabaseKeys?.length || 0,
      postRefreshLocalStorageKeys: postRefreshResults.tests?.localStorageBefore?.supabaseKeys?.length || 0
    };
    
    console.log('📊 Session Persistence Analysis:', JSON.stringify(analysis, null, 2));
    
    // Determine if session persistence is working
    const isSessionPersisting = analysis.initialSession && analysis.postRefreshSession;
    const hasDataLoss = analysis.initialDataLoss.localStorage > 0 || analysis.initialDataLoss.sessionStorage > 0;
    const hasStorageOperations = analysis.storageOperationsCount > 0;
    
    console.log('\n🎯 SESSION PERSISTENCE VALIDATION RESULTS:');
    console.log('='.repeat(60));
    console.log(`✅ Session persists after refresh: ${isSessionPersisting ? 'YES' : 'NO'}`);
    console.log(`⚠️  Data loss detected: ${hasDataLoss ? 'YES' : 'NO'}`);
    console.log(`🔧 Storage operations detected: ${hasStorageOperations ? 'YES' : 'NO'}`);
    console.log(`📊 LocalStorage keys before: ${analysis.localStorageKeysBefore}`);
    console.log(`📊 LocalStorage keys after: ${analysis.localStorageKeysAfter}`);
    console.log(`📊 LocalStorage keys post-refresh: ${analysis.postRefreshLocalStorageKeys}`);
    
    if (isSessionPersisting && !hasDataLoss) {
      console.log('\n🎉 SUCCESS: Session persistence is working correctly!');
    } else if (isSessionPersisting && hasDataLoss) {
      console.log('\n⚠️  PARTIAL SUCCESS: Session persists but data loss detected');
    } else {
      console.log('\n❌ FAILURE: Session persistence is not working');
    }
    
    return {
      success: isSessionPersisting && !hasDataLoss,
      analysis,
      diagnosticResults,
      postRefreshResults
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
runSessionPersistenceTest().then(result => {
  console.log('\n🏁 Test completed with result:', result.success ? 'SUCCESS' : 'FAILURE');
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});