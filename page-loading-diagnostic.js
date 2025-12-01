const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * PAGE LOADING DIAGNOSTIC TEST
 * 
 * Diagnoses why pages are not loading properly
 */

async function diagnosePageLoadingIssues() {
  console.log('🔍 DIAGNOSING PAGE LOADING ISSUES');
  console.log('===================================');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console logs and network requests
  const consoleLogs = [];
  const networkRequests = [];
  const errors = [];
  
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      errors.push({
        type: 'HTTP_ERROR',
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  page.on('pageerror', error => {
    errors.push({
      type: 'PAGE_ERROR',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    // Test 1: Check if server is responding
    console.log('\n📋 Test 1: Server Response Check');
    try {
      const response = await page.goto('http://localhost:3000', { 
        waitUntil: 'domcontentloaded', 
        timeout: 5000 
      });
      
      console.log(`✅ Server responded with status: ${response.status()}`);
      
      // Wait a bit to see if content loads
      await page.waitForTimeout(3000);
      
      // Check page content
      const pageContent = await page.content();
      const hasContent = pageContent.length > 1000; // Basic content check
      const hasTitle = await page.title();
      
      console.log(`📄 Page content length: ${pageContent.length} characters`);
      console.log(`📄 Page title: "${hasTitle}"`);
      console.log(`✅ Has content: ${hasContent}`);
      
      // Take screenshot
      await page.screenshot({ path: 'diagnostic-home-page.png', fullPage: true });
      console.log('📸 Screenshot saved: diagnostic-home-page.png');
      
    } catch (error) {
      console.log(`❌ Server connection failed: ${error.message}`);
      errors.push({
        type: 'SERVER_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Test 2: Check login page specifically
    console.log('\n📋 Test 2: Login Page Check');
    try {
      await page.goto('http://localhost:3000/login', { 
        waitUntil: 'domcontentloaded', 
        timeout: 5000 
      });
      
      await page.waitForTimeout(3000);
      
      // Check for login form elements
      const loginForm = await page.evaluate(() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passwordInput = document.querySelector('input[type="password"]');
        const submitButton = document.querySelector('button[type="submit"]');
        
        return {
          hasEmailInput: !!emailInput,
          hasPasswordInput: !!passwordInput,
          hasSubmitButton: !!submitButton,
          pageTitle: document.title,
          bodyText: document.body.innerText.substring(0, 200)
        };
      });
      
      console.log('🔍 Login form check:', loginForm);
      
      await page.screenshot({ path: 'diagnostic-login-page.png', fullPage: true });
      console.log('📸 Screenshot saved: diagnostic-login-page.png');
      
    } catch (error) {
      console.log(`❌ Login page failed: ${error.message}`);
      errors.push({
        type: 'LOGIN_PAGE_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Test 3: Check for Supabase configuration issues
    console.log('\n📋 Test 3: Supabase Configuration Check');
    try {
      const supabaseCheck = await page.evaluate(() => {
        // Check for Supabase in window
        const hasSupabase = !!(window.supabase);
        
        // Check for environment variables (if exposed)
        const supabaseUrl = window.__ENV__?.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = window.__ENV__?.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        // Check for any Supabase-related errors
        const supabaseErrors = [];
        
        return {
          hasSupabase,
          supabaseUrl,
          hasSupabaseKey: !!supabaseKey,
          supabaseErrors
        };
      });
      
      console.log('🔍 Supabase configuration:', supabaseCheck);
      
    } catch (error) {
      console.log(`❌ Supabase check failed: ${error.message}`);
      errors.push({
        type: 'SUPABASE_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Test 4: Check network requests
    console.log('\n📋 Test 4: Network Request Analysis');
    console.log(`📡 Total network requests: ${networkRequests.length}`);
    
    const failedRequests = networkRequests.filter(req => 
      req.url.includes('supabase') || req.url.includes('api')
    );
    
    console.log(`📡 Supabase/API requests: ${failedRequests.length}`);
    failedRequests.forEach((req, index) => {
      console.log(`  ${index + 1}. ${req.method} ${req.url}`);
    });
    
    // Test 5: Check console errors
    console.log('\n📋 Test 5: Console Error Analysis');
    const errorLogs = consoleLogs.filter(log => log.type === 'error');
    const warningLogs = consoleLogs.filter(log => log.type === 'warning');
    
    console.log(`⚠️ Console warnings: ${warningLogs.length}`);
    warningLogs.forEach(log => console.log(`  ${log.text}`));
    
    console.log(`❌ Console errors: ${errorLogs.length}`);
    errorLogs.forEach(log => console.log(`  ${log.text}`));
    
    // Test 6: Check for runtime errors
    console.log('\n📋 Test 6: Runtime Error Analysis');
    console.log(`💥 Runtime errors: ${errors.length}`);
    errors.forEach(error => {
      console.log(`  ${error.type}: ${error.message || error.url}`);
    });
    
    // Generate diagnostic report
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      consoleLogs,
      networkRequests,
      errors,
      summary: {
        totalErrors: errors.length,
        consoleErrors: errorLogs.length,
        consoleWarnings: warningLogs.length,
        networkRequests: networkRequests.length
      }
    };
    
    // Save diagnostic report
    const reportPath = 'page-loading-diagnostic-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(diagnosticReport, null, 2));
    console.log(`\n📄 Diagnostic report saved: ${reportPath}`);
    
    // Print summary
    console.log('\n🎯 DIAGNOSTIC SUMMARY');
    console.log('=====================');
    console.log(`Total Errors: ${diagnosticReport.summary.totalErrors}`);
    console.log(`Console Errors: ${diagnosticReport.summary.consoleErrors}`);
    console.log(`Console Warnings: ${diagnosticReport.summary.consoleWarnings}`);
    console.log(`Network Requests: ${diagnosticReport.summary.networkRequests}`);
    
    if (diagnosticReport.summary.totalErrors > 0) {
      console.log('\n🔧 RECOMMENDATIONS:');
      console.log('1. Fix console errors first - they prevent proper page loading');
      console.log('2. Check Supabase configuration in .env file');
      console.log('3. Verify development server is running without compilation errors');
      console.log('4. Check network connectivity to Supabase');
    } else {
      console.log('\n✅ No critical errors found - pages should be loading');
    }
    
  } catch (error) {
    console.error(`💥 Diagnostic failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Run diagnostic
if (require.main === module) {
  diagnosePageLoadingIssues().catch(console.error);
}

module.exports = { diagnosePageLoadingIssues };