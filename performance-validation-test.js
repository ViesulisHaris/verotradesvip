const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Performance validation test for sidebar and chart optimizations
class PerformanceValidationTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      testInfo: {
        timestamp: new Date().toISOString(),
        testName: 'Performance Optimization Validation',
        version: '1.0.0'
      },
      sidebarMetrics: {
        transitionDurations: [],
        domReflows: [],
        javascriptExecution: [],
        beforeOptimization: {
          domReflows: 2512,
          javascriptExecution: 1040,
          transitionDuration: 502
        },
        afterOptimization: {
          domReflows: 0,
          javascriptExecution: 0,
          transitionDuration: 0
        }
      },
      chartMetrics: {
        resizeEvents: [],
        animationFrames: [],
        renderTimes: [],
        transitionAwareBehavior: []
      },
      functionalValidation: {
        sidebarToggle: false,
        chartRendering: false,
        interactiveElements: false,
        visualGlitches: false
      },
      summary: {
        overallSuccess: false,
        improvements: {},
        remainingIssues: []
      }
    };
  }

  async initialize() {
    console.log('🚀 Initializing Performance Validation Test...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--enable-precise-memory-info',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Enable performance monitoring
    await this.page.coverage.startJSCoverage();
    await this.page.coverage.startCSSCoverage();
    
    // Enable performance observer
    await this.page.evaluateOnNewDocument(() => {
      window.performanceMetrics = {
        domReflows: 0,
        resizeEvents: 0,
        animationFrames: 0,
        transitionStartTimes: [],
        transitionEndTimes: []
      };

      // Monitor DOM reflows
      let reflowCount = 0;
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'layout-shift' || entry.entryType === 'measure') {
            reflowCount++;
            window.performanceMetrics.domReflows++;
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['layout-shift', 'measure'] });
      } catch (e) {
        console.log('Performance observer not fully supported');
      }

      // Monitor resize events
      let resizeCount = 0;
      const originalResize = window.onresize;
      window.onresize = function(...args) {
        resizeCount++;
        window.performanceMetrics.resizeEvents++;
        if (originalResize) {
          return originalResize.apply(this, args);
        }
      };

      // Monitor animation frames
      let frameCount = 0;
      const originalRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = function(callback) {
        frameCount++;
        window.performanceMetrics.animationFrames++;
        return originalRAF.call(this, callback);
      };

      // Monitor sidebar transitions
      window.addEventListener('sidebarTransitionStart', (event) => {
        window.performanceMetrics.transitionStartTimes.push(performance.now());
      });

      window.addEventListener('sidebarTransitionEnd', (event) => {
        window.performanceMetrics.transitionEndTimes.push(performance.now());
      });
    });
  }

  async navigateToDashboard() {
    console.log('📊 Navigating to dashboard...');
    
    try {
      await this.page.goto('http://localhost:3000/dashboard', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Wait for the page to fully load
      await this.page.waitForFunction(() => document.readyState === 'complete');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if we need to login
      const loginRequired = await this.page.$('input[type="email"]');
      if (loginRequired) {
        console.log('🔐 Login required, performing authentication...');
        await this.performLogin();
      }
      
      console.log('✅ Dashboard loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to navigate to dashboard:', error);
      return false;
    }
  }

  async performLogin() {
    try {
      // Wait for login form
      await this.page.waitForSelector('input[type="email"]', { timeout: 5000 });
      
      // Fill login credentials
      await this.page.type('input[type="email"]', 'test@example.com');
      await this.page.type('input[type="password"]', 'testpassword123');
      
      // Submit login
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation to complete
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Login completed');
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  async measureSidebarPerformance() {
    console.log('📏 Measuring sidebar performance...');
    
    // Find sidebar toggle button
    const toggleButton = await this.page.$('.sidebar-toggle-button');
    if (!toggleButton) {
      console.error('❌ Sidebar toggle button not found');
      return false;
    }

    // Perform multiple toggle cycles to get consistent measurements
    const cycles = 5;
    const measurements = [];

    for (let i = 0; i < cycles; i++) {
      console.log(`🔄 Cycle ${i + 1}/${cycles}`);
      
      // Clear previous metrics
      await this.page.evaluate(() => {
        window.performanceMetrics.domReflows = 0;
        window.performanceMetrics.transitionStartTimes = [];
        window.performanceMetrics.transitionEndTimes = [];
      });

      // Measure performance before toggle
      const perfStart = await this.page.evaluate(() => performance.now());
      
      // Toggle sidebar
      await this.page.click('.sidebar-toggle-button');
      
      // Wait for transition to complete (300ms as per optimization)
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Measure performance after toggle
      const perfEnd = await this.page.evaluate(() => performance.now());
      
      // Collect metrics
      const metrics = await this.page.evaluate((start, end) => {
        const transitionDurations = [];
        for (let i = 0; i < Math.min(
          window.performanceMetrics.transitionStartTimes.length,
          window.performanceMetrics.transitionEndTimes.length
        ); i++) {
          transitionDurations.push(
            window.performanceMetrics.transitionEndTimes[i] -
            window.performanceMetrics.transitionStartTimes[i]
          );
        }
        
        return {
          domReflows: window.performanceMetrics.domReflows,
          javascriptExecution: end - start,
          transitionDurations: transitionDurations,
          averageTransitionDuration: transitionDurations.length > 0
            ? transitionDurations.reduce((a, b) => a + b, 0) / transitionDurations.length
            : 0
        };
      }, perfStart, perfEnd);

      measurements.push(metrics);
      
      // Wait between cycles
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Calculate averages
    const avgMetrics = {
      domReflows: measurements.reduce((sum, m) => sum + m.domReflows, 0) / measurements.length,
      javascriptExecution: measurements.reduce((sum, m) => sum + m.javascriptExecution, 0) / measurements.length,
      transitionDuration: measurements.reduce((sum, m) => sum + m.averageTransitionDuration, 0) / measurements.length
    };

    this.results.sidebarMetrics.afterOptimization = avgMetrics;
    this.results.sidebarMetrics.transitionDurations = measurements.map(m => m.averageTransitionDuration);
    this.results.sidebarMetrics.domReflows = measurements.map(m => m.domReflows);
    this.results.sidebarMetrics.javascriptExecution = measurements.map(m => m.javascriptExecution);

    console.log('📊 Sidebar Performance Results:');
    console.log(`   DOM Reflows: ${avgMetrics.domReflows.toFixed(0)} (target: <200)`);
    console.log(`   JavaScript Execution: ${avgMetrics.javascriptExecution.toFixed(2)}ms (target: <1000ms)`);
    console.log(`   Transition Duration: ${avgMetrics.transitionDuration.toFixed(2)}ms (target: ~300ms)`);

    return true;
  }

  async measureChartResizeBehavior() {
    console.log('📈 Measuring chart resize behavior...');
    
    // Navigate to analytics page where charts are displayed
    try {
      await this.page.goto('http://localhost:3000/analytics', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      await this.page.waitForFunction(() => document.readyState === 'complete');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log('⚠️ Analytics page not available, using dashboard...');
      // Stay on dashboard if analytics page doesn't exist
    }

    // Clear previous metrics
    await this.page.evaluate(() => {
      window.performanceMetrics.resizeEvents = 0;
      window.performanceMetrics.animationFrames = 0;
    });

    // Find charts
    const charts = await this.page.$$('.chart-container-enhanced, .recharts-wrapper');
    if (charts.length === 0) {
      console.log('⚠️ No charts found on the page');
      return false;
    }

    console.log(`📊 Found ${charts.length} chart(s)`);

    // Measure chart behavior during sidebar transitions
    const resizeMeasurements = [];
    
    for (let i = 0; i < 3; i++) {
      // Reset counters
      await this.page.evaluate(() => {
        window.performanceMetrics.resizeEvents = 0;
        window.performanceMetrics.animationFrames = 0;
      });

      // Toggle sidebar to trigger resize
      await this.page.click('.sidebar-toggle-button');
      await new Promise(resolve => setTimeout(resolve, 400));

      // Collect metrics
      const metrics = await this.page.evaluate(() => ({
        resizeEvents: window.performanceMetrics.resizeEvents,
        animationFrames: window.performanceMetrics.animationFrames
      }));

      resizeMeasurements.push(metrics);
      
      // Toggle back
      await this.page.click('.sidebar-toggle-button');
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    this.results.chartMetrics.resizeEvents = resizeMeasurements.map(m => m.resizeEvents);
    this.results.chartMetrics.animationFrames = resizeMeasurements.map(m => m.animationFrames);

    const avgResizeEvents = resizeMeasurements.reduce((sum, m) => sum + m.resizeEvents, 0) / resizeMeasurements.length;
    const avgAnimationFrames = resizeMeasurements.reduce((sum, m) => sum + m.animationFrames, 0) / resizeMeasurements.length;

    console.log('📊 Chart Resize Results:');
    console.log(`   Average Resize Events: ${avgResizeEvents.toFixed(0)} (should be minimized)`);
    console.log(`   Average Animation Frames: ${avgAnimationFrames.toFixed(0)} (should be optimized)`);

    return true;
  }

  async validateFunctionalBehavior() {
    console.log('🔍 Validating functional behavior...');
    
    // Test sidebar toggle functionality
    try {
      const initialSidebarState = await this.page.evaluate(() => {
        const sidebar = document.querySelector('.sidebar-overlay');
        return sidebar ? sidebar.classList.contains('translate-x-0') : false;
      });

      await this.page.click('.sidebar-toggle-button');
      await new Promise(resolve => setTimeout(resolve, 400));

      const afterToggleState = await this.page.evaluate(() => {
        const sidebar = document.querySelector('.sidebar-overlay');
        return sidebar ? sidebar.classList.contains('translate-x-0') : false;
      });

      this.results.functionalValidation.sidebarToggle = initialSidebarState !== afterToggleState;
      console.log(`✅ Sidebar toggle functionality: ${this.results.functionalValidation.sidebarToggle ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.error('❌ Sidebar toggle validation failed:', error);
      this.results.functionalValidation.sidebarToggle = false;
    }

    // Test chart rendering
    try {
      const chartsRendered = await this.page.evaluate(() => {
        const charts = document.querySelectorAll('.recharts-wrapper, .chart-container-enhanced');
        return charts.length > 0 && Array.from(charts).every(chart => {
          const rect = chart.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
      });

      this.results.functionalValidation.chartRendering = chartsRendered;
      console.log(`✅ Chart rendering: ${chartsRendered ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.error('❌ Chart rendering validation failed:', error);
      this.results.functionalValidation.chartRendering = false;
    }

    // Test interactive elements
    try {
      const interactiveElementsWorking = await this.page.evaluate(() => {
        const buttons = document.querySelectorAll('button, [role="button"]');
        return Array.from(buttons).some(button => {
          const rect = button.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
      });

      this.results.functionalValidation.interactiveElements = interactiveElementsWorking;
      console.log(`✅ Interactive elements: ${interactiveElementsWorking ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.error('❌ Interactive elements validation failed:', error);
      this.results.functionalValidation.interactiveElements = false;
    }

    // Test for visual glitches during transitions
    try {
      let visualGlitchesDetected = false;
      
      for (let i = 0; i < 3; i++) {
        await this.page.click('.sidebar-toggle-button');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check for visual issues
        const hasGlitches = await this.page.evaluate(() => {
          const charts = document.querySelectorAll('.recharts-wrapper');
          return Array.from(charts).some(chart => {
            const rect = chart.getBoundingClientRect();
            const style = window.getComputedStyle(chart);
            return (
              rect.width === 0 || 
              rect.height === 0 || 
              style.opacity === '0' ||
              style.visibility === 'hidden'
            );
          });
        });
        
        if (hasGlitches) {
          visualGlitchesDetected = true;
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        await this.page.click('.sidebar-toggle-button');
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      this.results.functionalValidation.visualGlitches = !visualGlitchesDetected;
      console.log(`✅ No visual glitches: ${!visualGlitchesDetected ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.error('❌ Visual glitch validation failed:', error);
      this.results.functionalValidation.visualGlitches = false;
    }

    return true;
  }

  async generateReport() {
    console.log('📋 Generating performance validation report...');
    
    const before = this.results.sidebarMetrics.beforeOptimization;
    const after = this.results.sidebarMetrics.afterOptimization;
    
    // Calculate improvements
    const improvements = {
      domReflowsReduction: ((before.domReflows - after.domReflows) / before.domReflows * 100).toFixed(1),
      javascriptImprovement: ((before.javascriptExecution - after.javascriptExecution) / before.javascriptExecution * 100).toFixed(1),
      transitionImprovement: ((before.transitionDuration - after.transitionDuration) / before.transitionDuration * 100).toFixed(1)
    };

    this.results.summary.improvements = improvements;
    
    // Determine overall success
    const targetsMet = 
      after.domReflows < 200 &&
      after.javascriptExecution < 1000 &&
      after.transitionDuration <= 350; // Allow 50ms tolerance
    
    const functionalTestsPassed = Object.values(this.results.functionalValidation).every(val => val === true);
    
    this.results.summary.overallSuccess = targetsMet && functionalTestsPassed;
    
    // Generate report
    const report = {
      ...this.results,
      performanceTargets: {
        domReflowsTarget: '<200',
        javascriptExecutionTarget: '<1000ms',
        transitionDurationTarget: '~300ms'
      },
      actualResults: {
        domReflows: after.domReflows.toFixed(0),
        javascriptExecution: after.javascriptExecution.toFixed(2) + 'ms',
        transitionDuration: after.transitionDuration.toFixed(2) + 'ms'
      },
      targetsMet: {
        domReflows: after.domReflows < 200,
        javascriptExecution: after.javascriptExecution < 1000,
        transitionDuration: after.transitionDuration <= 350
      }
    };

    // Save report to file
    const reportPath = path.join(__dirname, `performance-validation-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 PERFORMANCE VALIDATION REPORT');
    console.log('=====================================');
    console.log(`\n🎯 Performance Improvements:`);
    console.log(`   DOM Reflows: ${before.domReflows} → ${after.domReflows.toFixed(0)} (${improvements.domReflowsReduction}% reduction)`);
    console.log(`   JavaScript Execution: ${before.javascriptExecution}ms → ${after.javascriptExecution.toFixed(2)}ms (${improvements.javascriptImprovement}% improvement)`);
    console.log(`   Transition Duration: ${before.transitionDuration}ms → ${after.transitionDuration.toFixed(2)}ms (${improvements.transitionImprovement}% improvement)`);
    
    console.log(`\n✅ Functional Validation:`);
    console.log(`   Sidebar Toggle: ${this.results.functionalValidation.sidebarToggle ? 'PASS' : 'FAIL'}`);
    console.log(`   Chart Rendering: ${this.results.functionalValidation.chartRendering ? 'PASS' : 'FAIL'}`);
    console.log(`   Interactive Elements: ${this.results.functionalValidation.interactiveElements ? 'PASS' : 'FAIL'}`);
    console.log(`   No Visual Glitches: ${this.results.functionalValidation.visualGlitches ? 'PASS' : 'FAIL'}`);
    
    console.log(`\n🎯 Target Achievement:`);
    console.log(`   DOM Reflows <200: ${after.domReflows < 200 ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
    console.log(`   JavaScript <1000ms: ${after.javascriptExecution < 1000 ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
    console.log(`   Transition ~300ms: ${after.transitionDuration <= 350 ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
    
    console.log(`\n🏆 Overall Success: ${this.results.summary.overallSuccess ? '✅ SUCCESS' : '❌ NEEDS IMPROVEMENT'}`);
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    return report;
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    if (this.page) {
      await this.page.coverage.stopJSCoverage();
      await this.page.coverage.stopCSSCoverage();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      
      const dashboardLoaded = await this.navigateToDashboard();
      if (!dashboardLoaded) {
        throw new Error('Failed to load dashboard');
      }
      
      await this.measureSidebarPerformance();
      await this.measureChartResizeBehavior();
      await this.validateFunctionalBehavior();
      
      const report = await this.generateReport();
      
      return report;
    } catch (error) {
      console.error('❌ Performance validation test failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test
async function runPerformanceValidation() {
  const test = new PerformanceValidationTest();
  
  try {
    console.log('🚀 Starting Performance Validation Test...');
    console.log('==========================================\n');
    
    const report = await test.run();
    
    console.log('\n✅ Performance validation test completed successfully!');
    
    // Exit with appropriate code
    process.exit(report.summary.overallSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Performance validation test failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runPerformanceValidation();
}

module.exports = PerformanceValidationTest;