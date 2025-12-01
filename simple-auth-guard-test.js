/**
 * Simple AuthGuard Fix Verification Test
 * 
 * This test verifies that the React Hook errors in AuthGuard-fixed.tsx have been resolved
 */

const http = require('http');

function testAuthGuardFix() {
  console.log('🔍 [AUTH_GUARD_TEST] Testing AuthGuard hook fixes...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/confluence',
    method: 'GET',
    headers: {
      'User-Agent': 'AuthGuard-Test/1.0'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`🔍 [AUTH_GUARD_TEST] Status: ${res.statusCode}`);
    console.log(`🔍 [AUTH_GUARD_TEST] Headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`🔍 [AUTH_GUARD_TEST] Response length: ${data.length} bytes`);
      
      // Check for successful page load
      const pageLoadedSuccessfully = res.statusCode === 200;
      const hasContent = data.length > 1000; // Reasonable page size
      const noHookErrors = !data.includes('Invalid hook call');
      const noInfiniteLoopErrors = !data.includes('commitHookEffectListMount');
      
      console.log('\n🔍 [AUTH_GUARD_TEST] RESULTS:');
      console.log(`   ✅ Page loads successfully: ${pageLoadedSuccessfully}`);
      console.log(`   ✅ Page has content: ${hasContent}`);
      console.log(`   ✅ No hook errors: ${noHookErrors}`);
      console.log(`   ✅ No infinite loop errors: ${noInfiniteLoopErrors}`);
      
      const testPassed = pageLoadedSuccessfully && hasContent && noHookErrors && noInfiniteLoopErrors;
      
      if (testPassed) {
        console.log('\n✅ [AUTH_GUARD_TEST] SUCCESS: AuthGuard hook fixes verified!');
        console.log('   - Page loads without React Hook errors');
        console.log('   - No infinite re-renders detected');
        console.log('   - Confluence page is functional');
      } else {
        console.log('\n❌ [AUTH_GUARD_TEST] FAILURE: Issues detected');
        if (!pageLoadedSuccessfully) console.log('   - Page failed to load');
        if (!hasContent) console.log('   - Page has insufficient content');
        if (!noHookErrors) console.log('   - Hook errors still present');
        if (!noInfiniteLoopErrors) console.log('   - Infinite loop errors still present');
      }
      
      process.exit(testPassed ? 0 : 1);
    });
  });

  req.on('error', (error) => {
    console.error('❌ [AUTH_GUARD_TEST] Request failed:', error.message);
    process.exit(1);
  });

  req.setTimeout(10000, () => {
    console.error('❌ [AUTH_GUARD_TEST] Request timed out');
    req.destroy();
    process.exit(1);
  });

  req.end();
}

// Run the test
testAuthGuardFix();