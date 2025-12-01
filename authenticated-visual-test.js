const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AuthenticatedVisualTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      authentication: {},
      dashboardVisualEnhancements: {},
      pnlGraphVisibility: {},
      existingFunctionality: {},
      performance: {},
      crossBrowserCompatibility: {}
    };
  }

  async init() {
    console.log('🔐 Initializing Authenticated Visual Enhancement Testing...');
    this.browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Capture console logs
    this.page.on('console', (msg) => {
      console.log(`📝 Browser Console: ${msg.text()}`);
    });
    
    this.page.on('pageerror', (error) => {
      console.log(`❌ Page Error: ${error.message}`);
      this.testResults.errors = this.testResults.errors || [];
      this.testResults.errors.push(error.message);
    });
  }

  async login() {
    console.log('\n🔐 Logging in to access dashboard...');
    
    try {
      // Navigate to login page
      await this.page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
      
      // Fill in login credentials
      await this.page.type('input[type="email"]', 'test@example.com');
      await this.page.type('input[type="password"]', 'password123');
      
      // Click login button
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Check if we're on the dashboard
      const currentUrl = this.page.url();
      const isDashboard = currentUrl.includes('/dashboard');
      
      this.testResults.authentication = {
        success: isDashboard,
        currentUrl: currentUrl,
        redirectedToDashboard: isDashboard
      };
      
      console.log(`📍 Current URL after login: ${currentUrl}`);
      console.log(`✅ Login successful: ${isDashboard}`);
      
      return isDashboard;
    } catch (error) {
      console.error(`❌ Login failed: ${error.message}`);
      this.testResults.authentication = {
        success: false,
        error: error.message
      };
      return false;
    }
  }

  async testDashboardVisualEnhancements() {
    console.log('\n🎨 Testing Dashboard Visual Enhancements...');
    
    try {
      // Wait for dashboard to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test page visual style
      const pageStyle = await this.page.evaluate(() => {
        const body = document.body;
        const computedStyle = window.getComputedStyle(body);
        return {
          hasGradient: computedStyle.backgroundImage.includes('gradient'),
          backgroundColor: computedStyle.backgroundColor,
          hasDarkTheme: computedStyle.backgroundColor.includes('rgb(15, 23, 42)') || 
                         computedStyle.backgroundColor.includes('rgb(30, 41, 59)')
        };
      });
      
      this.testResults.dashboardVisualEnhancements.pageStyle = {
        passed: pageStyle.hasGradient && pageStyle.hasDarkTheme,
        details: pageStyle
      };
      console.log(`   Page Visual Style: ${pageStyle.hasGradient && pageStyle.hasDarkTheme ? 'PASSED' : 'FAILED'}`);
      
      // Test card elements presence
      const cardElements = await this.page.$$('.card, [class*="card"], [data-testid*="card"]');
      const cardStyles = await Promise.all(cardElements.map(async card => {
        const style = await card.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            hasGradient: computed.backgroundImage.includes('gradient'),
            hasShadow: computed.boxShadow !== 'none',
            hasBorder: computed.borderWidth !== '0px'
          };
        });
        return style;
      }));
      
      const cardsHaveEnhancements = cardStyles.some(style => 
        style.hasGradient || style.hasShadow || style.hasBorder
      );
      
      this.testResults.dashboardVisualEnhancements.cardElements = {
        passed: cardElements.length > 0 && cardsHaveEnhancements,
        count: cardElements.length,
        hasEnhancements: cardsHaveEnhancements
      };
      console.log(`   Card Elements Presence: ${cardElements.length > 0 && cardsHaveEnhancements ? 'PASSED' : 'FAILED'}`);
      
      // Test interactive elements styling
      const interactiveElements = await this.page.$$('button, .btn, [class*="interactive"]');
      const interactiveStyles = await Promise.all(interactiveElements.map(async element => {
        const style = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            hasHoverEffect: computed.transition !== 'none',
            hasShadow: computed.boxShadow !== 'none',
            hasBorderRadius: parseInt(computed.borderRadius) > 0
          };
        });
        return style;
      }));
      
      const hasInteractiveStyling = interactiveStyles.some(style => 
        style.hasHoverEffect || style.hasShadow || style.hasBorderRadius
      );
      
      this.testResults.dashboardVisualEnhancements.interactiveElements = {
        passed: interactiveElements.length > 0 && hasInteractiveStyling,
        count: interactiveElements.length,
        hasStyling: hasInteractiveStyling
      };
      console.log(`   Interactive Elements Styling: ${interactiveElements.length > 0 && hasInteractiveStyling ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      console.error(`❌ Dashboard visual enhancement test failed: ${error.message}`);
      this.testResults.dashboardVisualEnhancements.error = error.message;
    }
  }

  async testPnLGraphVisibility() {
    console.log('\n📊 Testing P&L Graph Visibility...');
    
    try {
      // Test chart elements presence
      const chartElements = await this.page.$$('svg, [class*="chart"], [data-testid*="chart"]');
      this.testResults.pnlGraphVisibility.chartElements = {
        passed: chartElements.length > 0,
        count: chartElements.length
      };
      console.log(`   Chart Elements Presence: ${chartElements.length > 0 ? 'PASSED' : 'FAILED'}`);
      
      // Test chart container styling
      const chartContainer = await this.page.$('[class*="chart-container"], [class*="pnl"]');
      let containerStyle = null;
      if (chartContainer) {
        containerStyle = await chartContainer.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            hasGradient: computed.backgroundImage.includes('gradient'),
            hasBorder: computed.borderWidth !== '0px',
            hasShadow: computed.boxShadow !== 'none',
            height: computed.height,
            width: computed.width
          };
        });
      }
      
      this.testResults.pnlGraphVisibility.containerStyling = {
        passed: chartContainer !== null && containerStyle && 
                (containerStyle.hasGradient || containerStyle.hasBorder || containerStyle.hasShadow),
        hasContainer: chartContainer !== null,
        style: containerStyle
      };
      console.log(`   Chart Container Styling: ${chartContainer !== null && containerStyle ? 'PASSED' : 'FAILED'}`);
      
      // Test chart axes and labels
      const axesElements = await this.page.$$('text, .x-axis, .y-axis, [class*="axis"]');
      this.testResults.pnlGraphVisibility.axesAndLabels = {
        passed: axesElements.length > 0,
        count: axesElements.length
      };
      console.log(`   Chart Axes and Labels: ${axesElements.length > 0 ? 'PASSED' : 'FAILED'}`);
      
      // Test chart responsive behavior
      const chartResponsive = await this.page.evaluate(() => {
        const chartContainer = document.querySelector('[class*="chart-container"], [class*="pnl"]');
        if (!chartContainer) return { hasDimensions: false };
        
        const rect = chartContainer.getBoundingClientRect();
        return {
          hasDimensions: rect.width > 0 && rect.height > 0,
          width: rect.width,
          height: rect.height
        };
      });
      
      this.testResults.pnlGraphVisibility.responsiveBehavior = {
        passed: chartResponsive.hasDimensions,
        dimensions: chartResponsive
      };
      console.log(`   Chart Responsive Behavior: ${chartResponsive.hasDimensions ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      console.error(`❌ P&L graph visibility test failed: ${error.message}`);
      this.testResults.pnlGraphVisibility.error = error.message;
    }
  }

  async testExistingFunctionality() {
    console.log('\n🔧 Testing Existing Functionality...');
    
    try {
      // Test navigation elements
      const navElements = await this.page.$$('nav, .nav, [class*="navigation"], .sidebar');
      this.testResults.existingFunctionality.navigation = {
        passed: navElements.length > 0,
        count: navElements.length
      };
      console.log(`   Navigation Elements: ${navElements.length > 0 ? 'PASSED' : 'FAILED'}`);
      
      // Test interactive elements
      const interactiveElements = await this.page.$$('button, .btn, a, [onclick], [class*="clickable"]');
      this.testResults.existingFunctionality.interactiveElements = {
        passed: interactiveElements.length > 0,
        count: interactiveElements.length
      };
      console.log(`   Interactive Elements: ${interactiveElements.length > 0 ? 'PASSED' : 'FAILED'}`);
      
      // Test form elements
      const formElements = await this.page.$$('input, select, textarea, form, [class*="form"]');
      this.testResults.existingFunctionality.formElements = {
        passed: formElements.length > 0,
        count: formElements.length
      };
      console.log(`   Form Elements: ${formElements.length > 0 ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      console.error(`❌ Existing functionality test failed: ${error.message}`);
      this.testResults.existingFunctionality.error = error.message;
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    try {
      // Test page load performance
      const metrics = await this.page.metrics();
      const hasPerformanceIssues = 
        metrics.LayoutCount > 100 || 
        metrics.RecalcStyleCount > 200 ||
        metrics.ScriptDuration > 500 ||
        metrics.TaskDuration > 1000;
      
      this.testResults.performance.pageLoad = {
        passed: !hasPerformanceIssues,
        metrics: metrics,
        hasIssues: hasPerformanceIssues
      };
      console.log(`   Page Load Performance: ${!hasPerformanceIssues ? 'PASSED' : 'FAILED'}`);
      
      // Test resource loading
      const resources = await this.page.evaluate(() => {
        return performance.getEntriesByType('resource').length;
      });
      
      this.testResults.performance.resourceLoading = {
        passed: resources > 0 && resources < 100,
        resourceCount: resources
      };
      console.log(`   Resource Loading: ${resources > 0 && resources < 100 ? 'PASSED' : 'FAILED'}`);
      
      // Test animation performance
      const animatedElements = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let animatedCount = 0;
        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          if (styles.animation !== 'none' || styles.transition !== 'none') {
            animatedCount++;
          }
        });
        return animatedCount;
      });
      
      const hasTooManyAnimations = animatedElements > 50;
      this.testResults.performance.animationPerformance = {
        passed: !hasTooManyAnimations,
        animatedCount: animatedElements,
        hasTooManyAnimations
      };
      console.log(`   Animation Performance: ${!hasTooManyAnimations ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      console.error(`❌ Performance test failed: ${error.message}`);
      this.testResults.performance.error = error.message;
    }
  }

  async testCrossBrowserCompatibility() {
    console.log('\n🌍 Testing Cross-Browser/Device Compatibility...');
    
    try {
      // Test mobile viewport
      await this.page.setViewport({ width: 375, height: 667 });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mobileLayout = await this.page.evaluate(() => {
        const body = document.body;
        const rect = body.getBoundingClientRect();
        return {
          isResponsive: rect.width <= 375,
          hasOverflow: body.scrollWidth > body.clientWidth
        };
      });
      
      this.testResults.crossBrowserCompatibility.mobile = {
        passed: mobileLayout.isResponsive && !mobileLayout.hasOverflow,
        layout: mobileLayout
      };
      console.log(`   Mobile Viewport: ${mobileLayout.isResponsive && !mobileLayout.hasOverflow ? 'PASSED' : 'FAILED'}`);
      
      // Test tablet viewport
      await this.page.setViewport({ width: 768, height: 1024 });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const tabletLayout = await this.page.evaluate(() => {
        const body = document.body;
        const rect = body.getBoundingClientRect();
        return {
          isResponsive: rect.width <= 768,
          hasOverflow: body.scrollWidth > body.clientWidth
        };
      });
      
      this.testResults.crossBrowserCompatibility.tablet = {
        passed: tabletLayout.isResponsive && !tabletLayout.hasOverflow,
        layout: tabletLayout
      };
      console.log(`   Tablet Viewport: ${tabletLayout.isResponsive && !tabletLayout.hasOverflow ? 'PASSED' : 'FAILED'}`);
      
      // Test touch-friendly elements
      const touchElements = await this.page.$$('button, .btn, a, [onclick]');
      const touchFriendlyElements = await Promise.all(touchElements.map(async element => {
        const size = await element.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            isTouchFriendly: rect.width >= 44 && rect.height >= 44
          };
        });
        return size;
      }));
      
      const touchFriendlyPercentage = touchFriendlyElements.filter(el => el.isTouchFriendly).length / touchFriendlyElements.length * 100;
      
      this.testResults.crossBrowserCompatibility.touchFriendly = {
        passed: touchFriendlyPercentage >= 80,
        percentage: touchFriendlyPercentage,
        totalElements: touchElements.length,
        friendlyElements: touchFriendlyElements.filter(el => el.isTouchFriendly).length
      };
      console.log(`   Touch-Friendly Elements: ${touchFriendlyPercentage >= 80 ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      console.error(`❌ Cross-browser compatibility test failed: ${error.message}`);
      this.testResults.crossBrowserCompatibility.error = error.message;
    }
  }

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${name}-${timestamp}.png`;
    const filepath = path.join(__dirname, filename);
    
    await this.page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 Screenshot saved: ${filename}`);
    
    return filepath;
  }

  async saveTestReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `authenticated-visual-test-report-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    // Calculate summary
    const summary = this.calculateSummary();
    this.testResults.summary = summary;
    
    fs.writeFileSync(filepath, JSON.stringify(this.testResults, null, 2));
    console.log(`\n📄 Test report saved: ${filename}`);
    
    return filepath;
  }

  calculateSummary() {
    const categories = [
      'dashboardVisualEnhancements',
      'pnlGraphVisibility',
      'existingFunctionality',
      'performance',
      'crossBrowserCompatibility'
    ];
    
    let passed = 0;
    let failed = 0;
    let total = 0;
    
    categories.forEach(category => {
      const tests = this.testResults[category];
      if (tests && typeof tests === 'object') {
        Object.keys(tests).forEach(key => {
          if (key !== 'error' && key !== 'details' && key !== 'style' && key !== 'layout' && key !== 'dimensions' && key !== 'metrics') {
            total++;
            if (tests[key] && typeof tests[key] === 'object' && tests[key].passed !== undefined) {
              if (tests[key].passed) passed++;
              else failed++;
            } else if (tests[key] === true || tests[key].passed === true) {
              passed++;
            } else {
              failed++;
            }
          }
        });
      }
    });
    
    return { passed, failed, total };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      
      // Take initial screenshot
      await this.takeScreenshot('initial-page-state');
      
      // Login first
      const isLoggedIn = await this.login();
      if (!isLoggedIn) {
        console.log('❌ Could not login, skipping dashboard tests');
        const reportPath = await this.saveTestReport();
        return reportPath;
      }
      
      // Take dashboard screenshot
      await this.takeScreenshot('dashboard-loaded');
      
      // Run all tests
      await this.testDashboardVisualEnhancements();
      await this.testPnLGraphVisibility();
      await this.testExistingFunctionality();
      await this.testPerformance();
      await this.testCrossBrowserCompatibility();
      
      // Save test report
      const reportPath = await this.saveTestReport();
      
      // Print summary
      const summary = this.testResults.summary;
      console.log('\n📋 Test Summary:');
      console.log(`   Dashboard Visual Enhancements: ${Object.keys(this.testResults.dashboardVisualEnhancements).filter(key => this.testResults.dashboardVisualEnhancements[key] && this.testResults.dashboardVisualEnhancements[key].passed).length}/${Object.keys(this.testResults.dashboardVisualEnhancements).filter(key => key !== 'error' && key !== 'details').length} passed`);
      console.log(`   P&L Graph Visibility: ${Object.keys(this.testResults.pnlGraphVisibility).filter(key => this.testResults.pnlGraphVisibility[key] && this.testResults.pnlGraphVisibility[key].passed).length}/${Object.keys(this.testResults.pnlGraphVisibility).filter(key => key !== 'error').length} passed`);
      console.log(`   Existing Functionality: ${Object.keys(this.testResults.existingFunctionality).filter(key => this.testResults.existingFunctionality[key] && this.testResults.existingFunctionality[key].passed).length}/${Object.keys(this.testResults.existingFunctionality).filter(key => key !== 'error').length} passed`);
      console.log(`   Performance: ${Object.keys(this.testResults.performance).filter(key => this.testResults.performance[key] && this.testResults.performance[key].passed).length}/${Object.keys(this.testResults.performance).filter(key => key !== 'error' && key !== 'metrics').length} passed`);
      console.log(`   Cross-Browser Compatibility: ${Object.keys(this.testResults.crossBrowserCompatibility).filter(key => this.testResults.crossBrowserCompatibility[key] && this.testResults.crossBrowserCompatibility[key].passed).length}/${Object.keys(this.testResults.crossBrowserCompatibility).filter(key => key !== 'error' && key !== 'layout').length} passed`);
      console.log(`\n📊 Results: ${summary.passed}/${summary.total} tests passed`);
      
      return reportPath;
    } catch (error) {
      console.error(`❌ Test execution failed: ${error.message}`);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Main execution
async function main() {
  console.log('🔐 Authenticated Visual Enhancement Testing');
  console.log('==========================================');
  console.log('This tool will test visual enhancements with authentication');
  console.log('to ensure proper access to dashboard and P&L chart features.');
  console.log('');
  console.log('Note: This test requires valid user credentials.');
  console.log('');
  
  const tester = new AuthenticatedVisualTester();
  
  try {
    const reportPath = await tester.run();
    console.log(`\n✅ Testing completed successfully!`);
    console.log(`📊 Report available at: ${reportPath}`);
  } catch (error) {
    console.error(`\n❌ Testing failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = AuthenticatedVisualTester;