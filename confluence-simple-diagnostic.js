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

// Simple diagnostic function
async function runSimpleDiagnostic() {
  logDiagnostic('MAIN', 'Starting simple confluence diagnostic...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture console errors
    const consoleMessages = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        });
        logDiagnostic('CONSOLE_ERROR', `${msg.text()} at ${msg.location().url}:${msg.location().lineNumber}`, 'error');
      }
    });
    
    page.on('pageerror', (error) => {
      consoleMessages.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      logDiagnostic('PAGE_ERROR', `${error.message}\n${error.stack}`, 'error');
    });
    
    // Navigate to confluence page
    logDiagnostic('NAVIGATION', 'Navigating to confluence page...');
    await page.goto(`${CONFIG.baseUrl}/confluence`, { 
      waitUntil: 'networkidle2',
      timeout: CONFIG.timeout 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take initial screenshot
    await page.screenshot({ 
      path: path.join(CONFIG.screenshotDir, 'confluence-initial-state.png'),
      fullPage: true 
    });
    
    // Check current URL
    const currentUrl = page.url();
    logDiagnostic('URL_CHECK', `Current URL: ${currentUrl}`);
    
    // Check if we're on login page (auth redirect)
    if (currentUrl.includes('/login')) {
      logDiagnostic('AUTH_REDIRECT', 'Redirected to login page - attempting login...');
      
      // Perform login
      await page.type('input[type="email"]', CONFIG.testUser.email);
      await page.type('input[type="password"]', CONFIG.testUser.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Navigate back to confluence
      await page.goto(`${CONFIG.baseUrl}/confluence`, { 
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout 
      });
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Check for specific issues
    logDiagnostic('ANALYSIS', 'Analyzing page for specific issues...');
    
    // Check for dark overlay
    const overlayCheck = await page.evaluate(() => {
      const overlays = [];
      document.querySelectorAll('*').forEach(el => {
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // Look for full-screen dark overlays
        if (rect.width >= window.innerWidth * 0.9 && 
            rect.height >= window.innerHeight * 0.9 &&
            (styles.backgroundColor === 'rgba(0, 0, 0, 0.5)' || 
             styles.backgroundColor === 'rgba(0, 0, 0, 0.3)' ||
             styles.backdropFilter !== 'none')) {
          overlays.push({
            element: el.tagName,
            class: el.className,
            backgroundColor: styles.backgroundColor,
            backdropFilter: styles.backdropFilter,
            zIndex: styles.zIndex
          });
        }
      });
      return overlays;
    });
    
    logDiagnostic('OVERLAY_CHECK', `Found ${overlayCheck.length} potential dark overlays`);
    overlayCheck.forEach((overlay, index) => {
      logDiagnostic('OVERLAY_DETAIL', `Overlay ${index + 1}: ${overlay.element} - ${overlay.backgroundColor}`);
    });
    
    // Check for emotion radar positioning
    const radarCheck = await page.evaluate(() => {
      const radarElements = [];
      document.querySelectorAll('[class*="chart"], [class*="radar"], [class*="emotion"]').forEach(el => {
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        radarElements.push({
          element: el.tagName,
          class: el.className,
          position: styles.position,
          transform: styles.transform,
          top: styles.top,
          left: styles.left,
          rect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          }
        });
      });
      return radarElements;
    });
    
    logDiagnostic('RADAR_CHECK', `Found ${radarCheck.length} radar/chart elements`);
    radarCheck.forEach((radar, index) => {
      logDiagnostic('RADAR_DETAIL', `Radar ${index + 1}: ${radar.class} - position: ${radar.position}, transform: ${radar.transform}`);
    });
    
    // Check for error messages
    const errorCheck = await page.evaluate(() => {
      const errorElements = [];
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent || '';
        if (text.toLowerCase().includes('error fetching trades') ||
            text.toLowerCase().includes('failed to fetch') ||
            text.toLowerCase().includes('network error')) {
          errorElements.push({
            element: el.tagName,
            class: el.className,
            text: text.substring(0, 100),
            visible: el.offsetParent !== null
          });
        }
      });
      return errorElements;
    });
    
    logDiagnostic('ERROR_CHECK', `Found ${errorCheck.length} error message elements`);
    errorCheck.forEach((error, index) => {
      logDiagnostic('ERROR_DETAIL', `Error ${index + 1}: ${error.text.substring(0, 50)}...`);
    });
    
    // Take final screenshot
    await page.screenshot({ 
      path: path.join(CONFIG.screenshotDir, 'confluence-final-state.png'),
      fullPage: true 
    });
    
    // Compile diagnostic report
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      consoleErrors: consoleMessages,
      overlayAnalysis: overlayCheck,
      radarAnalysis: radarCheck,
      errorAnalysis: errorCheck
    };
    
    // Save diagnostic report
    const reportPath = path.join(CONFIG.screenshotDir, `confluence-diagnostic-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(diagnosticReport, null, 2));
    
    logDiagnostic('COMPLETION', `Diagnostic completed - report saved to ${reportPath}`);
    
    return diagnosticReport;
    
  } catch (error) {
    logDiagnostic('FATAL_ERROR', `Diagnostic failed: ${error.message}`, 'error');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run diagnostic
if (require.main === module) {
  runSimpleDiagnostic()
    .then(() => {
      console.log('\n✅ Confluence diagnostic completed successfully!');
      console.log(`📁 Check ${CONFIG.screenshotDir} for screenshots and reports`);
    })
    .catch((error) => {
      console.error('\n❌ Diagnostic failed:', error);
      process.exit(1);
    });
}

module.exports = { runSimpleDiagnostic };