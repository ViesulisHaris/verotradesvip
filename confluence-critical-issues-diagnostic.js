const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  screenshotDir: './confluence-diagnostic-screenshots',
  timeout: 30000,
  testUser: {
    email: 'testuser@verotrade.com',
    password: 'TestPassword123!'
  }
};

// Ensure screenshot directory exists
if (!fs.existsSync(CONFIG.screenshotDir)) {
  fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
}

// Diagnostic logging
function logDiagnostic(category, message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;
  console.log(logEntry);
  
  // Save to diagnostic log file
  fs.appendFileSync(
    path.join(CONFIG.screenshotDir, 'diagnostic.log'),
    logEntry + '\n'
  );
}

// Capture console errors and warnings
function setupConsoleCapture(page) {
  const consoleMessages = [];
  
  page.on('console', (msg) => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    };
    
    consoleMessages.push(message);
    
    if (msg.type() === 'error') {
      logDiagnostic('CONSOLE_ERROR', `${msg.text()} at ${msg.location().url}:${msg.location().lineNumber}`, 'error');
    } else if (msg.type() === 'warning') {
      logDiagnostic('CONSOLE_WARNING', msg.text(), 'warning');
    }
  });
  
  page.on('pageerror', (error) => {
    const errorMessage = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    consoleMessages.push(errorMessage);
    logDiagnostic('PAGE_ERROR', `${error.message}\n${error.stack}`, 'error');
  });
  
  return consoleMessages;
}

// Check for dark overlay issues
async function diagnoseDarkOverlay(page) {
  logDiagnostic('OVERLAY_DIAGNOSIS', 'Checking for dark overlay issues...');
  
  const overlayAnalysis = await page.evaluate(() => {
    const results = {
      potentialOverlays: [],
      zIndexConflicts: [],
      modalElements: [],
      backdropFilters: [],
      highZIndexElements: []
    };
    
    // Check for potential overlay elements
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      // Check for full-screen overlays
      if (rect.width >= window.innerWidth * 0.9 && 
          rect.height >= window.innerHeight * 0.9) {
        
        const zIndex = parseInt(styles.zIndex) || 0;
        const position = styles.position;
        const backgroundColor = styles.backgroundColor;
        const backdropFilter = styles.backdropFilter;
        
        if (zIndex > 100 || position === 'fixed' || position === 'absolute') {
          results.potentialOverlays.push({
            tag: el.tagName,
            className: el.className,
            zIndex,
            position,
            backgroundColor,
            backdropFilter,
            rect: {
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left
            }
          });
        }
      }
      
      // Check for high z-index values
      if (zIndex > 1000) {
        results.highZIndexElements.push({
          tag: el.tagName,
          className: el.className,
          zIndex,
          position
        });
      }
      
      // Check for backdrop filters
      if (backdropFilter && backdropFilter !== 'none') {
        results.backdropFilters.push({
          tag: el.tagName,
          className: el.className,
          backdropFilter
        });
      }
      
      // Check for modal-like elements
      if (el.getAttribute('role') === 'dialog' || 
          el.getAttribute('aria-modal') === 'true' ||
          el.classList.contains('modal') ||
          el.classList.contains('overlay')) {
        results.modalElements.push({
          tag: el.tagName,
          className: el.className,
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity
        });
      }
    });
    
    return results;
  });
  
  logDiagnostic('OVERLAY_ANALYSIS', `Found ${overlayAnalysis.potentialOverlays.length} potential overlays`);
  logDiagnostic('OVERLAY_ANALYSIS', `Found ${overlayAnalysis.modalElements.length} modal elements`);
  logDiagnostic('OVERLAY_ANALYSIS', `Found ${overlayAnalysis.backdropFilters.length} backdrop filters`);
  logDiagnostic('OVERLAY_ANALYSIS', `Found ${overlayAnalysis.highZIndexElements.length} high z-index elements`);
  
  return overlayAnalysis;
}

// Check emotion radar positioning issues
async function diagnoseEmotionRadar(page) {
  logDiagnostic('RADAR_DIAGNOSIS', 'Checking emotion radar positioning issues...');
  
  const radarAnalysis = await page.evaluate(() => {
    const results = {
      radarFound: false,
      positionIssues: [],
      transformIssues: [],
      animationIssues: [],
      containerIssues: []
    };
    
    // Find emotion radar components
    const radarContainers = document.querySelectorAll('[class*="chart"], [class*="radar"], [class*="emotion"]');
    
    radarContainers.forEach(container => {
      results.radarFound = true;
      const styles = window.getComputedStyle(container);
      const rect = container.getBoundingClientRect();
      
      // Check for positioning issues
      if (styles.position === 'relative' || styles.position === 'absolute' || styles.position === 'fixed') {
        results.positionIssues.push({
          element: container.className,
          position: styles.position,
          top: styles.top,
          left: styles.left,
          transform: styles.transform,
          rect: {
            width: rect.width,
            height: rect.top,
            top: rect.top,
            left: rect.left
          }
        });
      }
      
      // Check for transform issues
      if (styles.transform && styles.transform !== 'none') {
        results.transformIssues.push({
          element: container.className,
          transform: styles.transform,
          transformOrigin: styles.transformOrigin,
          willChange: styles.willChange
        });
      }
      
      // Check for animation issues
      if (styles.animation && styles.animation !== 'none') {
        results.animationIssues.push({
          element: container.className,
          animation: styles.animation,
          transition: styles.transition
        });
      }
      
      // Check container dimensions
      if (rect.width < 200 || rect.height < 200) {
        results.containerIssues.push({
          element: container.className,
          width: rect.width,
          height: rect.height,
          minWidth: styles.minWidth,
          minHeight: styles.minHeight
        });
      }
    });
    
    return results;
  });
  
  logDiagnostic('RADAR_ANALYSIS', `Radar found: ${radarAnalysis.radarFound}`);
  logDiagnostic('RADAR_ANALYSIS', `Position issues: ${radarAnalysis.positionIssues.length}`);
  logDiagnostic('RADAR_ANALYSIS', `Transform issues: ${radarAnalysis.transformIssues.length}`);
  logDiagnostic('RADAR_ANALYSIS', `Animation issues: ${radarAnalysis.animationIssues.length}`);
  logDiagnostic('RADAR_ANALYSIS', `Container issues: ${radarAnalysis.containerIssues.length}`);
  
  return radarAnalysis;
}

// Check data fetching issues
async function diagnoseDataFetching(page) {
  logDiagnostic('DATA_FETCH_DIAGNOSIS', 'Checking data fetching issues...');
  
  const dataAnalysis = await page.evaluate(() => {
    const results = {
      networkRequests: [],
      errorMessages: [],
      loadingStates: [],
      authIssues: []
    };
    
    // Monitor network requests (this would need to be set up before page load)
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      const options = args[1] || {};
      
      results.networkRequests.push({
        url,
        method: options.method || 'GET',
        timestamp: new Date().toISOString()
      });
      
      return originalFetch.apply(this, args)
        .then(response => {
          if (!response.ok) {
            results.errorMessages.push({
              url,
              status: response.status,
              statusText: response.statusText,
              timestamp: new Date().toISOString()
            });
          }
          return response;
        })
        .catch(error => {
          results.errorMessages.push({
            url,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          throw error;
        });
    };
    
    // Check for loading states
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
    loadingElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      results.loadingStates.push({
        element: el.className,
        display: styles.display,
        visibility: styles.visibility
      });
    });
    
    // Check for auth-related elements
    const authElements = document.querySelectorAll('[class*="auth"], [class*="login"], [class*="guard"]');
    authElements.forEach(el => {
      results.authIssues.push({
        element: el.className,
        textContent: el.textContent?.substring(0, 100)
      });
    });
    
    return results;
  });
  
  logDiagnostic('DATA_FETCH_ANALYSIS', `Network requests: ${dataAnalysis.networkRequests.length}`);
  logDiagnostic('DATA_FETCH_ANALYSIS', `Error messages: ${dataAnalysis.errorMessages.length}`);
  logDiagnostic('DATA_FETCH_ANALYSIS', `Loading states: ${dataAnalysis.loadingStates.length}`);
  logDiagnostic('DATA_FETCH_ANALYSIS', `Auth elements: ${dataAnalysis.authIssues.length}`);
  
  return dataAnalysis;
}

// Main diagnostic function
async function runConfluenceDiagnostics() {
  logDiagnostic('MAIN', 'Starting confluence critical issues diagnostic...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set up console capture
    const consoleMessages = setupConsoleCapture(page);
    
    // Set up network monitoring
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('supabase') || url.includes('api')) {
        logDiagnostic('NETWORK_REQUEST', `${request.method()} ${url}`);
      }
      request.continue();
    });
    
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('supabase') || url.includes('api')) {
        const status = response.status();
        if (status >= 400) {
          logDiagnostic('NETWORK_ERROR', `${status} ${url}`, 'error');
        } else {
          logDiagnostic('NETWORK_SUCCESS', `${status} ${url}`);
        }
      }
    });
    
    // Navigate to confluence page
    logDiagnostic('NAVIGATION', 'Navigating to confluence page...');
    await page.goto(`${CONFIG.baseUrl}/confluence`, { 
      waitUntil: 'networkidle2',
      timeout: CONFIG.timeout 
    });
    
    // Wait for page to load
    await page.waitForTimeout(5000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: path.join(CONFIG.screenshotDir, 'confluence-initial-state.png'),
      fullPage: true 
    });
    
    // Check if we're on login page (auth redirect)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      logDiagnostic('AUTH_REDIRECT', 'Redirected to login page - attempting login...');
      
      // Perform login
      await page.type('input[type="email"]', CONFIG.testUser.email);
      await page.type('input[type="password"]', CONFIG.testUser.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);
      
      // Navigate back to confluence
      await page.goto(`${CONFIG.baseUrl}/confluence`, { 
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout 
      });
      await page.waitForTimeout(5000);
    }
    
    // Run diagnostics
    const overlayResults = await diagnoseDarkOverlay(page);
    const radarResults = await diagnoseEmotionRadar(page);
    const dataResults = await diagnoseDataFetching(page);
    
    // Take diagnostic screenshots
    await page.screenshot({ 
      path: path.join(CONFIG.screenshotDir, 'confluence-overlay-analysis.png'),
      fullPage: true 
    });
    
    // Check for specific error messages
    const errorElements = await page.$$('text="error fetching trades"');
    logDiagnostic('ERROR_DETECTION', `Found ${errorElements.length} "error fetching trades" elements`);
    
    // Check for emotion radar specifically
    const radarElements = await page.$$('[class*="radar"], [class*="chart"]');
    logDiagnostic('RADAR_DETECTION', `Found ${radarElements.length} radar/chart elements`);
    
    // Compile diagnostic report
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      consoleMessages: consoleMessages.filter(msg => msg.type === 'error' || msg.type === 'warning'),
      overlayAnalysis: overlayResults,
      radarAnalysis: radarResults,
      dataAnalysis: dataResults,
      errorElementsFound: errorElements.length,
      radarElementsFound: radarElements.length
    };
    
    // Save diagnostic report
    fs.writeFileSync(
      path.join(CONFIG.screenshotDir, `confluence-diagnostic-report-${Date.now()}.json`),
      JSON.stringify(diagnosticReport, null, 2)
    );
    
    logDiagnostic('COMPLETION', 'Diagnostic completed successfully');
    
    return diagnosticReport;
    
  } catch (error) {
    logDiagnostic('FATAL_ERROR', `Diagnostic failed: ${error.message}`, 'error');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the diagnostic
if (require.main === module) {
  runConfluenceDiagnostics()
    .then(() => {
      console.log('\n✅ Confluence diagnostic completed successfully!');
      console.log(`📁 Check ${CONFIG.screenshotDir} for screenshots and reports`);
    })
    .catch((error) => {
      console.error('\n❌ Diagnostic failed:', error);
      process.exit(1);
    });
}

module.exports = { runConfluenceDiagnostics };