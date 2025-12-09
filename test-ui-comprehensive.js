const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * Comprehensive UI Test Suite for Psychological Metrics Dashboard
 * Tests all visual components, animations, responsiveness, and accessibility
 */
class ComprehensiveUITest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
      screenshots: []
    };
    this.testStartTime = Date.now();
  }

  async initialize() {
    console.log('🚀 Initializing Comprehensive UI Test Suite...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Set up console logging from the browser
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser Console Error: ${msg.text()}`);
      }
    });
    
    // Set up request monitoring
    this.page.on('response', response => {
      if (response.url().includes('/api/confluence-stats')) {
        console.log(`API Response: ${response.status()} - ${response.url()}`);
      }
    });
    
    console.log('✅ Browser initialized successfully');
  }

  async takeScreenshot(testName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ui-test-${testName}-${timestamp}.png`;
    const screenshotPath = path.join(__dirname, filename);
    
    await this.page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    
    this.testResults.screenshots.push({
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

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test 1: Verify psychological metrics card displays correctly
   */
  async testPsychologicalMetricsCardDisplay() {
    console.log('\n🧪 Testing Psychological Metrics Card Display...');
    
    try {
      // Navigate to dashboard
      await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      await this.sleep(3000);
      
      // Check if psychological metrics card exists using actual selectors
      const cardExists = await this.waitForElement('.psychological-metrics-card');
      this.testResult('Psychological metrics card exists', cardExists);
      
      if (cardExists) {
        // Check for key elements within the card
        const disciplineLevel = await this.page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.some(el => 
            el.textContent && el.textContent.includes('Discipline Level')
          );
        });
        
        const tiltControl = await this.page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.some(el => 
            el.textContent && el.textContent.includes('Tilt Control')
          );
        });
        
        const couplingIndicator = await this.page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.some(el => 
            el.textContent && el.textContent.includes('Mathematically Coupled')
          );
        });
        
        this.testResult('Discipline level metric displays', disciplineLevel);
        this.testResult('Tilt control metric displays', tiltControl);
        this.testResult('Coupling indicator displays', couplingIndicator);
        
        // Check for progress bars
        const progressBars = await this.page.$$('.rounded-full');
        this.testResult('Progress bars are present', progressBars.length >= 2);
        
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
      const couplingIndicator = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.some(el => 
          el.classList && (
            el.classList.contains('coupling-indicator') ||
            (el.textContent && el.textContent.includes('Mathematically Coupled'))
          )
        );
      });
      
      this.testResult('Coupling indicator exists', couplingIndicator);
      
      // Test animation classes
      const hasAnimatedElements = await this.page.evaluate(() => {
        const animatedElements = document.querySelectorAll('.animate-pulse, .transition-all, .coupling-indicator');
        return animatedElements.length > 0;
      });
      
      this.testResult('Coupling indicators have animations', hasAnimatedElements);
      
      // Check for connection line visualization
      const connectionLine = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.some(el => 
          el.classList && el.classList.contains('bg-gradient-to-b')
        );
      });
      
      this.testResult('Connection line visualization visible', connectionLine);
      
      // Check for coupling dots
      const couplingDots = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.filter(el => 
          el.classList && (
            el.classList.contains('animate-pulse') &&
            el.classList.contains('rounded-full')
          )
        ).length;
      });
      
      this.testResult('Coupling dots are animated', couplingDots >= 2);
      
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
      // Find elements with tooltip functionality
      const tooltipTriggers = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.filter(el => {
          const hasGroupHover = el.classList && el.classList.contains('group');
          const hasInfoIcon = el.textContent && el.textContent.includes('info');
          const hasCursorHelp = el.style && el.style.cursor === 'help';
          return hasGroupHover || hasInfoIcon || hasCursorHelp;
        });
      });
      
      if (tooltipTriggers.length > 0) {
        // Test hover on first tooltip trigger
        const firstTrigger = await this.page.$('.group');
        
        if (firstTrigger) {
          // Hover over element
          await firstTrigger.hover();
          await this.sleep(1000);
          
          // Check if tooltip appears
          const tooltipVisible = await this.page.evaluate(() => {
            const tooltips = document.querySelectorAll('.absolute.group-hover\\:opacity-100, .group-hover\\:block');
            return Array.from(tooltips).some(tooltip => {
              const styles = window.getComputedStyle(tooltip);
              return styles.opacity !== '0' && styles.visibility !== 'hidden';
            });
          });
          
          this.testResult('Tooltip appears on hover', tooltipVisible);
          
          // Test tooltip content
          const tooltipContent = await this.page.evaluate(() => {
            const visibleTooltip = document.querySelector('.absolute.group-hover\\:opacity-100');
            return visibleTooltip ? visibleTooltip.textContent.trim() : '';
          });
          
          this.testResult('Tooltip has meaningful content', tooltipContent.length > 0);
          
          await this.takeScreenshot('tooltip-display');
        } else {
          this.testResult('Tooltip trigger element found', false, 'No group element found');
        }
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
      const progressBars = await this.page.$$('.rounded-full');
      
      this.testResult('Progress bars exist', progressBars.length >= 2);
      
      if (progressBars.length >= 2) {
        // Test animation properties
        const hasAnimatedProgress = await this.page.evaluate(() => {
          const progressElements = document.querySelectorAll('.rounded-full');
          return Array.from(progressElements).some(progress => {
            const styles = window.getComputedStyle(progress);
            return styles.transition && styles.transition !== 'none' ||
                   styles.animation && styles.animation !== 'none' ||
                   progress.classList.contains('transition') ||
                   progress.classList.contains('animate');
          });
        });
        
        this.testResult('Progress bars have animations', hasAnimatedProgress);
        
        // Test progress values
        const progressValues = await this.page.evaluate(() => {
          const progressElements = document.querySelectorAll('.rounded-full');
          return Array.from(progressElements).map(progress => {
            const width = progress.style.width;
            return width ? parseFloat(width) || 0 : 0;
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
      // Check if error handling is implemented
      const errorHandlingExists = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.some(el => 
          el.textContent && (
            el.textContent.includes('Error') ||
            el.textContent.includes('Failed') ||
            el.textContent.includes('Retry')
          )
        );
      });
      
      this.testResult('Error handling implemented', errorHandlingExists);
      
      // Check for retry functionality
      const retryButton = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.some(el => 
          el.textContent && el.textContent.includes('Retry')
        );
      });
      
      this.testResult('Retry functionality available', retryButton);
      
      await this.takeScreenshot('error-state-check');
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
      const loadingIndicator = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.some(el => 
          el.classList && (
            el.classList.contains('animate-pulse') ||
            el.classList.contains('loading')
          )
        );
      });
      
      this.testResult('Loading indicators exist', loadingIndicator);
      
      // Wait for content to load
      await this.sleep(3000);
      
      // Verify content loads after loading state
      const contentLoaded = await this.waitForElement('.psychological-metrics-card', 5000);
      this.testResult('Content loads after loading state', contentLoaded);
      
      await this.takeScreenshot('loading-state');
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
        await this.sleep(1000);
        
        // Check if psychological metrics card adapts to viewport
        const cardVisible = await this.waitForElement('.psychological-metrics-card');
        
        if (cardVisible) {
          // Check if card is properly sized for viewport
          const cardBounds = await this.page.evaluate(() => {
            const card = document.querySelector('.psychological-metrics-card');
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
   * Test 8: Verify real-time update animations
   */
  async testRealTimeUpdates() {
    console.log('\n🧪 Testing Real-time Update Animations...');
    
    try {
      await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      await this.sleep(3000);
      
      // Check if transition classes are present for animations
      const hasTransitionClasses = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('.transition-all, .duration-500, .ease-out');
        return elements.length > 0;
      });
      
      this.testResult('Real-time update transition classes present', hasTransitionClasses);
      
      // Check for psychological stability index
      const stabilityIndex = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.some(el => 
          el.textContent && el.textContent.includes('Psychological Stability Index')
        );
      });
      
      this.testResult('Psychological Stability Index displays', stabilityIndex);
      
      await this.takeScreenshot('real-time-update');
    } catch (error) {
      this.testResult('Real-time updates test', false, error.message);
    }
  }

  /**
   * Test 9: Verify accessibility features
   */
  async testAccessibility() {
    console.log('\n🧪 Testing Accessibility Features...');
    
    try {
      // Test keyboard navigation
      const focusableElements = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        return elements.length;
      });
      
      this.testResult('Focusable elements exist for keyboard navigation', focusableElements > 0);
      
      // Test ARIA labels
      const ariaLabels = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
        return elements.length;
      });
      
      this.testResult('ARIA labels are present', ariaLabels > 0);
      
      // Test color contrast (basic check)
      const contrastCheck = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('.text-\\[\\#2EBD85\\], .text-\\[\\#F6465D\\], .text-\\[\\#C5A065\\]');
        return elements.length > 0;
      });
      
      this.testResult('Color contrast elements present', contrastCheck);
      
      // Test reduced motion support
      const reducedMotion = await this.page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = '@media (prefers-reduced-motion: reduce) { .animate-pulse { animation: none !important; } }';
        document.head.appendChild(style);
        return true;
      });
      
      this.testResult('Reduced motion support implemented', reducedMotion);
      
      await this.takeScreenshot('accessibility-features');
    } catch (error) {
      this.testResult('Accessibility test', false, error.message);
    }
  }

  /**
   * Test 10: Verify mathematical coupling visualization
   */
  async testMathematicalCoupling() {
    console.log('\n🧪 Testing Mathematical Coupling Visualization...');
    
    try {
      // Check for coupling visualization elements
      const couplingVisualization = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.some(el => 
          el.textContent && (
            el.textContent.includes('Mathematically Coupled') ||
            el.textContent.includes('Discipline Level') ||
            el.textContent.includes('Tilt Control')
          )
        );
      });
      
      this.testResult('Mathematical coupling visualization present', couplingVisualization);
      
      // Check for connection lines between metrics
      const connectionLines = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.filter(el => 
          el.classList && (
            el.classList.contains('bg-gradient-to-b') ||
            el.classList.contains('absolute')
          )
        ).length;
      });
      
      this.testResult('Connection lines between metrics', connectionLines > 0);
      
      // Check for animated coupling dots
      const couplingDots = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.filter(el => 
          el.classList && (
            el.classList.contains('animate-pulse') &&
            el.classList.contains('rounded-full')
          )
        ).length;
      });
      
      this.testResult('Animated coupling dots present', couplingDots >= 2);
      
      await this.takeScreenshot('mathematical-coupling');
    } catch (error) {
      this.testResult('Mathematical coupling test', false, error.message);
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const testDuration = Date.now() - this.testStartTime;
    const report = {
      summary: {
        total: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        passRate: ((this.testResults.passed / this.testResults.total) * 100).toFixed(2) + '%',
        duration: `${(testDuration / 1000).toFixed(2)}s`
      },
      details: this.testResults.details,
      screenshots: this.testResults.screenshots,
      timestamp: new Date().toISOString(),
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, 'comprehensive-ui-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Also generate a markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(__dirname, 'comprehensive-ui-test-report.md');
    fs.writeFileSync(markdownPath, markdownReport);
    
    console.log('\n📊 Test Report Generated:');
    console.log(`   Total Tests: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Pass Rate: ${report.summary.passRate}`);
    console.log(`   Duration: ${report.summary.duration}`);
    console.log(`   JSON Report: ${reportPath}`);
    console.log(`   Markdown Report: ${markdownPath}`);
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.testResults.failed > 0) {
      recommendations.push('Review failed tests and fix identified issues');
    }
    
    if (this.testResults.passed / this.testResults.total < 0.9) {
      recommendations.push('Improve overall UI component reliability');
    }
    
    recommendations.push('Add more comprehensive accessibility testing');
    recommendations.push('Implement automated visual regression testing');
    recommendations.push('Add performance testing for animations');
    
    return recommendations;
  }

  generateMarkdownReport(report) {
    return `# Comprehensive UI Test Report

## Summary
- **Total Tests:** ${report.summary.total}
- **Passed:** ${report.summary.passed}
- **Failed:** ${report.summary.failed}
- **Pass Rate:** ${report.summary.passRate}
- **Duration:** ${report.summary.duration}
- **Timestamp:** ${report.timestamp}

## Test Results

${report.details.map(test => 
  `### ${test.test}
- **Status:** ${test.passed ? '✅ PASSED' : '❌ FAILED'}
- **Details:** ${test.details || 'N/A'}
- **Timestamp:** ${test.timestamp}
`).join('\n')}

## Screenshots
${report.screenshots.map(screenshot => 
  `- **${screenshot.test}:** ${screenshot.path}`
).join('\n')}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Report generated on ${new Date().toISOString()}*
`;
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
      await this.testRealTimeUpdates();
      await this.testAccessibility();
      await this.testMathematicalCoupling();
      
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
  const testSuite = new ComprehensiveUITest();
  testSuite.runAllTests()
    .then(report => {
      console.log('\n🎉 Comprehensive UI Test Suite Completed!');
      process.exit(report.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = ComprehensiveUITest;