/**
 * RESPONSIVE BEHAVIOR VERIFICATION TEST
 * 
 * This script tests responsive behavior against comprehensive mockup specifications
 * to ensure all breakpoints and behaviors match the design intent.
 */

const { chromium } = require('playwright');

console.log('🔍 RESPONSIVE BEHAVIOR VERIFICATION: Starting comprehensive responsive testing...');

// Mockup Specifications from COMPREHENSIVE_MOCKUP_DESIGN_SPECIFICATIONS.md
const MOCKUP_BREAKPOINTS = {
  mobile: { max: 767 },      // Single column layouts
  tablet: { min: 768, max: 1023 }, // 2-3 column layouts  
  desktop: { min: 1024, max: 1919 }, // Full multi-column layouts
  largeDesktop: { min: 1920 }      // Fluid layouts
};

const MOCKUP_COLORS = {
  background: '#121212',           // --deep-charcoal
  cardBackground: '#202020',        // --soft-graphite
  primaryText: '#EAE6DD',           // --warm-off-white
  secondaryText: '#9A9A9A',         // --muted-gray
  primaryAccent: '#B89B5E',           // --dusty-gold
  secondaryAccent: '#D6C7B2',         // --warm-sand
  tertiaryAccent: '#4F5B4A',          // --muted-olive
  errorAccent: '#A7352D'            // --rust-red
};

class ResponsiveBehaviorTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async initialize() {
    console.log('🚀 Initializing browser for responsive testing...');
    this.browser = await chromium.launch({ 
      headless: false,
      viewport: { width: 1920, height: 1080 }
    });
    
    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('🔥 Browser Error:', msg.text());
      } else if (msg.type() === 'warning') {
        console.warn('⚠️ Browser Warning:', msg.text());
      }
    });

    // Enable network and resource monitoring
    await this.page.route('**/*', route => {
      console.log(`📡 Request: ${route.request().method()} ${route.request().url()}`);
    });
  }

  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Test viewport dimensions and breakpoints
  async testViewportBreakpoints() {
    console.log('📱 Testing viewport breakpoints...');
    
    const breakpoints = [
      { name: 'Mobile', width: 375, height: 667 },   // iPhone SE
      { name: 'Mobile Large', width: 414, height: 896 }, // iPhone 12
      { name: 'Tablet', width: 768, height: 1024 },  // iPad
      { name: 'Desktop Small', width: 1024, height: 768 },  // Small desktop
      { name: 'Desktop', width: 1280, height: 720 },   // Standard desktop
      { name: 'Desktop Large', width: 1440, height: 900 }, // Large desktop
      { name: 'Large Desktop', width: 1920, height: 1080 }, // Large desktop
    ];

    for (const breakpoint of breakpoints) {
      console.log(`📱 Testing ${breakpoint.name}: ${breakpoint.width}x${breakpoint.height}`);
      
      await this.page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await this.page.waitForTimeout(1000);
      
      // Check if layout adapts correctly
      const layoutInfo = await this.analyzeLayoutBehavior(breakpoint.name);
      
      this.testResults.push({
        test: `Viewport - ${breakpoint.name}`,
        breakpoint: breakpoint.name,
        expected: {
          columns: this.getExpectedColumns(breakpoint.width),
          sidebarBehavior: this.getExpectedSidebarBehavior(breakpoint.name)
        },
        actual: layoutInfo,
        passed: this.validateLayoutExpectations(breakpoint.name, layoutInfo),
        screenshot: await this.takeScreenshot(`viewport-${breakpoint.name.toLowerCase().replace(/\s+/g, '-')}`)
      });
      
      console.log(`✅ ${breakpoint.name} test completed`);
    }
  }

  getExpectedColumns(width) {
    if (width <= 767) return 1;      // Mobile: Single column
    if (width <= 1023) return 2;     // Tablet: 2-3 columns
    if (width <= 1919) return 4;     // Desktop: 4 columns
    return 6;                           // Large Desktop: Fluid layouts
  }

  getExpectedSidebarBehavior(breakpoint) {
    if (breakpoint.includes('Mobile')) {
      return { visible: false, behavior: 'overlay' }; // Mobile overlay
    }
    return { visible: true, behavior: 'fixed' }; // Desktop fixed sidebar
  }

  async analyzeLayoutBehavior(breakpointName) {
    const pageUrl = this.page.url();
    console.log(`🔍 Analyzing layout for: ${pageUrl} at ${breakpointName}`);
    
    // Test Dashboard page
    if (pageUrl.includes('/dashboard')) {
      return await this.analyzeDashboardLayout(breakpointName);
    }
    
    // Test Trades page
    if (pageUrl.includes('/trades')) {
      return await this.analyzeTradesLayout(breakpointName);
    }
    
    // Test Strategies page
    if (pageUrl.includes('/strategies')) {
      return await this.analyzeStrategiesLayout(breakpointName);
    }
    
    // Test Login/Register pages
    if (pageUrl.includes('/login') || pageUrl.includes('/register')) {
      return await this.analyzeAuthPagesLayout(breakpointName);
    }
    
    return { page: pageUrl, responsive: false };
  }

  async analyzeDashboardLayout(breakpointName) {
    console.log('📊 Analyzing Dashboard layout...');
    
    // Check if main container exists and is properly sized
    const mainContainer = await this.page.$('.main-content, .verotrade-main-content, .content-area');
    const containerExists = mainContainer !== null;
    
    // Check metric cards layout
    const metricCards = await this.page.$$('.dashboard-card, .metric-card, [class*="card"]');
    const cardCount = metricCards ? metricCards.length : 0;
    
    // Check performance sections
    const performanceGrid = await this.page.$('.performance-grid, .charts-grid, .key-metrics-grid');
    const performanceColumns = performanceGrid ? 
      await this.getGridColumns(performanceGrid) : 0;
    
    // Check charts section
    const chartsGrid = await this.page.$('.charts-grid');
    const chartsColumns = chartsGrid ? 
      await this.getGridColumns(chartsGrid) : 0;
    
    // Check bottom sections
    const bottomGrid = await this.page.$('.bottom-grid');
    const bottomColumns = bottomGrid ? 
      await this.getGridColumns(bottomGrid) : 0;
    
    // Check typography scaling
    const titleElement = await this.page.$('h1, .dashboard-title, [class*="title"]');
    const titleFontSize = titleElement ? 
      await this.getComputedFontSize(titleElement) : 0;
    
    const metricLabels = await this.page.$$('.metric-label, .card-title, [class*="label"]');
    const avgLabelFontSize = metricLabels.length > 0 ? 
      await this.getAverageComputedFontSize(metricLabels) : 0;
    
    const metricValues = await this.page.$$('.metric-value, .card-value, [class*="value"]');
    const avgValueFontSize = metricValues.length > 0 ? 
      await this.getAverageComputedFontSize(metricValues) : 0;
    
    return {
      containerExists,
      metricCards: cardCount,
      performanceColumns,
      chartsColumns,
      bottomColumns,
      titleFontSize,
      labelFontSize: avgLabelFontSize,
      valueFontSize: avgValueFontSize,
      responsive: true
    };
  }

  async analyzeTradesLayout(breakpointName) {
    console.log('💱 Analyzing Trades layout...');
    
    // Check trade cards layout
    const tradeCards = await this.page.$$('.trade-card, .card, [class*="trade"]');
    const cardCount = tradeCards ? tradeCards.length : 0;
    
    // Get grid columns
    const gridContainer = await this.page.$('.card-grid, .trades-grid, [class*="grid"]');
    const gridColumns = gridContainer ? 
      await this.getGridColumns(gridContainer) : 0;
    
    return {
      tradeCards: cardCount,
      gridColumns,
      responsive: true
    };
  }

  async analyzeStrategiesLayout(breakpointName) {
    console.log('🧠 Analyzing Strategies layout...');
    
    // Check strategy cards
    const strategyCards = await this.page.$$('.strategy-card, .card, [class*="strategy"]');
    const cardCount = strategyCards ? strategyCards.length : 0;
    
    // Get grid columns
    const gridContainer = await this.page.$('.card-grid, .strategies-grid, [class*="grid"]');
    const gridColumns = gridContainer ? 
      await this.getGridColumns(gridContainer) : 0;
    
    return {
      strategyCards: cardCount,
      gridColumns,
      responsive: true
    };
  }

  async analyzeAuthPagesLayout(breakpointName) {
    console.log('🔐 Analyzing Auth pages layout...');
    
    // Check for centered auth card
    const authCard = await this.page.$('.auth-card, .login-card, .register-card, [class*="auth"]');
    const authCardExists = authCard !== null;
    
    // Check if it's properly centered
    const authCardCentered = authCardExists ? 
      await this.isElementCentered(authCard) : false;
    
    return {
      authCardExists,
      authCardCentered,
      responsive: true
    };
  }

  async getGridColumns(gridElement) {
    const gridStyle = await gridElement.evaluate(el => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    
    if (gridStyle) {
      const columnCount = gridStyle.split(' ').length;
      return columnCount;
    }
    return 0;
  }

  async getComputedFontSize(element) {
    const fontSize = await element.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });
    return fontSize ? parseFloat(fontSize) : 0;
  }

  async getAverageComputedFontSize(elements) {
    const fontSizes = await Promise.all(
      elements.map(el => this.getComputedFontSize(el))
    );
    const validSizes = fontSizes.filter(size => size > 0);
    return validSizes.length > 0 ? 
      validSizes.reduce((sum, size) => sum + size, 0) / validSizes.length : 0;
  }

  async isElementCentered(element) {
    const rect = await element.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        position: style.position,
        left: style.left,
        transform: style.transform,
        marginLeft: style.marginLeft,
        marginRight: style.marginRight,
        width: style.width
      };
    });
    
    if (rect.position === 'fixed' || rect.position === 'absolute') {
      const leftValue = parseFloat(rect.left) || 0;
      const rightValue = parseFloat(rect.marginRight) || 0;
      const leftMargin = parseFloat(rect.marginLeft) || 0;
      const width = parseFloat(rect.width) || 0;
      
      const centerPosition = Math.abs(leftValue + leftMargin - (window.innerWidth - width) / 2);
      return centerPosition < 10; // Allow 10px tolerance
    }
    
    return false;
  }

  validateLayoutExpectations(breakpointName, layoutInfo) {
    const expectedColumns = this.getExpectedColumns(
      const vp = await this.page.viewportSize();
      vp.width
    );
    
    let passed = true;
    const issues = [];
    
    // Validate column counts
    if (layoutInfo.performanceColumns && layoutInfo.performanceColumns !== expectedColumns.performance) {
      passed = false;
      issues.push(`Expected ${expectedColumns.performance} performance columns, got ${layoutInfo.performanceColumns}`);
    }
    
    if (layoutInfo.chartsColumns && layoutInfo.chartsColumns !== expectedColumns.charts) {
      passed = false;
      issues.push(`Expected ${expectedColumns.charts} charts columns, got ${layoutInfo.chartsColumns}`);
    }
    
    if (layoutInfo.bottomColumns && layoutInfo.bottomColumns !== expectedColumns.bottom) {
      passed = false;
      issues.push(`Expected ${expectedColumns.bottom} bottom columns, got ${layoutInfo.bottomColumns}`);
    }
    
    // Validate responsive typography
    const expectedTitleSize = this.getExpectedFontSize(breakpointName, 'title');
    if (Math.abs(layoutInfo.titleFontSize - expectedTitleSize) > 2) {
      passed = false;
      issues.push(`Title font size ${layoutInfo.titleFontSize}px, expected ~${expectedTitleSize}px`);
    }
    
    return { passed, issues };
  }

  getExpectedFontSize(breakpointName, elementType) {
    // Base font sizes from mockup specifications
    const baseSizes = {
      title: { mobile: 24, tablet: 28, desktop: 32, largeDesktop: 32 },
      label: { mobile: 12, tablet: 13, desktop: 14, largeDesktop: 14 },
      value: { mobile: 20, tablet: 22, desktop: 24, largeDesktop: 24 }
    };
    
    if (breakpointName.includes('Mobile')) return baseSizes[elementType].mobile;
    if (breakpointName.includes('Tablet')) return baseSizes[elementType].tablet;
    if (breakpointName.includes('Desktop')) return baseSizes[elementType].desktop;
    return baseSizes[elementType].largeDesktop;
  }

  async takeScreenshot(filename) {
    const screenshot = await this.page.screenshot({ 
      fullPage: true,
      type: 'png'
    });
    
    // Save screenshot
    const fs = require('fs');
    const path = `./responsive-test-screenshots/${filename}.png`;
    require('fs').mkdirSync('./responsive-test-screenshots', { recursive: true });
    fs.writeFileSync(path, screenshot);
    console.log(`📸 Screenshot saved: ${path}`);
    
    return path;
  }

  async generateReport() {
    console.log('📋 Generating responsive behavior report...');
    
    const passedTests = this.testResults.filter(test => test.passed);
    const failedTests = this.testResults.filter(test => !test.passed);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: passedTests.length,
        failed: failedTests.length,
        passRate: Math.round((passedTests.length / this.testResults.length) * 100)
      },
      breakpoints: {
        mobile: this.testResults.filter(test => test.breakpoint.includes('Mobile')),
        tablet: this.testResults.filter(test => test.breakpoint.includes('Tablet')),
        desktop: this.testResults.filter(test => test.breakpoint.includes('Desktop')),
        largeDesktop: this.testResults.filter(test => test.breakpoint.includes('Large Desktop'))
      },
      pageAnalysis: {
        dashboard: this.testResults.filter(test => test.page && test.page.includes('/dashboard')),
        trades: this.testResults.filter(test => test.page && test.page.includes('/trades')),
        strategies: this.testResults.filter(test => test.page && test.page.includes('/strategies')),
        auth: this.testResults.filter(test => test.page && (test.page.includes('/login') || test.page.includes('/register')))
      },
      issues: failedTests.flatMap(test => test.issues || []),
      recommendations: this.generateRecommendations()
    };
    
    // Save report
    const fs = require('fs');
    fs.writeFileSync(
      './RESPONSIVE_BEHAVIOR_VERIFICATION_REPORT.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('✅ Responsive behavior verification completed!');
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    const failedTests = this.testResults.filter(test => !test.passed);
    
    if (failedTests.length > 0) {
      recommendations.push('Fix responsive layout issues to match mockup specifications');
      recommendations.push('Ensure proper column counts for each breakpoint');
      recommendations.push('Implement responsive typography scaling');
      recommendations.push('Test touch targets on mobile devices');
    }
    
    return recommendations;
  }

  async run() {
    try {
      await this.initialize();
      await this.testViewportBreakpoints();
      const report = await this.generateReport();
      await this.cleanup();
      return report;
    } catch (error) {
      console.error('❌ Responsive behavior test failed:', error);
      throw error;
    }
  }
}

// Run the test
async function main() {
  const tester = new ResponsiveBehaviorTester();
  
  try {
    const report = await tester.run();
    console.log('📊 Test Summary:', {
      total: report.summary.total,
      passed: report.summary.passed,
      failed: report.summary.failed,
      passRate: report.summary.passRate + '%'
    });
    
    console.log('📋 Detailed report saved to: RESPONSIVE_BEHAVIOR_VERIFICATION_REPORT.json');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ResponsiveBehaviorTester;