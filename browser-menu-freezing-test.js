/**
 * Browser Menu Freezing Test
 * 
 * This script uses Puppeteer to automate the manual testing script and capture
 * the actual user experience with the menu freezing issue.
 * 
 * Usage: node browser-menu-freezing-test.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class BrowserMenuFreezingTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      summary: {},
      screenshots: [],
      consoleLogs: [],
      networkRequests: [],
      menuInteractions: [],
      overlayDetections: []
    };
  }

  async init() {
    console.log('🚀 Initializing Browser Menu Freezing Test...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for manual observation
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
        location: msg.location()
      };
      this.testResults.consoleLogs.push(logEntry);
      console.log(`📝 [${msg.type()}] ${msg.text()}`);
    });

    // Set up network monitoring
    this.page.on('request', request => {
      this.testResults.networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now(),
        type: request.resourceType()
      });
    });

    // Set up error handling
    this.page.on('pageerror', error => {
      console.error('❌ Page error:', error.message);
      this.testResults.consoleLogs.push({
        type: 'error',
        text: error.message,
        timestamp: Date.now(),
        stack: error.stack
      });
    });

    return this;
  }

  async navigateToApp() {
    console.log('🌐 Navigating to application...');
    
    try {
      await this.page.goto('http://localhost:3000', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Wait for app to load
      await this.page.waitForTimeout(3000);
      
      // Take initial screenshot
      await this.takeScreenshot('initial-load');
      
      console.log('✅ Application loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load application:', error.message);
      return false;
    }
  }

  async loadDiagnosticScript() {
    console.log('📜 Loading diagnostic script...');
    
    try {
      const scriptPath = path.join(__dirname, 'manual-menu-freezing-diagnosis.js');
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      
      await this.page.evaluate(scriptContent);
      await this.page.waitForTimeout(1000);
      
      console.log('✅ Diagnostic script loaded');
      return true;
    } catch (error) {
      console.error('❌ Failed to load diagnostic script:', error.message);
      return false;
    }
  }

  async initializeDiagnostics() {
    console.log('🔍 Initializing diagnostics...');
    
    try {
      await this.page.evaluate(() => {
        return window.MenuFreezingDiagnosis.init();
      });
      
      await this.page.waitForTimeout(1000);
      
      console.log('✅ Diagnostics initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize diagnostics:', error.message);
      return false;
    }
  }

  async testMenuResponsiveness() {
    console.log('🔘 Testing menu responsiveness...');
    
    try {
      const menuElements = await this.page.evaluate(() => {
        return window.MenuFreezingDiagnosis.testMenuResponsiveness();
      });
      
      console.log(`📊 Found ${menuElements.length} menu elements`);
      
      // Take screenshot of menu state
      await this.takeScreenshot('menu-responsiveness');
      
      return menuElements;
    } catch (error) {
      console.error('❌ Failed to test menu responsiveness:', error.message);
      return [];
    }
  }

  async checkBlockingOverlays() {
    console.log('🚫 Checking for blocking overlays...');
    
    try {
      const overlays = await this.page.evaluate(() => {
        return window.MenuFreezingDiagnosis.checkBlockingOverlays();
      });
      
      console.log(`🔍 Found ${overlays.length} potential blocking overlays`);
      
      // Take screenshot of overlay state
      await this.takeScreenshot('overlay-check');
      
      return overlays;
    } catch (error) {
      console.error('❌ Failed to check blocking overlays:', error.message);
      return [];
    }
  }

  async testTradesNavigation() {
    console.log('🎯 Testing Trades navigation issue...');
    
    try {
      // First, let's see if we need to login
      const currentUrl = this.page.url();
      console.log('📍 Current URL:', currentUrl);
      
      if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
        console.log('🔐 Need to login first...');
        await this.performLogin();
      }
      
      // Test the specific Trades navigation issue
      const testResults = await this.page.evaluate(() => {
        return window.MenuFreezingDiagnosis.testTradesTabIssue();
      });
      
      console.log('✅ Trades navigation test completed');
      
      // Take screenshot after navigation tests
      await this.takeScreenshot('trades-navigation-test');
      
      return testResults;
    } catch (error) {
      console.error('❌ Failed to test Trades navigation:', error.message);
      return null;
    }
  }

  async performLogin() {
    console.log('🔐 Performing login...');
    
    try {
      // Look for login form
      await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
      
      // Fill in login credentials (you may need to adjust these)
      await this.page.type('input[type="email"], input[name="email"]', 'test@example.com');
      await this.page.type('input[type="password"], input[name="password"]', 'password123');
      
      // Click login button
      await this.page.click('button[type="submit"], button:contains("Login"), button:contains("Sign In")');
      
      // Wait for navigation
      await this.page.waitForNavigation({ timeout: 10000 });
      
      console.log('✅ Login completed');
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      console.log('⚠️  Continuing without login...');
      return false;
    }
  }

  async testViewportChanges() {
    console.log('📱 Testing viewport changes...');
    
    const viewports = [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      console.log(`🖥️  Testing ${viewport.name} viewport...`);
      
      // Set viewport
      await this.page.setViewport({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(1000);
      
      // Test menu responsiveness
      await this.testMenuResponsiveness();
      
      // Check for overlays
      await this.checkBlockingOverlays();
      
      // Take screenshot
      await this.takeScreenshot(`viewport-${viewport.name}`);
    }
  }

  async runCompleteDiagnosis() {
    console.log('🚀 Running complete diagnosis...');
    
    try {
      const report = await this.page.evaluate(() => {
        return window.MenuFreezingDiagnosis.runCompleteDiagnosis();
      });
      
      console.log('✅ Complete diagnosis finished');
      console.log('📋 Summary:', report.summary);
      console.log('💡 Recommendations:', report.recommendations);
      
      // Take final screenshot
      await this.takeScreenshot('final-diagnosis');
      
      return report;
    } catch (error) {
      console.error('❌ Complete diagnosis failed:', error.message);
      return null;
    }
  }

  async takeScreenshot(name) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `menu-freezing-test-${name}-${timestamp}.png`;
      const filepath = path.join(__dirname, filename);
      
      await this.page.screenshot({ 
        path: filepath,
        fullPage: true 
      });
      
      this.testResults.screenshots.push({
        name,
        filename,
        filepath,
        timestamp: Date.now()
      });
      
      console.log(`📸 Screenshot saved: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to take screenshot:', error.message);
    }
  }

  async saveResults() {
    console.log('💾 Saving test results...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(__dirname, `menu-freezing-test-results-${timestamp}.json`);
    
    try {
      fs.writeFileSync(resultsFile, JSON.stringify(this.testResults, null, 2));
      console.log(`✅ Results saved to: ${resultsFile}`);
      return resultsFile;
    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
      return null;
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
  }

  async run() {
    console.log('🚀 Starting Browser Menu Freezing Test...');
    
    try {
      // Initialize
      await this.init();
      
      // Navigate to app
      const appLoaded = await this.navigateToApp();
      if (!appLoaded) {
        throw new Error('Failed to load application');
      }
      
      // Load diagnostic script
      const scriptLoaded = await this.loadDiagnosticScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load diagnostic script');
      }
      
      // Initialize diagnostics
      const diagnosticsInitialized = await this.initializeDiagnostics();
      if (!diagnosticsInitialized) {
        throw new Error('Failed to initialize diagnostics');
      }
      
      // Run tests
      await this.testMenuResponsiveness();
      await this.checkBlockingOverlays();
      await this.testTradesNavigation();
      await this.testViewportChanges();
      
      // Run complete diagnosis
      const finalReport = await this.runCompleteDiagnosis();
      
      // Save results
      const resultsFile = await this.saveResults();
      
      console.log('✅ Browser Menu Freezing Test completed successfully!');
      console.log('📊 Final Report Summary:', finalReport?.summary);
      console.log('💡 Key Recommendations:', finalReport?.recommendations);
      
      return {
        success: true,
        resultsFile,
        report: finalReport
      };
      
    } catch (error) {
      console.error('❌ Browser Menu Freezing Test failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const test = new BrowserMenuFreezingTest();
  test.run()
    .then(result => {
      console.log('🎉 Test completed:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test crashed:', error);
      process.exit(1);
    });
}

module.exports = BrowserMenuFreezingTest;