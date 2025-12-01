/**
 * Confluence Page Console Error Diagnostic
 * Comprehensive diagnostic to identify console errors causing flashing and non-interactivity
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  screenshotDir: './confluence-console-diagnostic-screenshots',
  timeout: 30000,
  headless: false // Set to true for production runs
};

// Ensure screenshot directory exists
if (!fs.existsSync(CONFIG.screenshotDir)) {
  fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
}

function logDiagnostic(category, message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;
  console.log(logEntry);
  
  // Save to log file
  fs.appendFileSync(
    path.join(CONFIG.screenshotDir, 'diagnostic.log'),
    logEntry + '\n'
  );
}

async function runConsoleErrorDiagnostic() {
  logDiagnostic('MAIN', 'Starting comprehensive confluence console error diagnostic...');
  
  let browser;
  let page;
  
  try {
    // Launch browser with detailed console logging
    browser = await chromium.launch({
      headless: CONFIG.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    page = await context.newPage();
    
    // Capture all console events
    const consoleMessages = [];
    const networkErrors = [];
    const jsErrors = [];
    const warnings = [];
    const authStateChanges = [];
    const renderEvents = [];
    
    page.on('console', (msg) => {
      const messageData = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      };
      
      consoleMessages.push(messageData);
      
      if (msg.type() === 'error') {
        jsErrors.push(messageData);
        logDiagnostic('CONSOLE_ERROR', `Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        warnings.push(messageData);
        logDiagnostic('CONSOLE_WARNING', `Warning: ${msg.text()}`);
      } else if (msg.text().includes('AUTH_DEBUG') || msg.text().includes('AUTH_GUARD_DEBUG')) {
        authStateChanges.push(messageData);
        logDiagnostic('AUTH_STATE', `Auth state change: ${msg.text()}`);
      } else if (msg.text().includes('CONFLUENCE_DEBUG') || msg.text().includes('HYDRATION_DEBUG')) {
        renderEvents.push(messageData);
        logDiagnostic('RENDER_EVENT', `Render event: ${msg.text()}`);
      }
    });
    
    // Capture network errors
    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
        logDiagnostic('NETWORK_ERROR', `HTTP ${response.status()}: ${response.url()}`);
      }
    });
    
    page.on('requestfailed', (request) => {
      networkErrors.push({
        url: request.url(),
        failure: request.failure(),
        timestamp: new Date().toISOString()
      });
      logDiagnostic('NETWORK_FAILURE', `Request failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    // Capture page errors
    page.on('pageerror', (error) => {
      jsErrors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      logDiagnostic('PAGE_ERROR', `Page error: ${error.message}`);
    });
    
    // Monitor for rapid re-renders (flashing indicator)
    let renderCount = 0;
    let lastRenderTime = Date.now();
    
    // Add script to page before navigation
    await page.addInitScript(() => {
      let renderCount = 0;
      let lastRenderTime = Date.now();
      
      // Monitor React renders
      const originalLog = console.log;
      console.log = function(...args) {
        if (args[0] && typeof args[0] === 'string' &&
            (args[0].includes('CONFLUENCE_DEBUG') || args[0].includes('HYDRATION'))) {
          const now = Date.now();
          const timeSinceLastRender = now - lastRenderTime;
          renderCount++;
          
          if (timeSinceLastRender < 100) { // Rapid re-render detection
            console.warn(`🚨 RAPID RENDER DETECTED: ${timeSinceLastRender}ms apart, render #${renderCount}`);
          }
          
          lastRenderTime = now;
        }
        return originalLog.apply(console, args);
      };
      
      // Monitor DOM mutations (flashing indicator) - CRITICAL FIX: Check if document.body exists
      const setupMutationObserver = () => {
        try {
          const observer = new MutationObserver((mutations) => {
            const now = Date.now();
            if (mutations.length > 50) { // High mutation rate
              console.warn(`🚨 HIGH DOM MUTATION RATE: ${mutations.length} mutations detected`);
            }
          });
          
          // CRITICAL FIX: Check if document.body exists before observing
          if (document.body) {
            observer.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeOldValue: true
            });
            console.log('🔧 [DOM_OBSERVER] MutationObserver successfully attached to document.body');
          } else {
            console.warn('🔧 [DOM_OBSERVER] document.body not available, retrying in 1 second...');
            setTimeout(setupMutationObserver, 1000);
          }
        } catch (error) {
          console.error('🚨 [DOM_OBSERVER] Failed to setup MutationObserver:', error);
        }
      };
      
      // CRITICAL FIX: Wait for DOM to be ready before setting up observer
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupMutationObserver);
      } else {
        setupMutationObserver();
      }
    });
    
    // Step 1: Navigate to confluence page
    logDiagnostic('NAVIGATION', 'Navigating to confluence page...');
    await page.goto(`${CONFIG.baseUrl}/confluence`, {
      waitUntil: 'networkidle',
      timeout: CONFIG.timeout
    });
    
    // Wait for initial load and capture any immediate errors
    await page.waitForTimeout(5000);
    
    // Take initial screenshot
    await page.screenshot({
      path: path.join(CONFIG.screenshotDir, 'confluence-initial-state.png'),
      fullPage: true
    });
    
    // Step 2: Monitor for 30 seconds to catch intermittent errors
    logDiagnostic('MONITORING', 'Monitoring for console errors and flashing for 30 seconds...');
    
    const startTime = Date.now();
    const monitoringDuration = 30000; // 30 seconds
    
    while (Date.now() - startTime < monitoringDuration) {
      await page.waitForTimeout(1000);
      
      // Check for rapid console message bursts (indicative of loops)
      const recentMessages = consoleMessages.filter(
        msg => Date.now() - new Date(msg.timestamp).getTime() < 2000
      );
      
      if (recentMessages.length > 20) {
        logDiagnostic('LOOP_DETECTION', `High console activity detected: ${recentMessages.length} messages in 2 seconds`);
      }
    }
    
    // Step 3: Test interactivity
    logDiagnostic('INTERACTIVITY', 'Testing page interactivity...');
    
    try {
      // Test clicking on various elements
      const refreshButton = await page.locator('button:has-text("Refresh")').first();
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        await page.waitForTimeout(2000);
        logDiagnostic('INTERACTIVITY', '✅ Refresh button is clickable');
      } else {
        logDiagnostic('INTERACTIVITY', '❌ Refresh button not found or not visible');
      }
      
      // Test filter dropdown
      const emotionFilter = await page.locator('[placeholder*="Filter by emotions"]').first();
      if (await emotionFilter.isVisible()) {
        await emotionFilter.click();
        await page.waitForTimeout(1000);
        logDiagnostic('INTERACTIVITY', '✅ Emotion filter is clickable');
      } else {
        logDiagnostic('INTERACTIVITY', '❌ Emotion filter not found or not visible');
      }
      
    } catch (error) {
      logDiagnostic('INTERACTIVITY', `❌ Interactivity test failed: ${error.message}`);
    }
    
    // Step 4: Final screenshot
    await page.screenshot({
      path: path.join(CONFIG.screenshotDir, 'confluence-final-state.png'),
      fullPage: true
    });
    
    // Step 5: Analyze collected data
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalConsoleMessages: consoleMessages.length,
        jsErrors: jsErrors.length,
        warnings: warnings.length,
        networkErrors: networkErrors.length,
        authStateChanges: authStateChanges.length,
        renderEvents: renderEvents.length
      },
      issues: {
        infiniteLoops: authStateChanges.length > 10 || renderEvents.length > 20,
        authenticationErrors: authStateChanges.some(change => 
          change.text.includes('error') || change.text.includes('failed')
        ),
        networkFailures: networkErrors.length > 0,
        jsErrors: jsErrors.length > 0,
        rapidRerenders: renderEvents.length > 15
      },
      details: {
        consoleMessages: consoleMessages.slice(-50), // Last 50 messages
        jsErrors: jsErrors,
        networkErrors: networkErrors,
        authStateChanges: authStateChanges.slice(-20), // Last 20 auth changes
        renderEvents: renderEvents.slice(-30) // Last 30 render events
      },
      recommendations: []
    };
    
    // Generate recommendations based on findings
    if (diagnosticReport.issues.infiniteLoops) {
      diagnosticReport.recommendations.push(
        'Infinite loop detected - check useEffect dependencies and authentication state management'
      );
    }
    
    if (diagnosticReport.issues.authenticationErrors) {
      diagnosticReport.recommendations.push(
        'Authentication errors detected - check AuthGuard component and auth context'
      );
    }
    
    if (diagnosticReport.issues.networkFailures) {
      diagnosticReport.recommendations.push(
        'Network failures detected - check API endpoints and Supabase configuration'
      );
    }
    
    if (diagnosticReport.issues.jsErrors) {
      diagnosticReport.recommendations.push(
        'JavaScript errors detected - check component implementations and error handling'
      );
    }
    
    if (diagnosticReport.issues.rapidRerenders) {
      diagnosticReport.recommendations.push(
        'Rapid re-renders detected - check React component optimization and memoization'
      );
    }
    
    // Save detailed report
    const reportPath = path.join(CONFIG.screenshotDir, `confluence-console-diagnostic-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(diagnosticReport, null, 2));
    
    // Print summary
    logDiagnostic('SUMMARY', `=== CONSOLE ERROR DIAGNOSTIC SUMMARY ===`);
    logDiagnostic('SUMMARY', `Total Console Messages: ${diagnosticReport.summary.totalConsoleMessages}`);
    logDiagnostic('SUMMARY', `JavaScript Errors: ${diagnosticReport.summary.jsErrors}`);
    logDiagnostic('SUMMARY', `Warnings: ${diagnosticReport.summary.warnings}`);
    logDiagnostic('SUMMARY', `Network Errors: ${diagnosticReport.summary.networkErrors}`);
    logDiagnostic('SUMMARY', `Auth State Changes: ${diagnosticReport.summary.authStateChanges}`);
    logDiagnostic('SUMMARY', `Render Events: ${diagnosticReport.summary.renderEvents}`);
    logDiagnostic('SUMMARY', `=== ISSUES DETECTED ===`);
    
    Object.entries(diagnosticReport.issues).forEach(([issue, detected]) => {
      logDiagnostic('SUMMARY', `${issue}: ${detected ? '❌ DETECTED' : '✅ OK'}`);
    });
    
    logDiagnostic('SUMMARY', `=== RECOMMENDATIONS ===`);
    diagnosticReport.recommendations.forEach((rec, index) => {
      logDiagnostic('SUMMARY', `${index + 1}. ${rec}`);
    });
    
    logDiagnostic('COMPLETION', `Diagnostic completed - report saved to ${reportPath}`);
    
    return diagnosticReport;
    
  } catch (error) {
    logDiagnostic('FATAL_ERROR', `Diagnostic failed: ${error.message}`);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the diagnostic
if (require.main === module) {
  runConsoleErrorDiagnostic()
    .then(() => {
      console.log('\n🎉 Console error diagnostic completed successfully!');
      console.log('📄 Check the diagnostic report and screenshots for detailed analysis.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Console error diagnostic failed:', error);
      process.exit(1);
    });
}

module.exports = { runConsoleErrorDiagnostic };