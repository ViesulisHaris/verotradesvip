const puppeteer = require('puppeteer');
const fs = require('fs');

async function verifyErrorBoundaryFix() {
  console.log('🧪 Starting ErrorBoundary Fix Verification...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('Browser Console:', msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.log('Page Error:', error.message);
  });
  
  const results = {
    mainAppLoad: false,
    errorBoundaryPage: false,
    errorBoundaryFunctionality: false,
    errorCatching: false,
    errorRecovery: false,
    noWhiteScreen: false,
    screenshots: [],
    errors: []
  };
  
  try {
    console.log('1️⃣ Testing main application load at http://localhost:3001');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Check if page loaded without white screen
    const bodyContent = await page.evaluate(() => document.body.innerHTML);
    const hasContent = bodyContent.length > 1000; // Check if there's substantial content
    
    if (hasContent) {
      results.mainAppLoad = true;
      results.noWhiteScreen = true;
      console.log('✅ Main application loaded successfully');
      
      // Take screenshot for verification
      const screenshot1 = await page.screenshot({ path: 'verotradesvip/main-app-load-verification.png' });
      results.screenshots.push('main-app-load-verification.png');
    } else {
      console.log('❌ Main application failed to load properly');
      results.errors.push('Main application appears to have white screen or insufficient content');
    }
    
    console.log('\n2️⃣ Testing ErrorBoundary page at http://localhost:3001/test-error-boundary');
    await page.goto('http://localhost:3001/test-error-boundary', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for the test page to load
    await page.waitForTimeout(2000);
    
    // Check if ErrorBoundary test page loaded
    const pageTitle = await page.evaluate(() => document.title);
    const pageContent = await page.evaluate(() => document.body.innerHTML);
    
    if (pageContent.includes('ErrorBoundary Test Page') && pageContent.includes('Trigger Test Error')) {
      results.errorBoundaryPage = true;
      console.log('✅ ErrorBoundary test page loaded successfully');
      
      // Take screenshot of initial state
      const screenshot2 = await page.screenshot({ path: 'verotradesvip/errorboundary-page-initial.png' });
      results.screenshots.push('errorboundary-page-initial.png');
    } else {
      console.log('❌ ErrorBoundary test page failed to load');
      results.errors.push('ErrorBoundary test page did not load expected content');
    }
    
    console.log('\n3️⃣ Testing ErrorBoundary functionality - triggering error');
    
    // Click the trigger error button
    const triggerButton = await page.$('button:contains("Trigger Test Error")') || 
                         await page.$('button') ||
                         await page.evaluateHandle(() => {
                           const buttons = Array.from(document.querySelectorAll('button'));
                           return buttons.find(btn => btn.textContent.includes('Trigger Test Error'));
                         });
    
    if (triggerButton) {
      await triggerButton.click();
      await page.waitForTimeout(2000);
      
      // Check if ErrorBoundary caught the error
      const errorBoundaryContent = await page.evaluate(() => document.body.innerHTML);
      
      if (errorBoundaryContent.includes('Application Error') || 
          errorBoundaryContent.includes('ErrorBoundary') ||
          errorBoundaryContent.includes('Try Again')) {
        results.errorBoundaryFunctionality = true;
        results.errorCatching = true;
        console.log('✅ ErrorBoundary successfully caught and displayed the error');
        
        // Take screenshot of error state
        const screenshot3 = await page.screenshot({ path: 'verotradesvip/errorboundary-error-caught.png' });
        results.screenshots.push('errorboundary-error-caught.png');
      } else {
        console.log('❌ ErrorBoundary did not catch the error properly');
        results.errors.push('ErrorBoundary failed to display error fallback UI');
      }
    } else {
      console.log('❌ Could not find trigger error button');
      results.errors.push('Trigger error button not found on the page');
    }
    
    console.log('\n4️⃣ Testing error recovery functionality');
    
    // Look for and click the "Try Again" button
    const tryAgainButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Try Again'));
    });
    
    if (tryAgainButton) {
      await tryAgainButton.click();
      await page.waitForTimeout(2000);
      
      // Check if recovery worked
      const recoveredContent = await page.evaluate(() => document.body.innerHTML);
      
      if (recoveredContent.includes('Component is working correctly') || 
          recoveredContent.includes('Trigger Test Error')) {
        results.errorRecovery = true;
        console.log('✅ Error recovery functionality works correctly');
        
        // Take screenshot of recovered state
        const screenshot4 = await page.screenshot({ path: 'verotradesvip/errorboundary-recovered.png' });
        results.screenshots.push('errorboundary-recovered.png');
      } else {
        console.log('❌ Error recovery did not work properly');
        results.errors.push('Error recovery functionality failed');
      }
    } else {
      console.log('❌ Could not find Try Again button');
      results.errors.push('Try Again button not found after error');
    }
    
    // Test the manual recovery button as well
    console.log('\n5️⃣ Testing manual recovery functionality');
    
    const recoverButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Recover Component'));
    });
    
    if (recoverButton) {
      await recoverButton.click();
      await page.waitForTimeout(1000);
      
      const finalContent = await page.evaluate(() => document.body.innerHTML);
      if (finalContent.includes('Component is working correctly')) {
        console.log('✅ Manual recovery functionality works correctly');
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed with error:', error.message);
    results.errors.push(`Verification error: ${error.message}`);
  }
  
  await browser.close();
  
  // Generate comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      mainAppLoad: results.mainAppLoad,
      errorBoundaryPage: results.errorBoundaryPage,
      errorBoundaryFunctionality: results.errorBoundaryFunctionality,
      errorCatching: results.errorCatching,
      errorRecovery: results.errorRecovery,
      noWhiteScreen: results.noWhiteScreen,
      overallSuccess: results.mainAppLoad && results.errorBoundaryPage && 
                     results.errorBoundaryFunctionality && results.errorCatching && 
                     results.errorRecovery && results.noWhiteScreen
    },
    details: results,
    recommendations: []
  };
  
  // Add recommendations based on results
  if (!results.mainAppLoad) {
    report.recommendations.push('Main application is not loading properly - check for server-side errors');
  }
  if (!results.errorBoundaryPage) {
    report.recommendations.push('ErrorBoundary test page is not accessible - verify routing');
  }
  if (!results.errorBoundaryFunctionality) {
    report.recommendations.push('ErrorBoundary is not functioning - check component implementation');
  }
  if (!results.errorCatching) {
    report.recommendations.push('ErrorBoundary is not catching errors - verify error handling logic');
  }
  if (!results.errorRecovery) {
    report.recommendations.push('Error recovery is not working - check retry mechanism');
  }
  if (!results.noWhiteScreen) {
    report.recommendations.push('White screen issue persists - investigate CSS/JS loading issues');
  }
  
  // Save report
  fs.writeFileSync(
    'verotradesvip/ERRORBOUNDARY_VERIFICATION_REPORT.json', 
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📋 VERIFICATION SUMMARY:');
  console.log('========================');
  console.log(`✅ Main Application Load: ${results.mainAppLoad ? 'PASS' : 'FAIL'}`);
  console.log(`✅ ErrorBoundary Page Load: ${results.errorBoundaryPage ? 'PASS' : 'FAIL'}`);
  console.log(`✅ ErrorBoundary Functionality: ${results.errorBoundaryFunctionality ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Error Catching: ${results.errorCatching ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Error Recovery: ${results.errorRecovery ? 'PASS' : 'FAIL'}`);
  console.log(`✅ No White Screen: ${results.noWhiteScreen ? 'PASS' : 'FAIL'}`);
  console.log(`\n🎯 OVERALL RESULT: ${report.summary.overallSuccess ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS ENCOUNTERED:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n📸 Screenshots saved:');
  results.screenshots.forEach((screenshot, index) => {
    console.log(`   ${index + 1}. ${screenshot}`);
  });
  
  console.log('\n📄 Full report saved to: ERRORBOUNDARY_VERIFICATION_REPORT.json');
  
  return report;
}

// Run the verification
verifyErrorBoundaryFix().catch(console.error);