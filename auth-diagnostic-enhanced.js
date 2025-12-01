const puppeteer = require('puppeteer');
const fs = require('fs');

/**
 * ENHANCED AUTHENTICATION DIAGNOSTIC SCRIPT
 * Tests specific hypotheses about authentication issues
 */

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  screenshotDir: './auth-diagnostic-screenshots'
};

const diagnosticResults = {
  startTime: new Date().toISOString(),
  tests: [],
  hypotheses: {},
  finalDiagnosis: '',
  recommendations: []
};

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function recordTest(testName, status, details = '', evidence = {}) {
  const testResult = {
    name: testName,
    status: status, // PASS, FAIL, INCONCLUSIVE
    details: details,
    evidence: evidence,
    timestamp: new Date().toISOString()
  };
  
  diagnosticResults.tests.push(testResult);
  log(`DIAGNOSTIC: ${testName} - ${status}${details ? ` - ${details}` : ''}`, status === 'PASS' ? 'INFO' : 'ERROR');
}

async function takeScreenshot(page, testName, step) {
  const timestamp = Date.now();
  const filename = `${testName}-${step}-${timestamp}.png`;
  const filepath = `${TEST_CONFIG.screenshotDir}/${filename}`;
  
  try {
    if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
      fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
    }
    await page.screenshot({ path: filepath, fullPage: true });
    log(`Screenshot saved: ${filepath}`);
    return filepath;
  } catch (error) {
    log(`Failed to take screenshot: ${error.message}`, 'ERROR');
    return '';
  }
}

async function testHypothesis1_AuthContextInitialization(page) {
  log('Testing Hypothesis 1: AuthContext Initialization Issues');
  
  try {
    // Navigate to login page
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'auth-context-test', 'login-page-loaded');
    
    // Check for AuthContext debug logs in browser console
    const authContextLogs = await page.evaluate(() => {
      return new Promise((resolve) => {
        const logs = [];
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.log = function(...args) {
          logs.push({ type: 'log', message: args.join(' '), timestamp: Date.now() });
          originalLog.apply(console, args);
        };
        
        console.error = function(...args) {
          logs.push({ type: 'error', message: args.join(' '), timestamp: Date.now() });
          originalError.apply(console, args);
        };
        
        console.warn = function(...args) {
          logs.push({ type: 'warn', message: args.join(' '), timestamp: Date.now() });
          originalWarn.apply(console, args);
        };
        
        // Wait a bit to collect logs
        setTimeout(() => {
          console.log = originalLog;
          console.error = originalError;
          console.warn = originalWarn;
          resolve(logs);
        }, 3000);
      });
    });
    
    // Filter for auth-related logs
    const authLogs = authContextLogs.filter(log => 
      log.message.includes('AuthContext') || 
      log.message.includes('AuthGuard') || 
      log.message.includes('auth') ||
      log.message.includes('Supabase')
    );
    
    // Check for specific error patterns
    const hasInitializationErrors = authLogs.some(log => 
      log.type === 'error' && 
      (log.message.includes('AuthContext') || log.message.includes('Supabase'))
    );
    
    const hasAuthInitializedLogs = authLogs.some(log => 
      log.message.includes('authInitialized') || 
      log.message.includes('Starting auth initialization')
    );
    
    if (hasInitializationErrors) {
      recordTest('AuthContext Initialization', 'FAIL', 
        'AuthContext initialization errors detected', 
        { authLogs, hasErrors: true });
      diagnosticResults.hypotheses.authContextInitialization = 'FAILED';
    } else if (hasAuthInitializedLogs) {
      recordTest('AuthContext Initialization', 'PASS', 
        'AuthContext initialization logs found', 
        { authLogs, hasErrors: false });
      diagnosticResults.hypotheses.authContextInitialization = 'PASSED';
    } else {
      recordTest('AuthContext Initialization', 'INCONCLUSIVE', 
        'No clear AuthContext initialization evidence', 
        { authLogs });
      diagnosticResults.hypotheses.authContextInitialization = 'INCONCLUSIVE';
    }
    
  } catch (error) {
    recordTest('AuthContext Initialization', 'FAIL', 
      `Exception during test: ${error.message}`, 
      { error: error.message });
    diagnosticResults.hypotheses.authContextInitialization = 'ERROR';
  }
}

async function testHypothesis2_TestCredentials(page) {
  log('Testing Hypothesis 2: Invalid Test Credentials');
  
  try {
    // Navigate to login page
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    
    // Try multiple common test credential combinations
    const testCredentials = [
      { email: 'test@example.com', password: 'testpassword123' },
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'user@example.com', password: 'password123' },
      { email: 'demo@example.com', password: 'demo123' }
    ];
    
    let workingCredentials = null;
    let credentialTestResults = [];
    
    for (const creds of testCredentials) {
      log(`Testing credentials: ${creds.email}`);
      
      // Clear form
      await page.evaluate(() => {
        document.querySelector('input[type="email"]').value = '';
        document.querySelector('input[type="password"]').value = '';
      });
      
      // Fill form
      await page.type('input[type="email"]', creds.email);
      await page.type('input[type="password"]', creds.password);
      
      // Take screenshot before submission
      await takeScreenshot(page, 'credential-test', `before-submit-${creds.email.split('@')[0]}`);
      
      // Submit form
      const submitPromise = Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }),
        page.waitForSelector('[data-testid="error"], .error, .alert-error', { timeout: 3000 })
      ]);
      
      await page.click('button[type="submit"]');
      
      try {
        await submitPromise;
      } catch (e) {
        // Timeout is expected for failed logins
      }
      
      // Check result
      const currentUrl = page.url();
      const hasError = await page.$('[data-testid="error"], .error, .alert-error');
      const isLoggedIn = currentUrl.includes('/dashboard');
      
      const result = {
        email: creds.email,
        success: isLoggedIn && !hasError,
        error: hasError ? await page.$eval('[data-testid="error"], .error, .alert-error', el => el.textContent) : null,
        url: currentUrl
      };
      
      credentialTestResults.push(result);
      
      if (result.success) {
        workingCredentials = creds;
        log(`✅ Working credentials found: ${creds.email}`);
        break;
      }
      
      // Wait a bit before next attempt
      await page.waitForTimeout(1000);
    }
    
    if (workingCredentials) {
      recordTest('Test Credentials', 'PASS', 
        `Working credentials found: ${workingCredentials.email}`, 
        { workingCredentials, allResults: credentialTestResults });
      diagnosticResults.hypotheses.testCredentials = 'PASSED';
    } else {
      recordTest('Test Credentials', 'FAIL', 
        'No working test credentials found', 
        { allResults: credentialTestResults });
      diagnosticResults.hypotheses.testCredentials = 'FAILED';
    }
    
  } catch (error) {
    recordTest('Test Credentials', 'FAIL', 
      `Exception during test: ${error.message}`, 
      { error: error.message });
    diagnosticResults.hypotheses.testCredentials = 'ERROR';
  }
}

async function testHypothesis3_SupabaseConfiguration(page) {
  log('Testing Hypothesis 3: Supabase Configuration Issues');
  
  try {
    // Navigate to login page
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    
    // Check for Supabase client configuration in browser
    const supabaseConfig = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Try to access Supabase configuration
        try {
          // Check if Supabase is available
          if (typeof window.supabase !== 'undefined') {
            resolve({
              supabaseAvailable: true,
              supabaseUrl: window.supabase.supabaseUrl || 'unknown',
              hasAuth: !!window.supabase.auth
            });
          } else {
            // Try to find Supabase in global scope
            const supabaseKeys = Object.keys(window).filter(key => 
              key.toLowerCase().includes('supabase')
            );
            resolve({
              supabaseAvailable: false,
              supabaseKeys,
              windowKeys: Object.keys(window).length
            });
          }
        } catch (error) {
          resolve({
            supabaseAvailable: false,
            error: error.message
          });
        }
      });
    });
    
    // Check for network requests to Supabase
    const networkRequests = await page.evaluate(() => {
      return new Promise((resolve) => {
        const requests = [];
        const originalFetch = window.fetch;
        
        window.fetch = function(...args) {
          const url = args[0];
          if (typeof url === 'string' && url.includes('supabase')) {
            requests.push({
              url: url,
              method: args[1]?.method || 'GET',
              timestamp: Date.now()
            });
          }
          return originalFetch.apply(this, args);
        };
        
        setTimeout(() => {
          window.fetch = originalFetch;
          resolve(requests);
        }, 3000);
      });
    });
    
    const hasSupabaseRequests = networkRequests.length > 0;
    const supabaseWorking = supabaseConfig.supabaseAvailable && hasSupabaseRequests;
    
    if (supabaseWorking) {
      recordTest('Supabase Configuration', 'PASS', 
        'Supabase client is properly configured and making requests', 
        { supabaseConfig, networkRequests });
      diagnosticResults.hypotheses.supabaseConfiguration = 'PASSED';
    } else {
      recordTest('Supabase Configuration', 'FAIL', 
        'Supabase configuration issues detected', 
        { supabaseConfig, networkRequests });
      diagnosticResults.hypotheses.supabaseConfiguration = 'FAILED';
    }
    
  } catch (error) {
    recordTest('Supabase Configuration', 'FAIL', 
      `Exception during test: ${error.message}`, 
      { error: error.message });
    diagnosticResults.hypotheses.supabaseConfiguration = 'ERROR';
  }
}

async function generateDiagnosis() {
  const endTime = new Date().toISOString();
  const duration = new Date(endTime) - new Date(diagnosticResults.startTime);
  
  // Analyze results to determine most likely cause
  const failedHypotheses = Object.entries(diagnosticResults.hypotheses)
    .filter(([key, value]) => value === 'FAILED' || value === 'ERROR')
    .map(([key]) => key);
  
  const passedHypotheses = Object.entries(diagnosticResults.hypotheses)
    .filter(([key, value]) => value === 'PASSED')
    .map(([key]) => key);
  
  let diagnosis = '';
  let recommendations = [];
  
  if (diagnosticResults.hypotheses.testCredentials === 'FAILED') {
    diagnosis = 'PRIMARY ISSUE: Invalid test credentials. The authentication is failing because the test credentials do not exist in the Supabase database.';
    recommendations.push('Create a test user in Supabase with email: test@example.com and password: testpassword123');
    recommendations.push('Or update the test script to use existing valid credentials');
  } else if (diagnosticResults.hypotheses.authContextInitialization === 'FAILED') {
    diagnosis = 'PRIMARY ISSUE: AuthContext initialization failure. The authentication context is not properly initializing.';
    recommendations.push('Check Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    recommendations.push('Verify Supabase project is active and accessible');
    recommendations.push('Check for JavaScript errors in browser console');
  } else if (diagnosticResults.hypotheses.supabaseConfiguration === 'FAILED') {
    diagnosis = 'PRIMARY ISSUE: Supabase configuration problems. The Supabase client is not properly configured or accessible.';
    recommendations.push('Verify Supabase URL and API key in .env file');
    recommendations.push('Check network connectivity to Supabase');
    recommendations.push('Ensure CORS is properly configured in Supabase project');
  } else {
    diagnosis = 'INCONCLUSIVE: Unable to determine primary cause of authentication issues.';
    recommendations.push('Manual debugging required - check browser console for errors');
    recommendations.push('Verify Supabase project status and configuration');
    recommendations.push('Test authentication manually in browser');
  }
  
  diagnosticResults.endTime = endTime;
  diagnosticResults.duration = duration;
  diagnosticResults.finalDiagnosis = diagnosis;
  diagnosticResults.recommendations = recommendations;
  
  // Save detailed report
  const reportPath = './auth-diagnostic-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(diagnosticResults, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport();
  const markdownPath = './auth-diagnostic-report.md';
  fs.writeFileSync(markdownPath, markdownReport);
  
  log(`Diagnostic report saved to: ${reportPath}`);
  log(`Markdown report saved to: ${markdownPath}`);
  
  return diagnosticResults;
}

function generateMarkdownReport() {
  const { startTime, endTime, duration, hypotheses, tests, finalDiagnosis, recommendations } = diagnosticResults;
  
  let markdown = `# AUTHENTICATION DIAGNOSTIC REPORT\n\n`;
  markdown += `**Test Duration:** ${new Date(duration).toISOString().substr(11, 8)}\n`;
  markdown += `**Start Time:** ${startTime}\n`;
  markdown += `**End Time:** ${endTime}\n\n`;
  
  markdown += `## Final Diagnosis\n\n`;
  markdown += `**${finalDiagnosis}**\n\n`;
  
  markdown += `## Hypotheses Test Results\n\n`;
  
  Object.entries(hypotheses).forEach(([hypothesis, result]) => {
    const status = result === 'PASSED' ? '✅' : result === 'FAILED' ? '❌' : '❓';
    markdown += `### ${hypothesis}: ${status} ${result}\n\n`;
  });
  
  markdown += `## Detailed Test Results\n\n`;
  
  tests.forEach((test, index) => {
    const status = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '❓';
    markdown += `### ${index + 1}. ${test.name} ${status}\n\n`;
    markdown += `- **Status:** ${test.status}\n`;
    markdown += `- **Details:** ${test.details}\n`;
    markdown += `- **Timestamp:** ${test.timestamp}\n\n`;
  });
  
  markdown += `## Recommendations\n\n`;
  recommendations.forEach((rec, index) => {
    markdown += `${index + 1}. ${rec}\n`;
  });
  markdown += `\n`;
  
  return markdown;
}

async function runEnhancedDiagnostic() {
  log('Starting enhanced authentication diagnostic...');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Keep visible for debugging
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      log(`BROWSER: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      log(`BROWSER ERROR: ${error.message}`, 'ERROR');
    });
    
    // Set timeout
    page.setDefaultTimeout(TEST_CONFIG.timeout);
    
    // Run diagnostic tests
    await testHypothesis1_AuthContextInitialization(page);
    await testHypothesis2_TestCredentials(page);
    await testHypothesis3_SupabaseConfiguration(page);
    
    // Generate final diagnosis
    const diagnosis = await generateDiagnosis();
    
    log(`\n=== DIAGNOSTIC COMPLETED ===`);
    log(`Final Diagnosis: ${diagnosis.finalDiagnosis}`);
    log(`Recommendations: ${diagnosis.recommendations.length} found`);
    
    return diagnosis;
    
  } catch (error) {
    log(`Diagnostic execution failed: ${error.message}`, 'ERROR');
    diagnosticResults.finalDiagnosis = `Diagnostic execution failed: ${error.message}`;
    return diagnosticResults;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the diagnostic
if (require.main === module) {
  runEnhancedDiagnostic()
    .then(diagnosis => {
      console.log('\n=== ENHANCED DIAGNOSTIC COMPLETE ===');
      console.log(`Primary Issue: ${diagnosis.finalDiagnosis}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Diagnostic failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runEnhancedDiagnostic,
  testHypothesis1_AuthContextInitialization,
  testHypothesis2_TestCredentials,
  testHypothesis3_SupabaseConfiguration
};