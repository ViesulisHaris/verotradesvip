/**
 * Menu Color Harmony Testing Script
 * Tests the new forest green/dark blue menu colors against Balatro background
 * Validates hover states, transitions, and responsive behavior
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class MenuColorHarmonyTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      colorHarmony: {},
      responsiveBehavior: {},
      hoverStates: {},
      transitions: {},
      accessibility: {}
    };
    this.screenshotDir = './menu-color-harmony-screenshots';
    this.ensureScreenshotDir();
  }

  ensureScreenshotDir() {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async init() {
    console.log('🎨 Initializing Menu Color Harmony Test...');
    this.browser = await chromium.launch({ 
      headless: false,
      args: ['--start-maximized']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async navigateToTestPage() {
    const testUrl = 'http://localhost:3001/test-menu-color-harmony';
    console.log(`📍 Navigating to: ${testUrl}`);
    
    try {
      await this.page.goto(testUrl, { waitUntil: 'networkidle' });
      console.log('✅ Successfully navigated to test page');
      
      // Wait for the page to fully load
      await this.page.waitForTimeout(2000);
    } catch (error) {
      console.error('❌ Failed to navigate to test page:', error.message);
      throw error;
    }
  }

  async testColorHarmony() {
    console.log('🎨 Testing Color Harmony with Balatro Background...');
    
    const colorTests = [
      {
        name: 'Forest Green Integration',
        selector: '.sidebar-menu-item.active',
        expectedColors: ['rgb(26, 63, 26)', 'rgba(26, 63, 26'],
        description: 'Active menu items should use forest green (#1A3F1A)'
      },
      {
        name: 'Dark Blue Integration',
        selector: '.sidebar-menu-item.active',
        expectedColors: ['rgb(36, 42, 80)', 'rgba(36, 42, 80)'],
        description: 'Active menu items should use dark blue (#242A50)'
      },
      {
        name: 'Text Readability',
        selector: '.sidebar-menu-item.active span',
        expectedColors: ['rgb(74, 222, 128)', 'rgb(134, 239, 172)', 'rgb(255, 255, 255)'],
        description: 'Text should remain readable against green/blue backgrounds'
      },
      {
        name: 'Border Consistency',
        selector: '.sidebar-menu-item.active',
        property: 'borderColor',
        expectedColors: ['rgb(26, 63, 26)', 'rgba(26, 63, 26)'],
        description: 'Borders should use forest green'
      },
      {
        name: 'Logout Button Contrast',
        selector: 'button:has-text("Logout")',
        expectedColors: ['rgb(251, 146, 60)'],
        description: 'Logout button should use orange for contrast'
      }
    ];

    for (const test of colorTests) {
      try {
        await this.page.waitForSelector(test.selector, { timeout: 5000 });
        const elements = await this.page.$$(test.selector);
        
        if (elements.length === 0) {
          this.testResults.colorHarmony[test.name] = {
            passed: false,
            error: `Element not found: ${test.selector}`,
            description: test.description
          };
          continue;
        }

        let passed = false;
        let actualColors = [];

        for (const element of elements) {
          const computedStyle = await element.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              backgroundColor: styles.backgroundColor,
              color: styles.color,
              borderColor: styles.borderColor,
              background: styles.background
            };
          });

          if (test.property === 'borderColor') {
            actualColors.push(computedStyle.borderColor);
          } else if (test.expectedColors.some(color => 
                     computedStyle.backgroundColor?.includes(color) ||
                     computedStyle.color?.includes(color) ||
                     computedStyle.background?.includes(color))) {
            actualColors.push(computedStyle.backgroundColor || computedStyle.color || computedStyle.background);
            passed = true;
          }
        }

        this.testResults.colorHarmony[test.name] = {
          passed,
          actualColors,
          expectedColors: test.expectedColors,
          description: test.description,
          elementCount: elements.length
        };

        console.log(`${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASS' : 'FAIL'}`);
        if (!passed) {
          console.log(`   Expected: ${test.expectedColors.join(', ')}`);
          console.log(`   Actual: ${actualColors.join(', ')}`);
        }

      } catch (error) {
        this.testResults.colorHarmony[test.name] = {
          passed: false,
          error: error.message,
          description: test.description
        };
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      }
    }

    // Take screenshot for visual verification
    await this.page.screenshot({ 
      path: path.join(this.screenshotDir, 'color-harmony-desktop.png'),
      fullPage: true 
    });
  }

  async testResponsiveBehavior() {
    console.log('📱 Testing Responsive Behavior...');
    
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
      
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(1000);

      // Switch to the corresponding view
      await this.page.click(`button:has-text("${viewport.name}")`);
      await this.page.waitForTimeout(1000);

      const responsiveTests = [
        {
          name: 'Sidebar Visibility',
          test: async () => {
            const sidebar = await this.page.$('.fixed.top-0.left-0');
            return sidebar !== null;
          }
        },
        {
          name: 'Menu Items Accessible',
          test: async () => {
            const menuItems = await this.page.$$('.sidebar-menu-item');
            return menuItems.length > 0;
          }
        },
        {
          name: 'Toggle Button Visible',
          test: async () => {
            const toggleButton = await this.page.$('button[title="Toggle menu"]');
            const isVisible = await toggleButton.isVisible();
            return isVisible;
          }
        },
        {
          name: 'Content Layout Preserved',
          test: async () => {
            const contentArea = await this.page.$('.p-8');
            return contentArea !== null;
          }
        }
      ];

      const viewportResults = {};
      
      for (const test of responsiveTests) {
        try {
          const passed = await test.test();
          viewportResults[test.name] = {
            passed,
            description: test.name
          };
          console.log(`  ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASS' : 'FAIL'}`);
        } catch (error) {
          viewportResults[test.name] = {
            passed: false,
            error: error.message,
            description: test.name
          };
          console.log(`  ❌ ${test.name}: ERROR - ${error.message}`);
        }
      }

      this.testResults.responsiveBehavior[viewport.name] = viewportResults;

      // Take screenshot for each viewport
      await this.page.screenshot({ 
        path: path.join(this.screenshotDir, `responsive-${viewport.name.toLowerCase()}.png`),
        fullPage: true 
      });
    }
  }

  async testHoverStates() {
    console.log('🖱️ Testing Hover States...');
    
    const hoverTests = [
      {
        name: 'Menu Item Hover',
        selector: '.sidebar-menu-item:not(.active)',
        hoverSelector: '.sidebar-menu-item:not(.active)',
        expectedEffect: 'green-300',
        description: 'Hover should show green-300 color'
      },
      {
        name: 'Logout Button Hover',
        selector: 'button:has-text("Logout")',
        expectedEffect: 'orange-300',
        description: 'Logout hover should show orange-300 color'
      },
      {
        name: 'Toggle Button Hover',
        selector: 'button[title="Toggle menu"]',
        expectedEffect: 'blue-300',
        description: 'Toggle hover should show blue-300 color'
      }
    ];

    for (const test of hoverTests) {
      try {
        await this.page.waitForSelector(test.selector, { timeout: 5000 });
        
        // Get initial state
        const element = await this.page.$(test.selector);
        const initialStyle = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            filter: styles.filter
          };
        });

        // Hover over element
        await element.hover();
        await this.page.waitForTimeout(500); // Wait for transition

        // Get hover state
        const hoverStyle = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            filter: styles.filter
          };
        });

        // Check if hover effect is applied
        const hasExpectedEffect = hoverStyle.color?.includes(test.expectedEffect) ||
                                 hoverStyle.backgroundColor?.includes(test.expectedEffect) ||
                                 hoverStyle.filter?.includes(test.expectedEffect);

        this.testResults.hoverStates[test.name] = {
          passed: hasExpectedEffect,
          initialStyle,
          hoverStyle,
          expectedEffect: test.expectedEffect,
          description: test.description
        };

        console.log(`${hasExpectedEffect ? '✅' : '❌'} ${test.name}: ${hasExpectedEffect ? 'PASS' : 'FAIL'}`);
        
        if (!hasExpectedEffect) {
          console.log(`   Expected effect: ${test.expectedEffect}`);
          console.log(`   Hover color: ${hoverStyle.color}`);
          console.log(`   Hover background: ${hoverStyle.backgroundColor}`);
        }

        // Move away to reset
        await this.page.mouse.move(0, 0);
        await this.page.waitForTimeout(200);

      } catch (error) {
        this.testResults.hoverStates[test.name] = {
          passed: false,
          error: error.message,
          description: test.description
        };
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      }
    }

    // Take hover state screenshot
    await this.page.screenshot({ 
      path: path.join(this.screenshotDir, 'hover-states.png'),
      fullPage: true 
    });
  }

  async testTransitions() {
    console.log('⚡ Testing Transitions...');
    
    // Open sidebar for transition testing
    await this.page.click('button[title="Toggle menu"]');
    await this.page.waitForTimeout(500);

    const transitionTests = [
      {
        name: 'Sidebar Open/Close',
        action: async () => {
          const startTime = Date.now();
          await this.page.click('button[title="Toggle menu"]');
          
          // Wait for transition to complete
          await this.page.waitForFunction(() => {
            const sidebar = document.querySelector('.fixed.top-0.left-0');
            if (!sidebar) return false;
            const transform = window.getComputedStyle(sidebar).transform;
            return transform.includes('translateX(0)') || transform.includes('translateX(-100%)');
          }, { timeout: 2000 });
          
          return Date.now() - startTime;
        },
        maxDuration: 500, // Should complete within 500ms
        description: 'Sidebar transition should complete within 500ms'
      },
      {
        name: 'Menu Item Hover Transition',
        action: async () => {
          const menuItem = await this.page.$('.sidebar-menu-item:not(.active)');
          const startTime = Date.now();
          
          await menuItem.hover();
          await this.page.waitForTimeout(400); // Wait for 300ms transition + buffer
          
          return Date.now() - startTime;
        },
        maxDuration: 400,
        description: 'Menu item hover should transition within 400ms'
      }
    ];

    for (const test of transitionTests) {
      try {
        const duration = await test.action();
        const passed = duration <= test.maxDuration;
        
        this.testResults.transitions[test.name] = {
          passed,
          duration,
          maxDuration: test.maxDuration,
          description: test.description
        };

        console.log(`${passed ? '✅' : '❌'} ${test.name}: ${duration}ms (${passed ? 'PASS' : 'FAIL'})`);
        
        if (!passed) {
          console.log(`   Expected: ≤${test.maxDuration}ms`);
          console.log(`   Actual: ${duration}ms`);
        }

      } catch (error) {
        this.testResults.transitions[test.name] = {
          passed: false,
          error: error.message,
          description: test.description
        };
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      }
    }

    // Take transition screenshot
    await this.page.screenshot({ 
      path: path.join(this.screenshotDir, 'transitions.png'),
      fullPage: true 
    });
  }

  async testAccessibility() {
    console.log('♿ Testing Accessibility...');
    
    const accessibilityTests = [
      {
        name: 'Color Contrast Ratio',
        test: async () => {
          const activeMenuItem = await this.page.$('.sidebar-menu-item.active');
          const styles = await activeMenuItem.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              backgroundColor: computed.backgroundColor,
              color: computed.color
            };
          });

          // Basic contrast check - should be sufficient for readability
          const hasGoodContrast = 
            styles.color === 'rgb(255, 255, 255)' || // White text
            styles.color === 'rgb(74, 222, 128)' || // Green-300 text
            styles.color === 'rgb(134, 239, 172)'; // Green-200 text

          return hasGoodContrast;
        },
        description: 'Text should have sufficient contrast against background'
      },
      {
        name: 'Focus Indicators',
        test: async () => {
          // Test keyboard navigation
          await this.page.keyboard.press('Tab');
          await this.page.waitForTimeout(200);
          
          const focusedElement = await this.page.evaluate(() => {
            const active = document.activeElement;
            return active && activeElement.className.includes('sidebar-menu-item');
          });

          return focusedElement;
        },
        description: 'Focus should be visible on menu items'
      },
      {
        name: 'Screen Reader Compatibility',
        test: async () => {
          const menuItems = await this.page.$$('.sidebar-menu-item');
          let hasLabels = true;
          
          for (const item of menuItems) {
            const hasText = await item.evaluate(el => {
              return el.textContent && el.textContent.trim().length > 0;
            });
            
            if (!hasText) {
              hasLabels = false;
              break;
            }
          }

          return hasLabels;
        },
        description: 'Menu items should have text content for screen readers'
      }
    ];

    for (const test of accessibilityTests) {
      try {
        const passed = await test.test();
        
        this.testResults.accessibility[test.name] = {
          passed,
          description: test.description
        };

        console.log(`${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASS' : 'FAIL'}`);

      } catch (error) {
        this.testResults.accessibility[test.name] = {
          passed: false,
          error: error.message,
          description: test.description
        };
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      }
    }
  }

  async generateReport() {
    console.log('📊 Generating Comprehensive Report...');
    
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      testType: 'Menu Color Harmony with Balatro Background',
      summary: this.calculateSummary(),
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };

    // Save JSON report
    const reportPath = path.join(this.screenshotDir, `menu-color-harmony-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(this.screenshotDir, `menu-color-harmony-report-${Date.now()}.md`);
    fs.writeFileSync(markdownPath, markdownReport);

    console.log(`📄 Reports saved to:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   Markdown: ${markdownPath}`);

    return report;
  }

  calculateSummary() {
    const allTests = [
      ...Object.values(this.testResults.colorHarmony),
      ...Object.values(this.testResults.responsiveBehavior).flatMap(v => Object.values(v)),
      ...Object.values(this.testResults.hoverStates),
      ...Object.values(this.testResults.transitions),
      ...Object.values(this.testResults.accessibility)
    ];

    const passed = allTests.filter(test => test.passed).length;
    const total = allTests.length;
    const passRate = Math.round((passed / total) * 100);

    return {
      passed,
      total,
      passRate,
      status: passRate >= 80 ? 'SUCCESS' : passRate >= 60 ? 'PARTIAL' : 'FAILED'
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Analyze color harmony
    const colorHarmonyFailed = Object.values(this.testResults.colorHarmony)
      .filter(test => !test.passed);
    
    if (colorHarmonyFailed.length > 0) {
      recommendations.push({
        category: 'Color Harmony',
        priority: 'HIGH',
        issue: 'Some menu colors don\'t match Balatro background theme',
        solution: 'Ensure all active states use forest green (#1A3F1A) and dark blue (#242A50) gradients'
      });
    }

    // Analyze hover states
    const hoverFailed = Object.values(this.testResults.hoverStates)
      .filter(test => !test.passed);
    
    if (hoverFailed.length > 0) {
      recommendations.push({
        category: 'Hover States',
        priority: 'MEDIUM',
        issue: 'Hover states not using consistent green theme',
        solution: 'Update hover classes to use green-300 instead of blue tones'
      });
    }

    // Analyze transitions
    const transitionFailed = Object.values(this.testResults.transitions)
      .filter(test => !test.passed);
    
    if (transitionFailed.length > 0) {
      recommendations.push({
        category: 'Transitions',
        priority: 'MEDIUM',
        issue: 'Transition timing exceeds 300ms target',
        solution: 'Optimize CSS transitions to use exactly 300ms duration'
      });
    }

    // Analyze accessibility
    const accessibilityFailed = Object.values(this.testResults.accessibility)
      .filter(test => !test.passed);
    
    if (accessibilityFailed.length > 0) {
      recommendations.push({
        category: 'Accessibility',
        priority: 'HIGH',
        issue: 'Color contrast or focus indicators insufficient',
        solution: 'Ensure text has WCAG AA compliant contrast and focus states are visible'
      });
    }

    return recommendations;
  }

  generateMarkdownReport(report) {
    let markdown = `# Menu Color Harmony Test Report\n\n`;
    markdown += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`;
    markdown += `**Test Type:** ${report.testType}\n\n`;
    
    // Summary
    markdown += `## Summary\n\n`;
    markdown += `- **Status:** ${report.summary.status}\n`;
    markdown += `- **Pass Rate:** ${report.summary.passRate}% (${report.summary.passed}/${report.summary.total})\n\n`;
    
    // Color Harmony Results
    markdown += `## Color Harmony Results\n\n`;
    for (const [testName, result] of Object.entries(report.results.colorHarmony)) {
      markdown += `### ${testName}\n`;
      markdown += `- **Status:** ${result.passed ? '✅ PASS' : '❌ FAIL'}\n`;
      markdown += `- **Description:** ${result.description}\n`;
      if (!result.passed) {
        markdown += `- **Issue:** ${result.error || 'Color mismatch'}\n`;
        if (result.actualColors) {
          markdown += `- **Actual Colors:** ${result.actualColors.join(', ')}\n`;
          markdown += `- **Expected Colors:** ${result.expectedColors.join(', ')}\n`;
        }
      }
      markdown += `\n`;
    }
    
    // Recommendations
    markdown += `## Recommendations\n\n`;
    for (const rec of report.recommendations) {
      markdown += `### ${rec.category} (${rec.priority})\n`;
      markdown += `- **Issue:** ${rec.issue}\n`;
      markdown += `- **Solution:** ${rec.solution}\n\n`;
    }
    
    return markdown;
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      await this.navigateToTestPage();
      
      // Run all tests
      await this.testColorHarmony();
      await this.testResponsiveBehavior();
      await this.testHoverStates();
      await this.testTransitions();
      await this.testAccessibility();
      
      // Generate report
      const report = await this.generateReport();
      
      console.log('\n🎉 Menu Color Harmony Test Complete!');
      console.log(`📊 Overall Status: ${report.summary.status}`);
      console.log(`📈 Pass Rate: ${report.summary.passRate}%`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new MenuColorHarmonyTest();
  test.run()
    .then(report => {
      console.log('\n✅ Test completed successfully');
      process.exit(report.summary.status === 'SUCCESS' ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = MenuColorHarmonyTest;