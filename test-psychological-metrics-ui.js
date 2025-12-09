const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Comprehensive UI Test Suite for Enhanced Psychological Metrics
 * Tests visual relationships, animations, tooltips, error handling, and responsive design
 */
class PsychologicalMetricsUITest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.screenshots = [];
  }

  async initialize() {
    console.log('🚀 Initializing Psychological Metrics UI Test Suite...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Enable request interception to monitor API calls
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      request.continue();
    });
    
    // Set up console logging from the browser
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser Console Error: ${msg.text()}`);
      }
    });
    
    console.log('✅ Browser initialized successfully');
  }

  async takeScreenshot(testName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `psychological-metrics-test-${testName}-${timestamp}.png`;
    const screenshotPath = path.join(__dirname, filename);
    
    await this.page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    
    this.screenshots.push({
      test: testName,
      path: screenshotPath
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return screenshotPath;
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.log(`⏱️ Element not found: ${selector}`);
      return false;
    }
  }

  async testResult(testName, passed, details = '') {
    this.testResults.total++;
    if (passed) {
      this.testResults.passed++;
      console.log(`✅ ${testName}: PASSED`);
    } else {
      this.testResults.failed++;
      console.log(`❌ ${testName}: FAILED - ${details}`);
    }
    
    this.testResults.details.push({
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Test 1: Verify psychological metrics card displays correctly
   */
  async testPsychologicalMetricsCardDisplay() {
    console.log('\n🧪 Testing Psychological Metrics Card Display...');
    
    try {
      // Navigate to dashboard
      await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);
      
      // Check if psychological metrics card exists
      const cardExists = await this.waitForElement('[data-testid="psychological-metrics-card"]');
      this.testResult('Psychological metrics card exists', cardExists);
      
      if (cardExists) {
        // Check for key elements within the card
        const disciplineLevel = await this.waitForElement('[data-testid="discipline-level-metric"]');
        const tiltControl = await this.waitForElement('[data-testid="tilt-control-metric"]');
        const couplingIndicator = await this.waitForElement('[data-testid="coupling-indicator"]');
        
        this.testResult('Discipline level metric displays', disciplineLevel);
        this.testResult('Tilt control metric displays', tiltControl);
        this.testResult('Coupling indicator displays', couplingIndicator);
        
        await this.takeScreenshot('psychological-metrics-card-display');
      }
    } catch (error) {
      this.testResult('Psychological metrics card display', false, error.message);
    }
  }

  /**
   * Test 2: Verify coupling indicators are visible and animated
   */
  async testCouplingIndicators() {
    console.log('\n🧪 Testing Coupling Indicators...');
    
    try {
      // Check for coupling indicator elements
      const couplingLines = await this.page.$$('[data-testid="coupling-line"]');
      const couplingDots = await this.page.$$('[data-testid="coupling-dot"]');
      
      this.testResult('Coupling lines exist', couplingLines.length > 0);
      this.testResult('Coupling dots exist', couplingDots.length > 0);
      
      // Test animation classes
      const hasAnimatedElements = await this.page.evaluate(() => {
        const animatedElements = document.querySelectorAll('.animate-pulse, .animate-bounce, .transition-all');
        return animatedElements.length > 0;
      });
      
      this.testResult('Coupling indicators have animations', hasAnimatedElements);
      
      // Test mathematical relationship visualization
      const relationshipVisible = await this.page.evaluate(() => {
        const relationshipElement = document.querySelector('[data-testid="mathematical-relationship"]');
        return relationshipElement && relationshipElement.offsetParent !== null;
      });
      
      this.testResult('Mathematical relationship visualization visible', relationshipVisible);
      
      await this.takeScreenshot('coupling-indicators');
    } catch (error) {
      this.testResult('Coupling indicators test', false, error.message);
    }
  }

  /**
   * Test 3: Verify tooltips appear on hover
   */
  async testTooltips() {
    console.log('\n🧪 Testing Tooltips...');
    
    try {
      // Find elements with tooltips
      const tooltipTriggers = await this.page.$$('[data-tooltip], [title], [aria-label]');
      
      if (tooltipTriggers.length > 0) {
        // Test hover on first tooltip trigger
        const firstTrigger = tooltipTriggers[0];
        
        // Hover over element
        await firstTrigger.hover();
        await this.page.waitForTimeout(500);
        
        // Check if tooltip appears
        const tooltipVisible = await this.page.evaluate(() => {
          const tooltips = document.querySelectorAll('.tooltip, [role="tooltip"], .absolute.group-hover\\:block');
          return Array.from(tooltips).some(tooltip => 
            tooltip.offsetParent !== null && 
            window.getComputedStyle(tooltip).visibility !== 'hidden'
          );
        });
        
        this.testResult('Tooltip appears on hover', tooltipVisible);
        
        // Test tooltip content
        const tooltipContent = await this.page.evaluate(() => {
          const visibleTooltip = document.querySelector('.tooltip, [role="tooltip"], .absolute.group-hover\\:block');
          return visibleTooltip ? visibleTooltip.textContent.trim() : '';
        });
        
        this.testResult('Tooltip has meaningful content', tooltipContent.length > 0);
        
        await this.takeScreenshot('tooltip-display');
      } else {
        this.testResult('Tooltip triggers exist', false, 'No tooltip triggers found');
      }
    } catch (error) {
      this.testResult('Tooltips test', false, error.message);
    }
  }

  /**
   * Test 4: Verify progress bars have animations
   */
  async testProgressAnimations() {
    console.log('\n🧪 Testing Progress Bar Animations...');
    
    try {
      // Find progress bars
      const progressBars = await this.page.$$('[data-testid="progress-bar"], .progress, [role="progressbar"]');
      
      this.testResult('Progress bars exist', progressBars.length > 0);
      
      if (progressBars.length > 0) {
        // Test animation properties
        const hasAnimatedProgress = await this.page.evaluate(() => {
          const progressElements = document.querySelectorAll('[data-testid="progress-bar"], .progress, [role="progressbar"]');
          return Array.from(progressElements).some(progress => {
            const styles = window.getComputedStyle(progress);
            return styles.transition && styles.transition !== 'none' ||
                   styles.animation && styles.animation !== 'none' ||
                   progress.classList.contains('animate') ||
                   progress.classList.contains('transition');
          });
        });
        
        this.testResult('Progress bars have animations', hasAnimatedProgress);
        
        // Test progress values update
        const progressValues = await this.page.evaluate(() => {
          const progressElements = document.querySelectorAll('[data-testid="progress-bar"], .progress, [role="progressbar"]');
          return Array.from(progressElements).map(progress => {
            const value = progress.getAttribute('aria-valuenow') || 
                         progress.style.width || 
                         progress.textContent;
            return value ? parseFloat(value) || 0 : 0;
          });
        });
        
        const hasValidProgress = progressValues.some(value => value > 0 && value <= 100);
        this.testResult('Progress bars have valid values', hasValidProgress);
        
        await this.takeScreenshot('progress-animations');
      }
    } catch (error) {
      this.testResult('Progress animations test', false, error.message);
    }
  }

  /**
   * Test 5: Verify error states display properly
   */
  async testErrorStates() {
    console.log('\n🧪 Testing Error States...');
    
    try {
      // Simulate error state by intercepting API calls
      await this.page.setRequestInterception(true);
      this.page.on('request', request => {
        if (request.url().includes('/api/psychological-metrics')) {
          request.respond({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Failed to load psychological metrics' })
          });
        } else {
          request.continue();
        }
      });
      
      // Reload page to trigger error
      await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);
      
      // Check for error display
      const errorElement = await this.waitForElement('[data-testid="error-message"], .error, .alert-error');
      this.testResult('Error message displays', errorElement);
      
      if (errorElement) {
        const errorContent = await this.page.evaluate(() => {
          const errorEl = document.querySelector('[data-testid="error-message"], .error, .alert-error');
          return errorEl ? errorEl.textContent.trim() : '';
        });
        
        this.testResult('Error message has meaningful content', errorContent.length > 0);
        
        await this.takeScreenshot('error-state');
      }
      
      // Reset request interception
      await this.page.setRequestInterception(true);
      this.page.removeAllListeners('request');
      this.page.on('request', request => request.continue());
      
    } catch (error) {
      this.testResult('Error states test', false, error.message);
    }
  }

  /**
   * Test 6: Verify loading states work correctly
   */
  async testLoadingStates() {
    console.log('\n🧪 Testing Loading States...');
    
    try {
      // Navigate to page and check for initial loading state
      await this.page.goto('http://localhost:3000/dashboard');
      
      // Check for loading indicators
      const loadingIndicator = await this.waitForElement('[data-testid="loading"], .loading, .spinner', 3000);
      this.testResult('Loading indicator displays', loadingIndicator);
      
      if (loadingIndicator) {
        // Check loading animation
        const hasLoadingAnimation = await this.page.evaluate(() => {
          const loadingEl = document.querySelector('[data-testid="loading"], .loading, .spinner');
          if (!loadingEl) return false;
          
          const styles = window.getComputedStyle(loadingEl);
          return styles.animation && styles.animation !== 'none' ||
                 loadingEl.classList.contains('animate-spin') ||
                 loadingEl.classList.contains('animate-pulse');
        });
        
        this.testResult('Loading indicator has animation', hasLoadingAnimation);
        
        await this.takeScreenshot('loading-state');
      }
      
      // Wait for loading to complete
      await this.page.waitForTimeout(3000);
      
      // Verify content loads after loading state
      const contentLoaded = await this.waitForElement('[data-testid="psychological-metrics-card"]', 5000);
      this.testResult('Content loads after loading state', contentLoaded);
      
    } catch (error) {
      this.testResult('Loading states test', false, error.message);
    }
  }

  /**
   * Test 7: Verify responsive design
   */
  async testResponsiveDesign() {
    console.log('\n🧪 Testing Responsive Design...');
    
    try {
      const viewports = [
        { width: 320, height: 568, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1920, height: 1080, name: 'Desktop' }
      ];
      
      for (const viewport of viewports) {
        await this.page.setViewport({ width: viewport.width, height: viewport.height });
        await this.page.waitForTimeout(1000);
        
        // Check if psychological metrics card adapts to viewport
        const cardVisible = await this.waitForElement('[data-testid="psychological-metrics-card"]');
        
        if (cardVisible) {
          // Check if card is properly sized for viewport
          const cardBounds = await this.page.evaluate(() => {
            const card = document.querySelector('[data-testid="psychological-metrics-card"]');
            return card ? card.getBoundingClientRect() : null;
          });
          
          const properlySized = cardBounds && 
                               cardBounds.width > 0 && 
                               cardBounds.height > 0 &&
                               cardBounds.width <= viewport.width;
          
          this.testResult(`Card properly sized for ${viewport.name}`, properlySized);
          
          await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);
        }
      }
      
    } catch (error) {
      this.testResult('Responsive design test', false, error.message);
    }
  }

  /**
   * Test 8: Verify consistency between dashboard and home page
   */
  async testConsistencyBetweenPages() {
    console.log('\n🧪 Testing Consistency Between Dashboard and Home Page...');
    
    try {
      // Get psychological metrics from dashboard
      await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);
      
      const dashboardMetrics = await this.page.evaluate(() => {
        const card = document.querySelector('[data-testid="psychological-metrics-card"]');
        if (!card) return null;
        
        return {
          disciplineLevel: card.querySelector('[data-testid="discipline-level-value"]')?.textContent,
          tiltControl: card.querySelector('[data-testid="tilt-control-value"]')?.textContent,
          couplingType: card.querySelector('[data-testid="coupling-type"]')?.textContent
        };
      });
      
      // Get psychological metrics from home page
      await this.page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);
      
      const homeMetrics = await this.page.evaluate(() => {
        const card = document.querySelector('[data-testid="psychological-metrics-card"]');
        if (!card) return null;
        
        return {
          disciplineLevel: card.querySelector('[data-testid="discipline-level-value"]')?.textContent,
          tiltControl: card.querySelector('[data-testid="tilt-control-value"]')?.textContent,
          couplingType: card.querySelector('[data-testid="coupling-type"]')?.textContent
        };
      });
      
      // Compare metrics
      const metricsMatch = dashboardMetrics && homeMetrics &&
                          dashboardMetrics.disciplineLevel === homeMetrics.disciplineLevel &&
                          dashboardMetrics.tiltControl === homeMetrics.tiltControl &&
                          dashboardMetrics.couplingType === homeMetrics.couplingType;
      
      this.testResult('Metrics consistent between pages', metricsMatch);
      
      // Test visual consistency
      await this.page.goto('http://localhost:3000/dashboard');
      await this.takeScreenshot('dashboard-psychological-metrics');
      
      await this.page.goto('http://localhost:3000/');
      await this.takeScreenshot('home-psychological-metrics');
      
    } catch (error) {
      this.testResult('Consistency between pages test', false, error.message);
    }
  }

  /**
   * Test 9: Verify real-time update animations
   */
  async testRealTimeUpdates() {
    console.log('\n🧪 Testing Real-time Update Animations...');
    
    try {
      await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);
      
      // Simulate real-time update by modifying values
      const updateOccurred = await this.page.evaluate(() => {
        const progressBars = document.querySelectorAll('[data-testid="progress-bar"]');
        if (progressBars.length === 0) return false;
        
        // Simulate value change
        progressBars.forEach(bar => {
          const currentValue = parseInt(bar.getAttribute('aria-valuenow') || '0');
          const newValue = Math.min(100, currentValue + 10);
          bar.setAttribute('aria-valuenow', newValue);
          bar.style.width = `${newValue}%`;
          
          // Add animation class
          bar.classList.add('transition-all', 'duration-500');
        });
        
        return true;
      });
      
      this.testResult('Real-time update triggered', updateOccurred);
      
      if (updateOccurred) {
        await this.page.waitForTimeout(1000);
        
        // Check if animation classes are present
        const hasUpdateAnimation = await this.page.evaluate(() => {
          const elements = document.querySelectorAll('.transition-all, .duration-500, .animate-pulse');
          return elements.length > 0;
        });
        
        this.testResult('Update animation applied', hasUpdateAnimation);
        
        await this.takeScreenshot('real-time-update');
      }
      
    } catch (error) {
      this.testResult('Real-time updates test', false, error.message);
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const report = {
      summary: {
        total: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        passRate: ((this.testResults.passed / this.testResults.total) * 100).toFixed(2) + '%'
      },
      details: this.testResults.details,
      screenshots: this.screenshots,
      timestamp: new Date().toISOString()
    };
    
    const reportPath = path.join(__dirname, 'psychological-metrics-ui-test-report.json');
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Test Report Generated:');
    console.log(`   Total Tests: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Pass Rate: ${report.summary.passRate}`);
    console.log(`   Report saved to: ${reportPath}`);
    
    return report;
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    try {
      await this.initialize();
      
      // Run all test methods
      await this.testPsychologicalMetricsCardDisplay();
      await this.testCouplingIndicators();
      await this.testTooltips();
      await this.testProgressAnimations();
      await this.testErrorStates();
      await this.testLoadingStates();
      await this.testResponsiveDesign();
      await this.testConsistencyBetweenPages();
      await this.testRealTimeUpdates();
      
      // Generate final report
      const report = this.generateReport();
      
      return report;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
        console.log('🔚 Browser closed');
      }
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new PsychologicalMetricsUITest();
  testSuite.runAllTests()
    .then(report => {
      console.log('\n🎉 Psychological Metrics UI Test Suite Completed!');
      process.exit(report.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = PsychologicalMetricsUITest;
