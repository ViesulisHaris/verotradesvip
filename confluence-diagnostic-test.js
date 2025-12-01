/**
 * Focused Diagnostic Test for Confluence Tab Issues
 * Targets the most likely problem sources identified from initial testing
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  screenshotDir: './confluence-diagnostic-screenshots'
};

// Diagnostic results
const diagnosticResults = {
  authentication: { findings: [], status: 'unknown' },
  dataProcessing: { findings: [], status: 'unknown' },
  componentRendering: { findings: [], status: 'unknown' },
  apiConnectivity: { findings: [], status: 'unknown' }
};

function logDiagnostic(category, finding, status = 'info') {
  console.log(`🔍 [${category.toUpperCase()}] ${finding}`);
  diagnosticResults[category].findings.push({
    finding,
    status,
    timestamp: new Date().toISOString()
  });
}

async function takeDiagnosticScreenshot(page, name) {
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
  }
  const screenshotPath = path.join(TEST_CONFIG.screenshotDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Diagnostic screenshot: ${screenshotPath}`);
  return screenshotPath;
}

async function runFocusedDiagnostics() {
  console.log('🎯 Starting Focused Confluence Tab Diagnostics\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable detailed console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('ERROR') || text.includes('Failed') || text.includes('error')) {
      console.log('🚨 PAGE ERROR:', text);
      logDiagnostic('dataProcessing', `Console error: ${text}`, 'error');
    }
  });
  
  page.on('pageerror', error => {
    console.log('🚨 PAGE ERROR:', error.message);
    logDiagnostic('dataProcessing', `Page error: ${error.message}`, 'error');
  });
  
  page.on('requestfailed', request => {
    console.log('🚨 REQUEST FAILED:', request.url(), request.failure().errorText);
    logDiagnostic('apiConnectivity', `Failed request: ${request.url()} - ${request.failure().errorText}`, 'error');
  });
  
  try {
    // Diagnostic 1: Authentication Flow
    await diagnoseAuthenticationFlow(page);
    
    // Diagnostic 2: Data Processing and Component Rendering
    await diagnoseDataProcessing(page);
    
    // Diagnostic 3: API Connectivity
    await diagnoseAPIConnectivity(page);
    
    // Diagnostic 4: Component State and Props
    await diagnoseComponentState(page);
    
  } catch (error) {
    console.error('🚨 Diagnostic suite failed:', error);
    await takeDiagnosticScreenshot(page, 'diagnostic-error');
  } finally {
    await browser.close();
  }
  
  generateDiagnosticReport();
}

// Diagnostic 1: Authentication Flow
async function diagnoseAuthenticationFlow(page) {
  console.log('\n🔐 Diagnosing Authentication Flow...');
  
  try {
    // Navigate to confluence page
    await page.goto(`${TEST_CONFIG.baseUrl}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Check current URL and auth state
    const currentUrl = page.url();
    const isOnLoginPage = currentUrl.includes('/login');
    const isOnConfluencePage = currentUrl.includes('/confluence');
    
    logDiagnostic('authentication', `Current URL: ${currentUrl}`);
    logDiagnostic('authentication', `Is on login page: ${isOnLoginPage}`);
    logDiagnostic('authentication', `Is on confluence page: ${isOnConfluencePage}`);
    
    // Check for auth guard presence
    const authGuardExists = await page.evaluate(() => {
      const authGuard = document.querySelector('[data-testid="auth-guard"]');
      const authComponent = document.querySelector('[class*="auth"]');
      const authLayout = document.querySelector('[class*="AuthLayout"]');
      return { authGuard: !!authGuard, authComponent: !!authComponent, authLayout: !!authLayout };
    });
    
    logDiagnostic('authentication', `AuthGuard components found: ${JSON.stringify(authGuardExists)}`);
    
    // Check auth context state
    const authState = await page.evaluate(() => {
      // Try to access auth state from window or global scope
      if (window.__AUTH_STATE__) {
        return window.__AUTH_STATE__;
      }
      
      // Look for auth-related data in script tags
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.textContent && script.textContent.includes('auth')) {
          try {
            const match = script.textContent.match(/user.*?null|user.*?{[^}]+}/);
            if (match) {
              return { userState: match[0] };
            }
          } catch (e) {
            // Continue
          }
        }
      }
      
      return { userState: 'not_found' };
    });
    
    logDiagnostic('authentication', `Auth state detected: ${JSON.stringify(authState)}`);
    
    // Check if page should require authentication
    const requiresAuth = await page.evaluate(() => {
      const title = document.title;
      const heading = document.querySelector('h1')?.textContent;
      return title.includes('Confluence') || heading?.includes('Confluence');
    });
    
    logDiagnostic('authentication', `Page requires authentication: ${requiresAuth}`);
    
    // Determine authentication status
    if (requiresAuth && !isOnLoginPage && isOnConfluencePage) {
      diagnosticResults.authentication.status = 'issue';
      logDiagnostic('authentication', 'ISSUE: Protected page accessible without authentication', 'error');
    } else if (requiresAuth && isOnLoginPage) {
      diagnosticResults.authentication.status = 'working';
      logDiagnostic('authentication', 'OK: Properly redirecting to login', 'success');
    } else {
      diagnosticResults.authentication.status = 'unknown';
      logDiagnostic('authentication', 'UNCLEAR: Authentication behavior needs investigation', 'warning');
    }
    
    await takeDiagnosticScreenshot(page, 'auth-diagnosis');
    
  } catch (error) {
    logDiagnostic('authentication', `Authentication diagnosis failed: ${error.message}`, 'error');
    diagnosticResults.authentication.status = 'error';
  }
}

// Diagnostic 2: Data Processing and Component Rendering
async function diagnoseDataProcessing(page) {
  console.log('\n📊 Diagnosing Data Processing...');
  
  try {
    // Wait for page to fully load
    await sleep(5000);
    
    // Check for key components
    const componentCheck = await page.evaluate(() => {
      const checks = {
        mainContent: !!document.querySelector('main, [class*="content"]'),
        confluenceHeading: !!document.querySelector('h1'),
        statisticsCards: document.querySelectorAll('[class*="card"], [class*="stat"]').length,
        filterControls: !!document.querySelector('[class*="filter"]'),
        emotionRadar: !!document.querySelector('[class*="radar"], [class*="chart"], canvas, svg'),
        tradeTable: !!document.querySelector('table'),
        refreshButton: !!document.querySelector('button') && document.body.textContent.includes('Refresh')
      };
      
      return checks;
    });
    
    Object.entries(componentCheck).forEach(([component, exists]) => {
      logDiagnostic('componentRendering', `${component}: ${exists}`);
    });
    
    // Check for data loading states
    const loadingStates = await page.evaluate(() => {
      const loadingIndicators = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
      const errorMessages = document.querySelectorAll('[class*="error"], .error-message');
      const emptyStates = document.querySelectorAll('[class*="empty"], [class*="no-data"]');
      
      return {
        loading: loadingIndicators.length,
        errors: errorMessages.length,
        empty: emptyStates.length
      };
    });
    
    logDiagnostic('dataProcessing', `Loading indicators: ${loadingStates.loading}`);
    logDiagnostic('dataProcessing', `Error messages: ${loadingStates.errors}`);
    logDiagnostic('dataProcessing', `Empty states: ${loadingStates.empty}`);
    
    // Check for emotion data processing
    const emotionDataCheck = await page.evaluate(() => {
      const pageText = document.body.textContent;
      const hasEmotionKeywords = ['FOMO', 'REVENGE', 'TILT', 'PATIENCE', 'DISCIPLINE', 'CONFIDENT', 'NEUTRAL']
        .some(emotion => pageText.includes(emotion));
      
      const hasEmotionData = pageText.includes('emotion') || pageText.includes('emotional');
      const hasChartData = !!document.querySelector('canvas') || !!document.querySelector('svg');
      
      return {
        hasEmotionKeywords,
        hasEmotionData,
        hasChartData
      };
    });
    
    logDiagnostic('dataProcessing', `Emotion keywords found: ${emotionDataCheck.hasEmotionKeywords}`);
    logDiagnostic('dataProcessing', `Emotion data present: ${emotionDataCheck.hasEmotionData}`);
    logDiagnostic('dataProcessing', `Chart elements present: ${emotionDataCheck.hasChartData}`);
    
    // Check for React component errors
    const reactErrors = await page.evaluate(() => {
      const errorBoundaries = document.querySelectorAll('[class*="error-boundary"]');
      const errorMessages = Array.from(document.querySelectorAll('*'))
        .filter(el => el.textContent && (
          el.textContent.includes('Error') ||
          el.textContent.includes('Failed') ||
          el.textContent.includes('Something went wrong')
        ));
      
      return {
        errorBoundaries: errorBoundaries.length,
        errorMessages: errorMessages.length
      };
    });
    
    logDiagnostic('dataProcessing', `React error boundaries: ${reactErrors.errorBoundaries}`);
    logDiagnostic('dataProcessing', `Error messages found: ${reactErrors.errorMessages}`);
    
    // Determine data processing status
    if (componentCheck.statisticsCards > 0 && componentCheck.filterControls) {
      diagnosticResults.dataProcessing.status = 'partial';
      logDiagnostic('dataProcessing', 'Some components loading, but data processing may be incomplete', 'warning');
    } else if (componentCheck.mainContent && componentCheck.confluenceHeading) {
      diagnosticResults.dataProcessing.status = 'minimal';
      logDiagnostic('dataProcessing', 'Basic page structure loaded, but components missing', 'warning');
    } else {
      diagnosticResults.dataProcessing.status = 'failed';
      logDiagnostic('dataProcessing', 'Critical components not rendering', 'error');
    }
    
    await takeDiagnosticScreenshot(page, 'data-processing-diagnosis');
    
  } catch (error) {
    logDiagnostic('dataProcessing', `Data processing diagnosis failed: ${error.message}`, 'error');
    diagnosticResults.dataProcessing.status = 'error';
  }
}

// Diagnostic 3: API Connectivity
async function diagnoseAPIConnectivity(page) {
  console.log('\n🌐 Diagnosing API Connectivity...');
  
  try {
    // Monitor network requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('supabase')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });
    
    // Wait for network activity
    await sleep(5000);
    
    // Check for Supabase/API requests
    const apiRequests = requests.filter(req => 
      req.url.includes('/api/') || 
      req.url.includes('supabase') ||
      req.url.includes('trades')
    );
    
    logDiagnostic('apiConnectivity', `API requests made: ${apiRequests.length}`);
    
    apiRequests.forEach((req, index) => {
      logDiagnostic('apiConnectivity', `Request ${index + 1}: ${req.method} ${req.url}`);
    });
    
    // Check for successful responses
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('supabase')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok(),
          timestamp: Date.now()
        });
      }
    });
    
    await sleep(3000);
    
    const apiResponses = responses.filter(res => 
      res.url.includes('/api/') || 
      res.url.includes('supabase') ||
      res.url.includes('trades')
    );
    
    logDiagnostic('apiConnectivity', `API responses received: ${apiResponses.length}`);
    
    apiResponses.forEach((res, index) => {
      logDiagnostic('apiConnectivity', `Response ${index + 1}: ${res.status} ${res.url} (${res.ok ? 'OK' : 'FAILED'})`);
    });
    
    // Check for authentication headers
    const authHeaders = await page.evaluate(() => {
      return fetch('/api/user', { headers: { 'Authorization': 'Bearer test' } })
        .then(res => ({ status: res.status, authHeader: res.headers.get('www-authenticate') }))
        .catch(() => ({ status: 'failed', authHeader: null }));
    });
    
    logDiagnostic('apiConnectivity', `Auth endpoint status: ${authHeaders.status}`);
    
    // Determine API connectivity status
    if (apiResponses.length > 0 && apiResponses.every(res => res.ok)) {
      diagnosticResults.apiConnectivity.status = 'working';
      logDiagnostic('apiConnectivity', 'API connectivity working properly', 'success');
    } else if (apiResponses.length > 0) {
      diagnosticResults.apiConnectivity.status = 'partial';
      logDiagnostic('apiConnectivity', 'Some API calls failing', 'warning');
    } else {
      diagnosticResults.apiConnectivity.status = 'failed';
      logDiagnostic('apiConnectivity', 'No API connectivity detected', 'error');
    }
    
  } catch (error) {
    logDiagnostic('apiConnectivity', `API connectivity diagnosis failed: ${error.message}`, 'error');
    diagnosticResults.apiConnectivity.status = 'error';
  }
}

// Diagnostic 4: Component State and Props
async function diagnoseComponentState(page) {
  console.log('\n🧩 Diagnosing Component State...');
  
  try {
    // Check React DevTools for component state
    const componentState = await page.evaluate(() => {
      // Look for React component data in the page
      const reactRoot = document.querySelector('#__next__');
      const hasReact = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      // Check for component props and state in script tags
      const scripts = document.querySelectorAll('script');
      let componentData = null;
      
      for (const script of scripts) {
        if (script.textContent && script.textContent.includes('ConfluencePage')) {
          try {
            const stateMatch = script.textContent.match(/useState.*?\[.*?\]/);
            const propsMatch = script.textContent.match(/filters.*?{.*?}/);
            
            componentData = {
              hasState: !!stateMatch,
              hasProps: !!propsMatch,
              stateSample: stateMatch ? stateMatch[0].substring(0, 100) : null,
              propsSample: propsMatch ? propsMatch[0].substring(0, 100) : null
            };
            break;
          } catch (e) {
            // Continue
          }
        }
      }
      
      return {
        hasReactDevTools: hasReact,
        hasReactRoot: !!reactRoot,
        componentData
      };
    });
    
    logDiagnostic('componentRendering', `React DevTools available: ${componentState.hasReactDevTools}`);
    logDiagnostic('componentRendering', `React root found: ${componentState.hasReactRoot}`);
    
    if (componentState.componentData) {
      logDiagnostic('componentRendering', `Component state detected: ${componentState.componentData.hasState}`);
      logDiagnostic('componentRendering', `Component props detected: ${componentState.componentData.hasProps}`);
    }
    
    // Check for filter state in localStorage
    const filterState = await page.evaluate(() => {
      return {
        tradeFilters: localStorage.getItem('trade-filters'),
        filterState: localStorage.getItem('filter-state'),
        confluenceFilters: localStorage.getItem('confluence-filters')
      };
    });
    
    logDiagnostic('componentRendering', `Trade filters in localStorage: ${!!filterState.tradeFilters}`);
    logDiagnostic('componentRendering', `Filter state in localStorage: ${!!filterState.filterState}`);
    logDiagnostic('componentRendering', `Confluence filters in localStorage: ${!!filterState.confluenceFilters}`);
    
    // Check for emotion radar specific data
    const radarData = await page.evaluate(() => {
      const pageText = document.body.textContent;
      
      return {
        hasEmotionRadar: pageText.includes('EmotionRadar') || pageText.includes('emotion radar'),
        hasRadarData: pageText.includes('radar') && pageText.includes('data'),
        hasLeaningCalculation: pageText.includes('leaning') || pageText.includes('Buy') || pageText.includes('Sell'),
        hasValidEmotions: ['FOMO', 'REVENGE', 'TILT', 'PATIENCE', 'DISCIPLINE', 'CONFIDENT', 'NEUTRAL']
          .some(emotion => pageText.includes(emotion))
      };
    });
    
    Object.entries(radarData).forEach(([key, value]) => {
      logDiagnostic('componentRendering', `Radar ${key}: ${value}`);
    });
    
    await takeDiagnosticScreenshot(page, 'component-state-diagnosis');
    
  } catch (error) {
    logDiagnostic('componentRendering', `Component state diagnosis failed: ${error.message}`, 'error');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateDiagnosticReport() {
  console.log('\n📋 Generating Diagnostic Report...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      overallStatus: 'unknown',
      criticalIssues: [],
      recommendations: []
    },
    diagnostics: diagnosticResults
  };
  
  // Determine overall status and critical issues
  const statuses = Object.values(diagnosticResults).map(d => d.status);
  const hasErrors = statuses.includes('error') || statuses.includes('failed');
  const hasWarnings = statuses.includes('partial') || statuses.includes('minimal') || statuses.includes('unknown');
  
  if (hasErrors) {
    report.summary.overallStatus = 'critical';
    report.summary.criticalIssues.push('Critical errors detected in confluence tab functionality');
  } else if (hasWarnings) {
    report.summary.overallStatus = 'warning';
    report.summary.criticalIssues.push('Partial functionality or warnings detected');
  } else {
    report.summary.overallStatus = 'healthy';
  }
  
  // Generate specific recommendations
  if (diagnosticResults.authentication.status === 'issue') {
    report.summary.recommendations.push('Fix AuthGuard redirect logic for protected routes');
  }
  
  if (diagnosticResults.dataProcessing.status !== 'working') {
    report.summary.recommendations.push('Investigate data fetching and component rendering logic');
  }
  
  if (diagnosticResults.apiConnectivity.status !== 'working') {
    report.summary.recommendations.push('Check Supabase configuration and API endpoints');
  }
  
  if (diagnosticResults.componentRendering.status !== 'working') {
    report.summary.recommendations.push('Review React component state and props handling');
  }
  
  // Display report
  console.log('='.repeat(60));
  console.log('🎯 CONFLUENCE TAB DIAGNOSTIC REPORT');
  console.log('='.repeat(60));
  console.log(`📅 Diagnostic Date: ${report.timestamp}`);
  console.log(`🚨 Overall Status: ${report.summary.overallStatus.toUpperCase()}`);
  
  if (report.summary.criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    report.summary.criticalIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  if (report.summary.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.summary.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n📋 DETAILED FINDINGS:');
  Object.entries(diagnosticResults).forEach(([category, results]) => {
    console.log(`\n  ${category.toUpperCase()} (Status: ${results.status}):`);
    results.findings.forEach(finding => {
      const icon = finding.status === 'error' ? '🚨' : finding.status === 'warning' ? '⚠️' : finding.status === 'success' ? '✅' : 'ℹ️';
      console.log(`    ${icon} ${finding.finding}`);
    });
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Save detailed report
  const reportPath = path.join(TEST_CONFIG.screenshotDir, `confluence-diagnostic-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed diagnostic report saved to: ${reportPath}`);
  
  return report;
}

// Run the focused diagnostics
if (require.main === module) {
  runFocusedDiagnostics().catch(console.error);
}

module.exports = {
  runFocusedDiagnostics,
  diagnosticResults,
  TEST_CONFIG
};