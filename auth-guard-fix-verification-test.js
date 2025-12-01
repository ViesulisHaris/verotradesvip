/**
 * AuthGuard Hook Fix Verification Test
 * 
 * This test verifies that the React Hook errors in AuthGuard-fixed.tsx have been resolved
 * and that the component no longer causes infinite re-renders or "Invalid hook call" errors.
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testAuthGuardFix() {
  console.log('🔍 [AUTH_GUARD_FIX_TEST] Starting AuthGuard hook fix verification...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Capture console logs to detect React Hook errors
    const consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
      
      if (msg.type() === 'error') {
        console.log(`❌ [CONSOLE_ERROR] ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      console.log(`❌ [PAGE_ERROR] ${error.message}`);
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack
      });
    });

    // Navigate to the confluence page (where the error was occurring)
    console.log('🔍 [AUTH_GUARD_FIX_TEST] Navigating to confluence page...');
    await page.goto('http://localhost:3000/confluence', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for the page to load and check for React Hook errors
    await page.waitForTimeout(5000);

    // Check for specific React Hook errors
    const hookErrors = consoleMessages.filter(msg => 
      msg.type === 'error' && 
      (msg.text.includes('Invalid hook call') || 
       msg.text.includes('Hooks can only be called') ||
       msg.text.includes('commitHookEffectListMount'))
    );

    // Check for infinite re-render patterns
    const authGuardDebugMessages = consoleMessages.filter(msg => 
      msg.text.includes('AUTH_GUARD_DEBUG')
    );

    // Count AuthGuard render calls to detect infinite loops
    const renderCount = authGuardDebugMessages.length;
    const isInfiniteLoop = renderCount > 10; // More than 10 renders suggests a loop

    console.log('🔍 [AUTH_GUARD_FIX_TEST] Analysis Results:');
    console.log(`   - Total console messages: ${consoleMessages.length}`);
    console.log(`   - React Hook errors: ${hookErrors.length}`);
    console.log(`   - AuthGuard debug messages: ${renderCount}`);
    console.log(`   - Potential infinite loop: ${isInfiniteLoop}`);

    // Check if the page content is visible (not crashed)
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyVisible: document.body ? true : false,
        hasContent: document.body ? document.body.innerText.length > 0 : false
      };
    });

    console.log('🔍 [AUTH_GUARD_FIX_TEST] Page Content Analysis:');
    console.log(`   - Page title: ${pageContent.title}`);
    console.log(`   - Body visible: ${pageContent.bodyVisible}`);
    console.log(`   - Has content: ${pageContent.hasContent}`);

    // Determine test results
    const hasHookErrors = hookErrors.length > 0;
    const hasInfiniteLoop = isInfiniteLoop;
    const pageFunctional = pageContent.bodyVisible && pageContent.hasContent;

    console.log('\n🔍 [AUTH_GUARD_FIX_TEST] FINAL RESULTS:');
    console.log(`   ❌ React Hook errors detected: ${hasHookErrors}`);
    console.log(`   ❌ Infinite re-renders detected: ${hasInfiniteLoop}`);
    console.log(`   ✅ Page functional: ${pageFunctional}`);

    const testPassed = !hasHookErrors && !hasInfiniteLoop && pageFunctional;

    if (testPassed) {
      console.log('\n✅ [AUTH_GUARD_FIX_TEST] SUCCESS: AuthGuard hook fix verified!');
      console.log('   - No React Hook errors detected');
      console.log('   - No infinite re-renders detected');
      console.log('   - Page loads and functions properly');
    } else {
      console.log('\n❌ [AUTH_GUARD_FIX_TEST] FAILURE: Issues still detected');
      if (hasHookErrors) {
        console.log('   - React Hook errors still present:');
        hookErrors.forEach(error => console.log(`     * ${error.text}`));
      }
      if (hasInfiniteLoop) {
        console.log('   - Infinite re-renders still occurring');
      }
      if (!pageFunctional) {
        console.log('   - Page is not functional');
      }
    }

    // Take a screenshot for visual verification
    await page.screenshot({
      path: 'verotradesvip/auth-guard-fix-verification.png',
      fullPage: true
    });

    return {
      passed: testPassed,
      hookErrors: hookErrors.length,
      infiniteLoop: hasInfiniteLoop,
      pageFunctional: pageFunctional,
      renderCount: renderCount
    };

  } catch (error) {
    console.error('❌ [AUTH_GUARD_FIX_TEST] Test failed with error:', error);
    return {
      passed: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthGuardFix().then(results => {
  console.log('\n🔍 [AUTH_GUARD_FIX_TEST] Test completed');
  console.log('Results:', JSON.stringify(results, null, 2));
  
  // Exit with appropriate code
  process.exit(results.passed ? 0 : 1);
}).catch(error => {
  console.error('❌ [AUTH_GUARD_FIX_TEST] Test execution failed:', error);
  process.exit(1);
});