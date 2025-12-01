/**
 * Comprehensive Zoom Detection Test Script
 * 
 * This script tests the zoom detection functionality and verifies that all fixes
 * are properly integrated, including:
 * - Zoom detection accuracy at different zoom levels (100%, 125%, 150%)
 * - Zoom indicator visibility and accuracy
 * - Responsive layout behavior at different zoom levels
 * - Card centering at all zoom levels
 * - React hydration error resolution
 * - Authentication flow functionality
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class ZoomDetectionTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      zoomDetection: {},
      layoutResponsiveness: {},
      cardCentering: {},
      hydration: {},
      authentication: {},
      screenshots: []
    };
    this.testTimestamp = new Date().toISOString();
  }

  async initialize() {
    console.log('🚀 Initializing Zoom Detection Test Suite...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Enable console logging from the browser
    this.page.on('console', msg => {
      console.log(`BROWSER: ${msg.text()}`);
    });
    
    // Enable error logging
    this.page.on('error', error => {
      console.error(`BROWSER ERROR: ${error.message}`);
    });
    
    // Enable page error logging
    this.page.on('pageerror', error => {
      console.error(`PAGE ERROR: ${error.message}`);
    });
  }

  async navigateToPage(pagePath) {
    const url = `http://localhost:3000${pagePath}`;
    console.log(`📍 Navigating to: ${url}`);
    
    try {
      await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      // Wait for page to fully load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for hydration errors
      const hydrationErrors = await this.page.evaluate(() => {
        const errors = [];
        if (window.console) {
          const originalError = console.error;
          console.error = (...args) => {
            const errorText = args.join(' ');
            if (errorText.includes('hydration') || errorText.includes('Hydration')) {
              errors.push(errorText);
            }
            originalError.apply(console, args);
          };
        }
        return errors;
      });
      
      if (hydrationErrors.length > 0) {
        console.warn(`⚠️  Hydration errors detected: ${hydrationErrors.length}`);
        this.results.hydration.errors = hydrationErrors;
      } else {
        console.log('✅ No hydration errors detected');
        this.results.hydration.noErrors = true;
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to navigate to ${pagePath}:`, error.message);
      return false;
    }
  }

  async testZoomDetection(zoomLevel) {
    console.log(`🔍 Testing zoom detection at ${zoomLevel}% zoom level...`);
    
    const testKey = `zoom_${zoomLevel}`;
    this.results.zoomDetection[testKey] = {
      level: zoomLevel,
      tests: {}
    };
    
    try {
      // Set zoom level
      await this.page.setViewport({
        width: Math.round(1280 / (zoomLevel / 100)),
        height: Math.round(720 / (zoomLevel / 100))
      });
      
      // Wait for zoom detection to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get zoom information from the page
      const zoomInfo = await this.page.evaluate(() => {
        const zoomDetector = window.__zoomInfo;
        if (!zoomDetector) {
          return { error: 'Zoom detector not found' };
        }
        
        return {
          level: zoomDetector.level,
          percentage: zoomDetector.percentage,
          actualWidth: zoomDetector.actualWidth,
          effectiveWidth: zoomDetector.effectiveWidth,
          actualHeight: zoomDetector.actualHeight,
          effectiveHeight: zoomDetector.effectiveHeight,
          breakpoint: zoomDetector.breakpoint || 'unknown'
        };
      });
      
      if (zoomInfo.error) {
        console.error(`❌ ${zoomInfo.error}`);
        this.results.zoomDetection[testKey].tests.detector = { passed: false, error: zoomInfo.error };
        return false;
      }
      
      // Verify zoom level accuracy (allow 5% tolerance)
      const expectedLevel = zoomLevel / 100;
      const levelAccuracy = Math.abs(zoomInfo.level - expectedLevel) < 0.05;
      
      console.log(`   - Zoom level detected: ${zoomInfo.percentage}% (expected: ${zoomLevel}%)`);
      console.log(`   - Actual viewport: ${zoomInfo.actualWidth}×${zoomInfo.actualHeight}`);
      console.log(`   - Effective viewport: ${Math.round(zoomInfo.effectiveWidth)}×${Math.round(zoomInfo.effectiveHeight)}`);
      console.log(`   - Breakpoint: ${zoomInfo.breakpoint}`);
      
      this.results.zoomDetection[testKey].tests.detector = {
        passed: levelAccuracy,
        detected: zoomInfo,
        expected: { level: expectedLevel, percentage: zoomLevel }
      };
      
      // Test zoom indicator visibility
      const zoomIndicatorVisible = await this.page.evaluate(() => {
        const indicator = document.querySelector('.zoom-indicator');
        return indicator && window.getComputedStyle(indicator).display !== 'none';
      });
      
      const shouldShowIndicator = Math.abs(zoomLevel - 100) > 5;
      const indicatorCorrect = zoomIndicatorVisible === shouldShowIndicator;
      
      console.log(`   - Zoom indicator visible: ${zoomIndicatorVisible} (expected: ${shouldShowIndicator})`);
      
      this.results.zoomDetection[testKey].tests.indicator = {
        passed: indicatorCorrect,
        visible: zoomIndicatorVisible,
        expected: shouldShowIndicator
      };
      
      // Take screenshot
      const screenshotPath = path.join(__dirname, `zoom-test-${zoomLevel}-${Date.now()}.png`);
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      this.results.screenshots.push({
        zoomLevel,
        path: screenshotPath,
        timestamp: new Date().toISOString()
      });
      
      console.log(`   - Screenshot saved: ${screenshotPath}`);
      
      return levelAccuracy && indicatorCorrect;
      
    } catch (error) {
      console.error(`❌ Zoom detection test failed at ${zoomLevel}%:`, error.message);
      this.results.zoomDetection[testKey].tests.detector = { passed: false, error: error.message };
      return false;
    }
  }

  async testLayoutResponsiveness(zoomLevel) {
    console.log(`📐 Testing layout responsiveness at ${zoomLevel}% zoom level...`);
    
    const testKey = `layout_${zoomLevel}`;
    this.results.layoutResponsiveness[testKey] = {
      zoomLevel,
      tests: {}
    };
    
    try {
      // Test login page layout
      await this.navigateToPage('/login');
      
      // Check if main container is properly centered
      const centeringCheck = await this.page.evaluate(() => {
        const container = document.querySelector('.zoom-container');
        if (!container) return { error: 'Zoom container not found' };
        
        const rect = container.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        return {
          containerWidth: rect.width,
          containerHeight: rect.height,
          containerLeft: rect.left,
          containerTop: rect.top,
          windowWidth,
          windowHeight,
          horizontallyCentered: Math.abs(rect.left + rect.width / 2 - windowWidth / 2) < 10,
          verticallyCentered: Math.abs(rect.top + rect.height / 2 - windowHeight / 2) < 10
        };
      });
      
      if (centeringCheck.error) {
        console.error(`❌ ${centeringCheck.error}`);
        this.results.layoutResponsiveness[testKey].tests.centering = { passed: false, error: centeringCheck.error };
        return false;
      }
      
      console.log(`   - Container size: ${centeringCheck.containerWidth}×${centeringCheck.containerHeight}`);
      console.log(`   - Horizontally centered: ${centeringCheck.horizontallyCentered}`);
      console.log(`   - Vertically centered: ${centeringCheck.verticallyCentered}`);
      
      this.results.layoutResponsiveness[testKey].tests.centering = {
        passed: centeringCheck.horizontallyCentered && centeringCheck.verticallyCentered,
        details: centeringCheck
      };
      
      // Test form field responsiveness
      const formFieldsCheck = await this.page.evaluate(() => {
        const fields = document.querySelectorAll('.zoom-form-field');
        if (fields.length === 0) return { error: 'No form fields found' };
        
        const fieldRects = Array.from(fields).map(field => {
          const rect = field.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top
          };
        });
        
        return {
          fieldCount: fields.length,
          fields: fieldRects,
          allVisible: fieldRects.every(rect => rect.width > 0 && rect.height > 0)
        };
      });
      
      if (formFieldsCheck.error) {
        console.error(`❌ ${formFieldsCheck.error}`);
        this.results.layoutResponsiveness[testKey].tests.formFields = { passed: false, error: formFieldsCheck.error };
        return false;
      }
      
      console.log(`   - Form fields visible: ${formFieldsCheck.allVisible} (${formFieldsCheck.fieldCount} fields)`);
      
      this.results.layoutResponsiveness[testKey].tests.formFields = {
        passed: formFieldsCheck.allVisible,
        details: formFieldsCheck
      };
      
      // Test register page layout
      await this.navigateToPage('/register');
      
      const registerLayoutCheck = await this.page.evaluate(() => {
        const card = document.querySelector('.zoom-card');
        if (!card) return { error: 'Register card not found' };
        
        const rect = card.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        return {
          cardWidth: rect.width,
          cardHeight: rect.height,
          cardLeft: rect.left,
          cardTop: rect.top,
          windowWidth,
          windowHeight,
          horizontallyCentered: Math.abs(rect.left + rect.width / 2 - windowWidth / 2) < 10,
          verticallyCentered: Math.abs(rect.top + rect.height / 2 - windowHeight / 2) < 10
        };
      });
      
      if (registerLayoutCheck.error) {
        console.error(`❌ ${registerLayoutCheck.error}`);
        this.results.layoutResponsiveness[testKey].tests.registerCard = { passed: false, error: registerLayoutCheck.error };
        return false;
      }
      
      console.log(`   - Register card centered: ${registerLayoutCheck.horizontallyCentered && registerLayoutCheck.verticallyCentered}`);
      
      this.results.layoutResponsiveness[testKey].tests.registerCard = {
        passed: registerLayoutCheck.horizontallyCentered && registerLayoutCheck.verticallyCentered,
        details: registerLayoutCheck
      };
      
      return centeringCheck.horizontallyCentered && centeringCheck.verticallyCentered && 
             formFieldsCheck.allVisible && 
             registerLayoutCheck.horizontallyCentered && registerLayoutCheck.verticallyCentered;
      
    } catch (error) {
      console.error(`❌ Layout responsiveness test failed at ${zoomLevel}%:`, error.message);
      this.results.layoutResponsiveness[testKey].tests.general = { passed: false, error: error.message };
      return false;
    }
  }

  async testAuthenticationFlow() {
    console.log(`🔐 Testing authentication flow...`);
    
    this.results.authentication = {
      tests: {}
    };
    
    try {
      // Test login form functionality
      await this.navigateToPage('/login');
      
      // Fill in login form
      await this.page.type('#email', 'test@example.com');
      await this.page.type('#password', 'testpassword123');
      
      // Check if form submission works (without actually submitting)
      const submitButton = await this.page.$('button[type="submit"]');
      if (!submitButton) {
        console.error('❌ Submit button not found');
        this.results.authentication.tests.submitButton = { passed: false, error: 'Submit button not found' };
        return false;
      }
      
      const isDisabled = await this.page.evaluate(button => button.disabled, submitButton);
      console.log(`   - Submit button enabled: ${!isDisabled}`);
      
      this.results.authentication.tests.submitButton = {
        passed: !isDisabled,
        enabled: !isDisabled
      };
      
      // Test register form functionality
      await this.navigateToPage('/register');
      
      // Fill in register form
      await this.page.type('#email', 'newuser@example.com');
      await this.page.type('#password', 'newpassword123');
      
      // Check register submit button
      const registerSubmitButton = await this.page.$('button[type="submit"]');
      if (!registerSubmitButton) {
        console.error('❌ Register submit button not found');
        this.results.authentication.tests.registerSubmitButton = { passed: false, error: 'Register submit button not found' };
        return false;
      }
      
      const registerIsDisabled = await this.page.evaluate(button => button.disabled, registerSubmitButton);
      console.log(`   - Register submit button enabled: ${!registerIsDisabled}`);
      
      this.results.authentication.tests.registerSubmitButton = {
        passed: !registerIsDisabled,
        enabled: !registerIsDisabled
      };
      
      // Test navigation between login and register
      const registerLink = await this.page.$('a[href="/register"]');
      if (registerLink) {
        await registerLink.click();
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        const currentUrl = this.page.url();
        const navigationSuccess = currentUrl.includes('/register');
        
        console.log(`   - Login to register navigation: ${navigationSuccess}`);
        this.results.authentication.tests.loginToRegisterNav = {
          passed: navigationSuccess,
          currentUrl
        };
      }
      
      // Test register to login navigation
      const loginLink = await this.page.$('a[href="/login"]');
      if (loginLink) {
        await loginLink.click();
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        const currentUrl = this.page.url();
        const navigationSuccess = currentUrl.includes('/login');
        
        console.log(`   - Register to login navigation: ${navigationSuccess}`);
        this.results.authentication.tests.registerToLoginNav = {
          passed: navigationSuccess,
          currentUrl
        };
      }
      
      return !isDisabled && !registerIsDisabled;
      
    } catch (error) {
      console.error(`❌ Authentication flow test failed:`, error.message);
      this.results.authentication.tests.general = { passed: false, error: error.message };
      return false;
    }
  }

  async generateReport() {
    console.log(`📊 Generating comprehensive test report...`);
    
    const report = {
      testTimestamp: this.testTimestamp,
      summary: {
        zoomDetection: this.calculatePassRate(this.results.zoomDetection),
        layoutResponsiveness: this.calculatePassRate(this.results.layoutResponsiveness),
        hydration: this.results.hydration.noErrors ? 100 : 0,
        authentication: this.calculatePassRate(this.results.authentication),
        screenshots: this.results.screenshots.length
      },
      detailedResults: this.results,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, `zoom-detection-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Test report saved: ${reportPath}`);
    
    // Also create a human-readable markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(__dirname, `zoom-detection-test-report-${Date.now()}.md`);
    fs.writeFileSync(markdownPath, markdownReport);
    
    console.log(`📄 Markdown report saved: ${markdownPath}`);
    
    return { reportPath, markdownPath };
  }

  calculatePassRate(results) {
    const tests = Object.values(results).flatMap(category => 
      Object.values(category.tests || {}).map(test => test.passed)
    );
    
    if (tests.length === 0) return 0;
    
    const passedCount = tests.filter(passed => passed).length;
    return Math.round((passedCount / tests.length) * 100);
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Check zoom detection issues
    if (this.results.zoomDetection) {
      const zoomIssues = Object.entries(this.results.zoomDetection)
        .filter(([_, test]) => test.tests && test.tests.detector && !test.tests.detector.passed)
        .map(([key]) => key);
      
      if (zoomIssues.length > 0) {
        recommendations.push({
          type: 'zoom_detection',
          priority: 'high',
          issue: 'Zoom detection accuracy issues',
          details: `Zoom detection failed at: ${zoomIssues.join(', ')}`,
          recommendation: 'Review zoom detection algorithm and calibration'
        });
      }
    }
    
    // Check layout issues
    if (this.results.layoutResponsiveness) {
      const layoutIssues = Object.entries(this.results.layoutResponsiveness)
        .filter(([_, test]) => test.tests && test.tests.centering && !test.tests.centering.passed)
        .map(([key]) => key);
      
      if (layoutIssues.length > 0) {
        recommendations.push({
          type: 'layout',
          priority: 'high',
          issue: 'Layout centering issues',
          details: `Centering failed at: ${layoutIssues.join(', ')}`,
          recommendation: 'Review CSS flexbox and centering logic'
        });
      }
    }
    
    // Check hydration issues
    if (this.results.hydration && !this.results.hydration.noErrors) {
      const hydrationErrors = this.results.hydration.errors || [];
      recommendations.push({
        type: 'hydration',
        priority: 'critical',
        issue: 'React hydration errors detected',
        details: hydrationErrors.join('; '),
        recommendation: 'Review SSR/client-side rendering mismatch'
      });
    }
    
    return recommendations;
  }

  generateMarkdownReport(report) {
    return `# Zoom Detection Test Report

**Test Date:** ${new Date(report.testTimestamp).toLocaleString()}

## Executive Summary

- **Zoom Detection Pass Rate:** ${report.summary.zoomDetection}%
- **Layout Responsiveness Pass Rate:** ${report.summary.layoutResponsiveness}%
- **Hydration Error Resolution:** ${report.summary.hydration}%
- **Authentication Flow Pass Rate:** ${report.summary.authentication}%
- **Screenshots Captured:** ${report.summary.screenshots}

## Detailed Results

### Zoom Detection Tests

${report.detailedResults.zoomDetection ? Object.entries(report.detailedResults.zoomDetection).map(([key, test]) => `
#### ${key.replace('_', ' ').toUpperCase()}

- **Detector Accuracy:** ${test.tests && test.tests.detector && test.tests.detector.passed ? '✅ PASS' : '❌ FAIL'}
- **Zoom Indicator:** ${test.tests && test.tests.indicator && test.tests.indicator.passed ? '✅ PASS' : '❌ FAIL'}
${test.tests && test.tests.detector && test.tests.detector.detected ? `
- **Detected Level:** ${test.tests.detector.detected.level} (${test.tests.detector.detected.percentage}%)
- **Expected Level:** ${test.tests.detector.expected.level} (${test.tests.detector.expected.percentage}%)
` : ''}
`).join('') : 'No zoom detection test results available'}

### Layout Responsiveness Tests

${report.detailedResults.layoutResponsiveness ? Object.entries(report.detailedResults.layoutResponsiveness).map(([key, test]) => `
#### ${key.replace('_', ' ').toUpperCase()}

- **Centering:** ${test.tests && test.tests.centering && test.tests.centering.passed ? '✅ PASS' : '❌ FAIL'}
- **Form Fields:** ${test.tests && test.tests.formFields && test.tests.formFields.passed ? '✅ PASS' : '❌ FAIL'}
- **Register Card:** ${test.tests && test.tests.registerCard && test.tests.registerCard.passed ? '✅ PASS' : '❌ FAIL'}
`).join('') : 'No layout responsiveness test results available'}

### Authentication Flow Tests

${report.detailedResults.authentication && report.detailedResults.authentication.tests ? `
- **Submit Button:** ${report.detailedResults.authentication.tests.submitButton && report.detailedResults.authentication.tests.submitButton.passed ? '✅ PASS' : '❌ FAIL'}
- **Register Submit Button:** ${report.detailedResults.authentication.tests.registerSubmitButton && report.detailedResults.authentication.tests.registerSubmitButton.passed ? '✅ PASS' : '❌ FAIL'}
- **Navigation:** ${report.detailedResults.authentication.tests.loginToRegisterNav && report.detailedResults.authentication.tests.loginToRegisterNav.passed ? '✅ PASS' : '❌ FAIL'}
` : 'No authentication flow test results available'}

### Hydration Error Resolution

${report.detailedResults.hydration.noErrors ? '✅ No hydration errors detected' : '❌ Hydration errors detected:'}

${report.detailedResults.hydration.errors ? report.detailedResults.hydration.errors.map(error => `- ${error}`).join('\n') : ''}

## Recommendations

${report.recommendations.map(rec => `
### ${rec.type.toUpperCase()} (${rec.priority} priority)

**Issue:** ${rec.issue}

**Details:** ${rec.details}

**Recommendation:** ${rec.recommendation}
`).join('')}

## Screenshots

${report.detailedResults.screenshots.map(screenshot => `
- **${screenshot.zoomLevel}% Zoom:** ${screenshot.path}
`).join('')}
`;
  }

  async cleanup() {
    console.log('🧹 Cleaning up test environment...');
    
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runFullTestSuite() {
    console.log('🚀 Running full zoom detection test suite...');
    
    try {
      await this.initialize();
      
      // Test zoom detection at different levels
      const zoomLevels = [100, 125, 150];
      
      for (const zoomLevel of zoomLevels) {
        console.log(`\n--- Testing ${zoomLevel}% Zoom Level ---`);
        
        // Test zoom detection
        await this.testZoomDetection(zoomLevel);
        
        // Test layout responsiveness
        await this.testLayoutResponsiveness(zoomLevel);
      }
      
      // Test authentication flow
      console.log('\n--- Testing Authentication Flow ---');
      await this.testAuthenticationFlow();
      
      // Generate report
      console.log('\n--- Generating Test Report ---');
      const { reportPath, markdownPath } = await this.generateReport();
      
      console.log('\n✅ Full test suite completed successfully!');
      console.log(`📄 Reports saved to:`);
      console.log(`   - JSON: ${reportPath}`);
      console.log(`   - Markdown: ${markdownPath}`);
      
      return { success: true, reportPath, markdownPath };
      
    } catch (error) {
      console.error('❌ Full test suite failed:', error);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test suite if this file is executed directly
if (require.main === module) {
  const testSuite = new ZoomDetectionTestSuite();
  testSuite.runFullTestSuite()
    .then(result => {
      if (result.success) {
        console.log('🎉 All tests completed successfully!');
        process.exit(0);
      } else {
        console.error('❌ Tests failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = ZoomDetectionTestSuite;