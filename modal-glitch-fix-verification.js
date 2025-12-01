/**
 * Comprehensive Modal Glitch Fix Verification Test Script
 * 
 * This script validates that the modal glitch fix works correctly across different scenarios and browsers.
 * The fix replaced the nested modal wrapper structure in EnhancedStrategyCard.tsx with simplified modal rendering.
 * 
 * Root cause: Double modal structure where EnhancedStrategyCard created an unnecessary wrapper 
 * that nested with StrategyPerformanceModal's own backdrop, causing the "trapped in a box" effect.
 */

const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  browsers: ['chromium', 'firefox', 'webkit'], // Chrome/Edge, Firefox, Safari
  viewports: [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 1024, height: 768 },
    { name: 'Mobile', width: 375, height: 667 }
  ],
  timeout: 30000,
  screenshotDir: './modal-test-screenshots',
  reportDir: './modal-test-reports'
};

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Basic Modal Open/Close',
    description: 'Test basic modal opening and closing functionality',
    path: '/test-modal-glitch',
    actions: [
      { type: 'waitForSelector', selector: '.glass' },
      { type: 'click', selector: 'button:has-text("View Performance Details")' },
      { type: 'waitForSelector', selector: '[data-testid="strategy-performance-modal-backdrop"]' },
      { type: 'screenshot', name: 'modal-opened' },
      { type: 'click', selector: 'button:has-text("Close")' },
      { type: 'waitForSelector', selector: '[data-testid="strategy-performance-modal-backdrop"]', state: 'hidden' },
      { type: 'screenshot', name: 'modal-closed' }
    ]
  },
  {
    name: 'Rapid Modal Operations',
    description: 'Test rapid modal opening and closing to detect race conditions',
    path: '/test-modal-glitch',
    actions: [
      { type: 'waitForSelector', selector: '.glass' },
      { type: 'rapidClick', selector: 'button:has-text("View Performance Details")', count: 3 },
      { type: 'waitForSelector', selector: '[data-testid="strategy-performance-modal-backdrop"]' },
      { type: 'screenshot', name: 'rapid-open-result' },
      { type: 'rapidClick', selector: 'button:has-text("Close")', count: 3 },
      { type: 'waitForSelector', selector: '[data-testid="strategy-performance-modal-backdrop"]', state: 'hidden' },
      { type: 'screenshot', name: 'rapid-close-result' }
    ]
  },
  {
    name: 'Tab Switching Within Modal',
    description: 'Test tab switching functionality within the modal',
    path: '/test-modal-glitch',
    actions: [
      { type: 'waitForSelector', selector: '.glass' },
      { type: 'click', selector: 'button:has-text("View Performance Details")' },
      { type: 'waitForSelector', selector: '[data-testid="strategy-performance-modal-backdrop"]' },
      { type: 'screenshot', name: 'modal-overview-tab' },
      { type: 'click', selector: 'button:has-text("Performance")' },
      { type: 'waitForTimeout', timeout: 1000 },
      { type: 'screenshot', name: 'modal-performance-tab' },
      { type: 'click', selector: 'button:has-text("Overview")' },
      { type: 'waitForTimeout', timeout: 1000 },
      { type: 'screenshot', name: 'modal-back-to-overview' },
      { type: 'click', selector: 'button:has-text("Close")' }
    ]
  },
  {
    name: 'ESC Key Close',
    description: 'Test ESC key functionality to close modal',
    path: '/test-modal-glitch',
    actions: [
      { type: 'waitForSelector', selector: '.glass' },
      { type: 'click', selector: 'button:has-text("View Performance Details")' },
      { type: 'waitForSelector', selector: '[data-testid="strategy-performance-modal-backdrop"]' },
      { type: 'screenshot', name: 'modal-before-esc' },
      { type: 'pressKey', key: 'Escape' },
      { type: 'waitForSelector', selector: '[data-testid="strategy-performance-modal-backdrop"]', state: 'hidden' },
      { type: 'screenshot', name: 'modal-after-esc' }
    ]
  },
  {
    name: 'Backdrop Click Close',
    description: 'Test clicking on backdrop to close modal',
    path: '/test-modal-glitch',
    actions: [
      { type: 'waitForSelector', selector: '.glass' },
      { type: 'click', selector: 'button:has-text("View Performance Details")' },
      { type: 'waitForSelector', selector: '[data-testid="strategy-performance-modal-backdrop"]' },
      { type: 'screenshot', name: 'modal-before-backdrop-click' },
      { type: 'click', selector: '[data-testid="strategy-performance-modal-backdrop"]', position: { x: 100, y: 100 } },
      { type: 'waitForSelector', selector: '[data-testid="strategy-performance-modal-backdrop"]', state: 'hidden' },
      { type: 'screenshot', name: 'modal-after-backdrop-click' }
    ]
  },
  {
    name: 'Multiple Strategy Modals',
    description: 'Test opening modals for different strategies',
    path: '/test-modal-glitch',
    actions: [
      { type: 'waitForSelector', selector: '[data-testid="strategy-card"]' },
      { type: 'click', selector: '.glass:first-child button:has-text("View Performance Details")' },
      { type: 'waitForSelector', selector: '[data-testid="strategy-performance-modal-backdrop"]' },
      { type: 'screenshot', name: 'first-strategy-modal' },
      { type: 'click', selector: 'button:has-text("Close")' },
      { type: 'waitForSelector', selector: '[data-testid="strategy-performance-modal-backdrop"]', state: 'hidden' },
      { type: 'waitForTimeout', timeout: 500 },
      { type: 'click', selector: '.glass:nth-child(2) button:has-text("View Performance Details")' },
      { type: 'waitForSelector', selector: '[data-testid="strategy-performance-modal-backdrop"]' },
      { type: 'screenshot', name: 'second-strategy-modal' },
      { type: 'click', selector: 'button:has-text("Close")' }
    ]
  }
];

// Verification checks
const VERIFICATION_CHECKS = {
  singleBackdrop: async (page) => {
    const backdrops = await page.$$('[data-testid="strategy-performance-modal-backdrop"]');
    return {
      passed: backdrops.length === 1,
      message: backdrops.length === 1 ? '✅ Single backdrop found' : `❌ Multiple backdrops found: ${backdrops.length}`,
      details: { backdropCount: backdrops.length }
    };
  },
  
  properZIndex: async (page) => {
    const backdrop = await page.$('[data-testid="strategy-performance-modal-backdrop"]');
    if (!backdrop) return { passed: false, message: '❌ No backdrop found' };
    
    const zIndex = await backdrop.evaluate(el => getComputedStyle(el).zIndex);
    const numericZIndex = parseInt(zIndex);
    
    return {
      passed: numericZIndex >= 999999,
      message: numericZIndex >= 999999 ? `✅ Proper z-index: ${zIndex}` : `❌ Low z-index: ${zIndex}`,
      details: { zIndex, numericZIndex }
    };
  },
  
  noConsoleErrors: async (page) => {
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    // Wait a bit to collect any errors
    await page.waitForTimeout(1000);
    
    return {
      passed: logs.length === 0,
      message: logs.length === 0 ? '✅ No console errors' : `❌ Console errors found: ${logs.length}`,
      details: { errors: logs }
    };
  },
  
  properPositioning: async (page) => {
    const backdrop = await page.$('[data-testid="strategy-performance-modal-backdrop"]');
    if (!backdrop) return { passed: false, message: '❌ No backdrop found' };
    
    const positioning = await backdrop.evaluate(el => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        position: style.position,
        top: style.top,
        left: style.left,
        width: style.width,
        height: style.height,
        rectWidth: rect.width,
        rectHeight: rect.height
      };
    });
    
    const isProperlyPositioned = 
      positioning.position === 'fixed' &&
      positioning.top === '0px' &&
      positioning.left === '0px' &&
      positioning.width === '100vw' &&
      positioning.height === '100vh';
    
    return {
      passed: isProperlyPositioned,
      message: isProperlyPositioned ? '✅ Proper modal positioning' : '❌ Incorrect modal positioning',
      details: positioning
    };
  },
  
  noNestedModals: async (page) => {
    // Check for nested modal structures that could cause the "trapped in a box" effect
    const modalContainers = await page.$$('.fixed.inset-0');
    const nestedBackdrops = await page.$$('[class*="backdrop"], [class*="modal-backdrop"]');
    
    return {
      passed: modalContainers.length === 1 && nestedBackdrops.length <= 1,
      message: (modalContainers.length === 1 && nestedBackdrops.length <= 1) 
        ? '✅ No nested modal structures detected' 
        : `❌ Potential nested modals: ${modalContainers.length} containers, ${nestedBackdrops.length} backdrops`,
      details: { 
        modalContainers: modalContainers.length, 
        nestedBackdrops: nestedBackdrops.length 
      }
    };
  }
};

// Test runner class
class ModalGlitchFixVerifier {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        browsers: TEST_CONFIG.browsers.length,
        viewports: TEST_CONFIG.viewports.length
      },
      browserResults: {},
      screenshots: [],
      errors: []
    };
    
    this.ensureDirectories();
  }
  
  ensureDirectories() {
    if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
      fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
    }
    if (!fs.existsSync(TEST_CONFIG.reportDir)) {
      fs.mkdirSync(TEST_CONFIG.reportDir, { recursive: true });
    }
  }
  
  async runSingleTest(browserType, viewport, scenario) {
    const browser = await browserType.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      userAgent: this.getUserAgent(browserType.name())
    });
    
    const page = await context.newPage();
    
    try {
      // Collect console errors
      const consoleLogs = [];
      page.on('console', msg => {
        consoleLogs.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location()
        });
      });
      
      // Navigate to test page
      await page.goto(`${TEST_CONFIG.baseUrl}${scenario.path}`, { 
        waitUntil: 'networkidle',
        timeout: TEST_CONFIG.timeout 
      });
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      // Execute test actions
      for (const action of scenario.actions) {
        await this.executeAction(page, action, viewport, browserType.name(), scenario.name);
      }
      
      // Run verification checks
      const verificationResults = {};
      for (const [checkName, checkFunction] of Object.entries(VERIFICATION_CHECKS)) {
        try {
          verificationResults[checkName] = await checkFunction(page);
        } catch (error) {
          verificationResults[checkName] = {
            passed: false,
            message: `❌ Check failed with error: ${error.message}`,
            details: { error: error.message }
          };
        }
      }
      
      // Determine if test passed
      const allChecksPassed = Object.values(verificationResults).every(check => check.passed);
      
      return {
        passed: allChecksPassed,
        verificationResults,
        consoleLogs: consoleLogs.filter(log => log.type === 'error'),
        screenshotPath: this.results.screenshots.slice(-5) // Last 5 screenshots for this test
      };
      
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        verificationResults: {},
        consoleLogs: [],
        screenshotPath: []
      };
    } finally {
      await browser.close();
    }
  }
  
  async executeAction(page, action, viewport, browserName, scenarioName) {
    const timestamp = Date.now();
    const screenshotPrefix = `${browserName}-${viewport.name}-${scenarioName}-${action.type}-${timestamp}`;
    
    switch (action.type) {
      case 'waitForSelector':
        await page.waitForSelector(action.selector, { 
          state: action.state || 'visible', 
          timeout: TEST_CONFIG.timeout 
        });
        break;
        
      case 'click':
        await page.click(action.selector);
        break;
        
      case 'rapidClick':
        for (let i = 0; i < action.count; i++) {
          await page.click(action.selector);
          await page.waitForTimeout(100); // Small delay between clicks
        }
        break;
        
      case 'waitForTimeout':
        await page.waitForTimeout(action.timeout || 1000);
        break;
        
      case 'pressKey':
        await page.keyboard.press(action.key);
        break;
        
      case 'screenshot':
        const screenshotPath = path.join(TEST_CONFIG.screenshotDir, `${screenshotPrefix}-${action.name}.png`);
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: true 
        });
        this.results.screenshots.push(screenshotPath);
        break;
    }
  }
  
  getUserAgent(browserName) {
    const userAgents = {
      chromium: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      webkit: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
    };
    return userAgents[browserName] || userAgents.chromium;
  }
  
  async runAllTests() {
    console.log('🚀 Starting Modal Glitch Fix Verification Tests...\n');
    
    for (const browserName of TEST_CONFIG.browsers) {
      console.log(`📱 Testing on ${browserName.toUpperCase()}...`);
      this.results.browserResults[browserName] = {};
      
      const browserType = this.getBrowserType(browserName);
      
      for (const viewport of TEST_CONFIG.viewports) {
        console.log(`  🖥️  Testing on ${viewport.name} (${viewport.width}x${viewport.height})...`);
        this.results.browserResults[browserName][viewport.name] = {};
        
        for (const scenario of TEST_SCENARIOS) {
          console.log(`    🧪 Running: ${scenario.name}`);
          this.results.summary.totalTests++;
          
          const testResult = await this.runSingleTest(browserType, viewport, scenario);
          this.results.browserResults[browserName][viewport.name][scenario.name] = testResult;
          
          if (testResult.passed) {
            this.results.summary.passedTests++;
            console.log(`      ✅ PASSED`);
          } else {
            this.results.summary.failedTests++;
            console.log(`      ❌ FAILED: ${testResult.error || 'Verification checks failed'}`);
            
            if (testResult.verificationResults) {
              Object.values(testResult.verificationResults).forEach(check => {
                if (!check.passed) {
                  console.log(`         - ${check.message}`);
                }
              });
            }
          }
        }
      }
    }
    
    console.log('\n📊 Test execution completed!');
    this.generateReports();
  }
  
  getBrowserType(browserName) {
    switch (browserName) {
      case 'chromium': return chromium;
      case 'firefox': return firefox;
      case 'webkit': return webkit;
      default: return chromium;
    }
  }
  
  generateReports() {
    // Generate JSON report
    const jsonReportPath = path.join(TEST_CONFIG.reportDir, `modal-glitch-fix-verification-${Date.now()}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(this.results, null, 2));
    
    // Generate Markdown report
    const markdownReport = this.generateMarkdownReport();
    const markdownReportPath = path.join(TEST_CONFIG.reportDir, `modal-glitch-fix-verification-${Date.now()}.md`);
    fs.writeFileSync(markdownReportPath, markdownReport);
    
    console.log(`\n📄 Reports generated:`);
    console.log(`  📊 JSON: ${jsonReportPath}`);
    console.log(`  📝 Markdown: ${markdownReportPath}`);
    console.log(`  📸 Screenshots: ${TEST_CONFIG.screenshotDir}`);
    
    // Print summary
    console.log(`\n🎯 Test Summary:`);
    console.log(`  Total Tests: ${this.results.summary.totalTests}`);
    console.log(`  Passed: ${this.results.summary.passedTests} ✅`);
    console.log(`  Failed: ${this.results.summary.failedTests} ❌`);
    console.log(`  Success Rate: ${((this.results.summary.passedTests / this.results.summary.totalTests) * 100).toFixed(1)}%`);
  }
  
  generateMarkdownReport() {
    const { timestamp, summary, browserResults } = this.results;
    
    let markdown = `# Modal Glitch Fix Verification Report\n\n`;
    markdown += `**Generated:** ${new Date(timestamp).toLocaleString()}\n\n`;
    
    // Executive Summary
    markdown += `## Executive Summary\n\n`;
    markdown += `This report validates the modal glitch fix that removed the duplicate modal wrapper from EnhancedStrategyCard.tsx. `;
    markdown += `The fix replaced the nested modal wrapper structure with simplified modal rendering to eliminate the "trapped in a box" effect.\n\n`;
    
    markdown += `### Test Results Overview\n\n`;
    markdown += `- **Total Tests:** ${summary.totalTests}\n`;
    markdown += `- **Passed:** ${summary.passedTests} ✅\n`;
    markdown += `- **Failed:** ${summary.failedTests} ❌\n`;
    markdown += `- **Success Rate:** ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%\n`;
    markdown += `- **Browsers Tested:** ${summary.browsers} (${TEST_CONFIG.browsers.join(', ')})\n`;
    markdown += `- **Viewports Tested:** ${summary.viewports} (${TEST_CONFIG.viewports.map(v => v.name).join(', ')})\n\n`;
    
    // Detailed Results by Browser
    markdown += `## Detailed Test Results\n\n`;
    
    for (const [browserName, browserData] of Object.entries(browserResults)) {
      markdown += `### ${browserName.toUpperCase()}\n\n`;
      
      for (const [viewportName, viewportData] of Object.entries(browserData)) {
        markdown += `#### ${viewportName} (${TEST_CONFIG.viewports.find(v => v.name === viewportName)?.width}x${TEST_CONFIG.viewports.find(v => v.name === viewportName)?.height})\n\n`;
        
        for (const [scenarioName, testResult] of Object.entries(viewportData)) {
          const status = testResult.passed ? '✅ PASSED' : '❌ FAILED';
          markdown += `**${scenarioName}** - ${status}\n\n`;
          
          if (!testResult.passed && testResult.error) {
            markdown += `- **Error:** ${testResult.error}\n`;
          }
          
          if (testResult.verificationResults) {
            for (const [checkName, checkResult] of Object.entries(testResult.verificationResults)) {
              markdown += `- **${checkName}:** ${checkResult.message}\n`;
            }
          }
          
          if (testResult.consoleLogs && testResult.consoleLogs.length > 0) {
            markdown += `- **Console Errors:** ${testResult.consoleLogs.length} errors detected\n`;
          }
          
          markdown += `\n`;
        }
      }
    }
    
    // Verification Checks Summary
    markdown += `## Verification Checks Summary\n\n`;
    markdown += `The following checks were performed for each test:\n\n`;
    
    for (const [checkName, checkFunction] of Object.entries(VERIFICATION_CHECKS)) {
      markdown += `### ${checkName}\n`;
      markdown += `- Validates: ${this.getCheckDescription(checkName)}\n`;
      markdown += `- Critical for: ${this.getCheckImportance(checkName)}\n\n`;
    }
    
    // Screenshots
    markdown += `## Screenshots\n\n`;
    markdown += `${this.results.screenshots.length} screenshots were captured during testing.\n\n`;
    
    // Conclusion
    const allTestsPassed = summary.failedTests === 0;
    markdown += `## Conclusion\n\n`;
    
    if (allTestsPassed) {
      markdown += `🎉 **All tests passed!** The modal glitch fix is working correctly across all tested scenarios.\n\n`;
      markdown += `The fix successfully:\n`;
      markdown += `- Eliminates the "trapped in a box" effect\n`;
      markdown += `- Ensures single backdrop rendering\n`;
      markdown += `- Maintains proper z-index layering\n`;
      markdown += `- Provides clean modal positioning\n`;
      markdown += `- Works across different browsers and screen sizes\n`;
    } else {
      markdown += `⚠️ **Some tests failed.** Please review the detailed results above.\n\n`;
      markdown += `Issues detected may indicate:\n`;
      markdown += `- Residual modal rendering problems\n`;
      markdown += `- Browser-specific compatibility issues\n`;
      markdown += `- Responsive design problems\n`;
    }
    
    return markdown;
  }
  
  getCheckDescription(checkName) {
    const descriptions = {
      singleBackdrop: 'Ensures only one modal backdrop is rendered',
      properZIndex: 'Verifies modal has proper z-index layering',
      noConsoleErrors: 'Checks for React hooks errors or console warnings',
      properPositioning: 'Validates clean modal positioning and sizing',
      noNestedModals: 'Detects nested modal structures that could cause glitches'
    };
    return descriptions[checkName] || 'Unknown check';
  }
  
  getCheckImportance(checkName) {
    const importance = {
      singleBackdrop: 'Preventing double backdrop visual glitches',
      properZIndex: 'Ensuring modal appears above all other content',
      noConsoleErrors: 'Maintaining application stability',
      properPositioning: 'Preventing modal positioning bugs',
      noNestedModals: 'Eliminating the "trapped in a box" effect'
    };
    return importance[checkName] || 'General quality assurance';
  }
}

// Main execution
async function main() {
  const verifier = new ModalGlitchFixVerifier();
  
  try {
    await verifier.runAllTests();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ModalGlitchFixVerifier, TEST_CONFIG, TEST_SCENARIOS, VERIFICATION_CHECKS };
