const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE STRATEGY_RULE_COMPLIANCE TEST');
console.log('='.repeat(60));

async function runComprehensiveTest() {
  console.log('\n📋 Starting comprehensive test to identify strategy_rule_compliance error source...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      complianceErrors: 0
    }
  };
  
  // Test 1: Run database diagnostic
  console.log('1️⃣ Running database diagnostic...');
  try {
    const { runComprehensiveDiagnostic } = require('./database-compliance-diagnostic.js');
    const dbResults = await runComprehensiveDiagnostic();
    results.tests.databaseDiagnostic = dbResults;
    results.summary.totalTests++;
    
    const hasComplianceErrors = Object.values(dbResults.checks).some(check => check.hasComplianceError);
    if (hasComplianceErrors) {
      results.summary.complianceErrors++;
      results.summary.failedTests++;
      console.log('   ❌ Database diagnostic found compliance errors');
    } else {
      results.summary.passedTests++;
      console.log('   ✅ Database diagnostic passed');
    }
  } catch (error) {
    console.log('   ❌ Database diagnostic failed:', error.message);
    results.tests.databaseDiagnostic = { success: false, error: error.message };
    results.summary.totalTests++;
    results.summary.failedTests++;
  }
  
  // Test 2: Launch browser and test client-side
  console.log('\n2️⃣ Launching browser for client-side testing...');
  let browser;
  let page;
  
  try {
    browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // Enable console logging
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
      
      if (msg.text().includes('strategy_rule_compliance')) {
        console.log(`   🔍 BROWSER CONSOLE: Found strategy_rule_compliance reference: ${msg.text()}`);
      }
    });
    
    // Enable network logging
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('supabase')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('supabase')) {
        const request = networkRequests.find(req => req.url === response.url());
        if (request) {
          request.status = response.status();
          request.statusText = response.statusText();
          
          if (response.status() >= 400) {
            console.log(`   🔍 NETWORK ERROR: ${request.method} ${request.url} - ${request.status} ${request.statusText}`);
          }
        }
      }
    });
    
    // Navigate to the diagnostic page
    console.log('   🌐 Navigating to diagnostic page...');
    await page.goto('http://localhost:3000/debug-strategy-rule-compliance');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Run diagnostics
    console.log('   🧪 Running client-side diagnostics...');
    await page.click('button:has-text("Run Comprehensive Diagnostics")');
    
    // Wait for diagnostics to complete
    await page.waitForTimeout(10000);
    
    // Check for compliance errors in console
    const complianceConsoleErrors = consoleMessages.filter(msg => 
      msg.text.includes('strategy_rule_compliance') && msg.type === 'error'
    );
    
    // Check for compliance errors in page content
    const pageContent = await page.content();
    const hasComplianceError = pageContent.includes('STRATEGY_RULE_COMPLIANCE ERROR DETECTED');
    
    // Export diagnostic data
    console.log('   💾 Exporting diagnostic data...');
    await page.click('button:has-text("Export Diagnostic Data")');
    await page.waitForTimeout(2000);
    
    results.tests.clientSideDiagnostic = {
      consoleMessages: consoleMessages,
      networkRequests: networkRequests,
      complianceConsoleErrors: complianceConsoleErrors.length,
      hasPageError: hasComplianceError,
      success: complianceConsoleErrors.length === 0 && !hasComplianceError
    };
    
    results.summary.totalTests++;
    if (complianceConsoleErrors.length > 0 || hasComplianceError) {
      results.summary.complianceErrors += complianceConsoleErrors.length;
      results.summary.failedTests++;
      console.log(`   ❌ Client-side diagnostic found ${complianceConsoleErrors.length} compliance errors`);
    } else {
      results.summary.passedTests++;
      console.log('   ✅ Client-side diagnostic passed');
    }
    
    await browser.close();
  } catch (error) {
    console.log('   ❌ Browser test failed:', error.message);
    results.tests.clientSideDiagnostic = { success: false, error: error.message };
    results.summary.totalTests++;
    results.summary.failedTests++;
    
    if (browser) {
      await browser.close();
    }
  }
  
  // Test 3: Test specific user flows that might trigger the error
  console.log('\n3️⃣ Testing specific user flows...');
  try {
    browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    const flowResults = [];
    
    // Flow 1: Login and navigate to strategies
    console.log('   📝 Testing login -> strategies flow...');
    try {
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(2000);
      
      // Try to navigate to strategies (might trigger error)
      await page.goto('http://localhost:3000/strategies');
      await page.waitForTimeout(3000);
      
      const hasError = await page.evaluate(() => {
        return document.body.textContent.includes('strategy_rule_compliance') || 
               document.body.textContent.includes('relation') ||
               document.body.textContent.includes('does not exist');
      });
      
      flowResults.push({
        flow: 'login-to-strategies',
        success: !hasError,
        hasComplianceError: hasError
      });
      
      if (hasError) {
        console.log('   🔍 STRATEGIES PAGE: Found compliance error');
        results.summary.complianceErrors++;
      }
    } catch (error) {
      flowResults.push({
        flow: 'login-to-strategies',
        success: false,
        error: error.message
      });
    }
    
    // Flow 2: Login and navigate to dashboard
    console.log('   📊 Testing login -> dashboard flow...');
    try {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForTimeout(3000);
      
      const hasError = await page.evaluate(() => {
        return document.body.textContent.includes('strategy_rule_compliance') || 
               document.body.textContent.includes('relation') ||
               document.body.textContent.includes('does not exist');
      });
      
      flowResults.push({
        flow: 'login-to-dashboard',
        success: !hasError,
        hasComplianceError: hasError
      });
      
      if (hasError) {
        console.log('   🔍 DASHBOARD PAGE: Found compliance error');
        results.summary.complianceErrors++;
      }
    } catch (error) {
      flowResults.push({
        flow: 'login-to-dashboard',
        success: false,
        error: error.message
      });
    }
    
    // Flow 3: Login and try to log a trade
    console.log('   💰 Testing login -> log trade flow...');
    try {
      await page.goto('http://localhost:3000/log-trade');
      await page.waitForTimeout(3000);
      
      const hasError = await page.evaluate(() => {
        return document.body.textContent.includes('strategy_rule_compliance') || 
               document.body.textContent.includes('relation') ||
               document.body.textContent.includes('does not exist');
      });
      
      flowResults.push({
        flow: 'login-to-log-trade',
        success: !hasError,
        hasComplianceError: hasError
      });
      
      if (hasError) {
        console.log('   🔍 LOG TRADE PAGE: Found compliance error');
        results.summary.complianceErrors++;
      }
    } catch (error) {
      flowResults.push({
        flow: 'login-to-log-trade',
        success: false,
        error: error.message
      });
    }
    
    results.tests.userFlows = flowResults;
    results.summary.totalTests++;
    
    const flowErrors = flowResults.filter(flow => flow.hasComplianceError).length;
    if (flowErrors > 0) {
      results.summary.complianceErrors += flowErrors;
      results.summary.failedTests++;
      console.log(`   ❌ User flow tests found ${flowErrors} compliance errors`);
    } else {
      results.summary.passedTests++;
      console.log('   ✅ User flow tests passed');
    }
    
    await browser.close();
  } catch (error) {
    console.log('   ❌ User flow tests failed:', error.message);
    results.tests.userFlows = { success: false, error: error.message };
    results.summary.totalTests++;
    results.summary.failedTests++;
    
    if (browser) {
      await browser.close();
    }
  }
  
  // Test 4: Check for any cached Supabase responses
  console.log('\n4️⃣ Checking for cached Supabase responses...');
  try {
    const cacheDir = path.join(process.cwd(), '.next', 'cache');
    let cacheInfo = { exists: false, files: [] };
    
    if (fs.existsSync(cacheDir)) {
      cacheInfo.exists = true;
      const files = fs.readdirSync(cacheDir, { recursive: true });
      cacheInfo.files = files.filter(file => 
        file.includes('supabase') || 
        file.includes('strategy') || 
        file.includes('compliance')
      );
    }
    
    results.tests.cacheCheck = cacheInfo;
    results.summary.totalTests++;
    
    if (cacheInfo.files.length > 0) {
      console.log(`   🔍 Found ${cacheInfo.files.length} potentially relevant cache files`);
      cacheInfo.files.forEach(file => console.log(`      - ${file}`));
      results.summary.failedTests++;
    } else {
      console.log('   ✅ No relevant cache files found');
      results.summary.passedTests++;
    }
  } catch (error) {
    console.log('   ❌ Cache check failed:', error.message);
    results.tests.cacheCheck = { success: false, error: error.message };
    results.summary.totalTests++;
    results.summary.failedTests++;
  }
  
  // Generate comprehensive report
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total tests: ${results.summary.totalTests}`);
  console.log(`Passed tests: ${results.summary.passedTests}`);
  console.log(`Failed tests: ${results.summary.failedTests}`);
  console.log(`Compliance errors found: ${results.summary.complianceErrors}`);
  
  if (results.summary.complianceErrors > 0) {
    console.log('\n🚨 CRITICAL: strategy_rule_compliance errors detected!');
    console.log('\nMost likely sources:');
    
    // Analyze results to determine most likely source
    if (results.tests.databaseDiagnostic && 
        Object.values(results.tests.databaseDiagnostic.checks).some(check => check.hasComplianceError)) {
      console.log('1. DATABASE-LEVEL: Database objects still reference the table');
    }
    
    if (results.tests.clientSideDiagnostic && 
        (results.tests.clientSideDiagnostic.complianceConsoleErrors > 0 || 
         results.tests.clientSideDiagnostic.hasPageError)) {
      console.log('2. CLIENT-SIDE: Browser cache or Supabase client cache');
    }
    
    if (results.tests.userFlows && 
        results.tests.userFlows.some(flow => flow.hasComplianceError)) {
      console.log('3. USER-FLOW SPECIFIC: Certain user actions trigger the error');
      
      const problematicFlows = results.tests.userFlows.filter(flow => flow.hasComplianceError);
      problematicFlows.forEach(flow => {
        console.log(`   - ${flow.flow} flow triggers error`);
      });
    }
  } else {
    console.log('\n✅ No strategy_rule_compliance errors detected in comprehensive test');
  }
  
  // Save detailed results
  const reportPath = `comprehensive-compliance-test-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Detailed results saved to: ${reportPath}`);
  
  return results;
}

// Run the comprehensive test
if (require.main === module) {
  // Check if dev server is running
  console.log('🔍 Checking if development server is running...');
  try {
    execSync('curl -s http://localhost:3000 > nul', { stdio: 'pipe' });
    console.log('✅ Development server is running');
  } catch (error) {
    console.log('❌ Development server is not running on port 3000');
    console.log('Please start the development server with: npm run dev');
    process.exit(1);
  }
  
  runComprehensiveTest()
    .then(results => {
      console.log('\n✅ Comprehensive test completed successfully');
      
      if (results.summary.complianceErrors > 0) {
        console.log('\n🎯 RECOMMENDED NEXT STEPS:');
        console.log('1. Review the detailed JSON report for specific error locations');
        console.log('2. Focus on the identified most likely source');
        console.log('3. Implement targeted fixes based on the findings');
        process.exit(1);
      } else {
        console.log('\n🎉 No compliance errors found - issue may be resolved');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('\n❌ Comprehensive test failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTest };