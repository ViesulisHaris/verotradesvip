const puppeteer = require('puppeteer');

async function simpleAuthTest() {
  console.log('🔧 Starting Simple AuthContext Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', (msg) => {
    const logText = msg.text();
    consoleLogs.push(logText);
    
    // Filter for AuthContext related logs
    if (logText.includes('AuthContext') || logText.includes('AUTH_CONTEXT_FIX') || logText.includes('AUTH_LAYOUT_DEBUG')) {
      console.log(`📝 [CONSOLE] ${logText}`);
    }
    
    // Look for errors
    if (logText.includes('🚨') || logText.includes('Error') || logText.includes('undefined')) {
      console.log(`❌ [ERROR] ${logText}`);
    }
  });
  
  // Capture page errors
  page.on('pageerror', (error) => {
    console.log(`🚨 [PAGE_ERROR] ${error.message}`);
  });
  
  try {
    console.log('📍 Step 1: Testing basic page load...');
    
    // Try to navigate to a simple page first
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if page loaded successfully (not 500 error)
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);
    
    // Check for AuthContext errors
    const authContextErrors = consoleLogs.filter(log => 
      log.includes('AuthContext is undefined') && 
      log.includes('hasProvider: false')
    );
    
    console.log(`📊 AuthContext undefined errors: ${authContextErrors.length}`);
    
    // Check for provider duplication
    const providerLogs = consoleLogs.filter(log => 
      log.includes('AuthContextProviderSimple rendering')
    );
    
    console.log(`📊 AuthContextProvider instances: ${providerLogs.length}`);
    
    // Try to find login form elements
    try {
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      const submitButton = await page.$('button[type="submit"]');
      
      console.log(`📝 Form elements found: Email=${!!emailInput}, Password=${!!passwordInput}, Submit=${!!submitButton}`);
      
      if (emailInput && passwordInput && submitButton) {
        console.log('✅ PASSED: Login form is present and accessible');
        
        // Try to fill the form
        await emailInput.type('Testuser1000@verotrade.com', { delay: 100 });
        await passwordInput.type('TestPassword123!', { delay: 100 });
        
        console.log('✅ PASSED: Form can be filled');
        
        // Try to submit
        await submitButton.click();
        
        console.log('✅ PASSED: Form can be submitted');
        
        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check where we ended up
        const finalUrl = page.url();
        console.log(`📍 Final URL after login: ${finalUrl}`);
        
        if (finalUrl.includes('/dashboard')) {
          console.log('✅ PASSED: Successfully redirected to dashboard');
        } else if (finalUrl.includes('/login')) {
          console.log('❌ FAILED: Still on login page after submission');
        } else {
          console.log(`⚠️  WARNING: Redirected to unexpected page: ${finalUrl}`);
        }
        
      } else {
        console.log('❌ FAILED: Login form elements not found');
      }
      
    } catch (formError) {
      console.log(`❌ FAILED: Error interacting with login form: ${formError.message}`);
    }
    
    // Generate final report
    const report = {
      timestamp: new Date().toISOString(),
      pageTitle,
      authContextErrors: authContextErrors.length,
      providerInstances: providerLogs.length,
      loginFormPresent: !!(await page.$('input[type="email"]')),
      consoleLogs: consoleLogs.filter(log => 
        log.includes('AuthContext') || 
        log.includes('AUTH_CONTEXT_FIX') || 
        log.includes('AUTH_LAYOUT_DEBUG') ||
        log.includes('🚨')
      )
    };
    
    console.log('\n📋 SIMPLE AUTH TEST REPORT:');
    console.log('===========================');
    console.log(`✅ Page Loaded: ${pageTitle !== 'Error' ? 'YES' : 'NO'}`);
    console.log(`✅ AuthContext Errors: ${authContextErrors.length === 0 ? 'FIXED' : 'STILL BROKEN'}`);
    console.log(`✅ Provider Duplication: ${providerLogs.length <= 1 ? 'FIXED' : 'STILL BROKEN'}`);
    console.log(`✅ Login Form Available: ${report.loginFormPresent ? 'YES' : 'NO'}`);
    
    const overallStatus = authContextErrors.length === 0 && 
                         providerLogs.length <= 1 && 
                         report.loginFormPresent;
    
    console.log(`\n🎯 OVERALL STATUS: ${overallStatus ? '✅ FIXES WORKING' : '❌ ISSUES REMAIN'}`);
    
    // Save report to file
    const fs = require('fs');
    fs.writeFileSync(
      'simple-auth-test-report.json', 
      JSON.stringify(report, null, 2)
    );
    console.log('\n📄 Detailed report saved to: simple-auth-test-report.json');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
simpleAuthTest().catch(console.error);