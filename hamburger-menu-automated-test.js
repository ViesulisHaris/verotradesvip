const { JSDOM } = require('jsdom');

/**
 * Automated Hamburger Menu Testing Script
 * Tests hamburger menu functionality across different screen sizes
 */

const TEST_SIZES = [
  { name: 'Mobile Small', width: 320, height: 568 },
  { name: 'Mobile Medium', width: 375, height: 667 },
  { name: 'Mobile Large', width: 414, height: 896 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop Small', width: 1024, height: 768 },
  { name: 'Desktop Medium', width: 1280, height: 800 },
  { name: 'Desktop Large', width: 1440, height: 900 }
];

class HamburgerMenuTester {
  constructor() {
    this.results = [];
    this.dom = null;
    this.document = null;
  }

  async init() {
    console.log('🚀 Initializing automated hamburger menu testing...');
    
    // Read the HTML file
    const fs = require('fs');
    const htmlContent = fs.readFileSync('./hamburger-menu-manual-test.html', 'utf8');
    
    // Create virtual DOM
    this.dom = new JSDOM(htmlContent, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    this.document = this.dom.window.document;
    
    // Wait for scripts to execute
    await this.waitForScripts();
    
    console.log('✅ Virtual DOM initialized successfully');
  }

  async waitForScripts() {
    // Simulate DOMContentLoaded
    this.dom.window.document.dispatchEvent(new this.dom.window.Event('DOMContentLoaded'));
    
    // Wait a bit for scripts to execute
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async testViewport(testSize) {
    const { name, width, height } = testSize;
    console.log(`\n📱 Testing ${name} (${width}x${height})`);
    
    const testResult = {
      screenSize: name,
      dimensions: `${width}x${height}`,
      tests: []
    };

    try {
      // Set viewport size
      this.dom.window.innerWidth = width;
      this.dom.window.innerHeight = height;
      
      // Trigger resize event
      this.dom.window.dispatchEvent(new this.dom.window.Event('resize'));
      
      // Wait for responsive updates
      await new Promise(resolve => setTimeout(resolve, 50));

      // Test 1: Hamburger menu visibility
      const hamburgerButton = this.document.getElementById('hamburgerButton');
      const existsInDOM = hamburgerButton !== null;
      
      testResult.tests.push({
        name: 'Hamburger Menu Button Exists in DOM',
        status: existsInDOM ? 'PASS' : 'FAIL',
        details: existsInDOM ? 'Button found in DOM' : 'Button not found in DOM'
      });

      if (existsInDOM) {
        const isVisible = this.getComputedStyle(hamburgerButton).display !== 'none';
        const shouldBeVisible = width < 1024; // lg breakpoint
        const visibilityCorrect = isVisible === shouldBeVisible;
        
        testResult.tests.push({
          name: 'Hamburger Menu Visibility Correct',
          status: visibilityCorrect ? 'PASS' : 'FAIL',
          details: `Expected: ${shouldBeVisible ? 'Visible' : 'Hidden'}, Actual: ${isVisible ? 'Visible' : 'Hidden'}`
        });

        // Test 2: Touch-friendly sizing
        if (isVisible) {
          const rect = hamburgerButton.getBoundingClientRect();
          const isTouchFriendly = rect.width >= 44 && rect.height >= 44;
          
          testResult.tests.push({
            name: 'Touch-Friendly Sizing',
            status: isTouchFriendly ? 'PASS' : 'FAIL',
            details: `Size: ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum: 44x44px)`
          });
        }

        // Test 3: Accessibility attributes
        if (isVisible) {
          const hasAriaLabel = hamburgerButton.hasAttribute('aria-label');
          const hasTitle = hamburgerButton.hasAttribute('title');
          const hasAriaExpanded = hamburgerButton.hasAttribute('aria-expanded');
          
          testResult.tests.push({
            name: 'Accessibility Attributes',
            status: (hasAriaLabel && hasTitle && hasAriaExpanded) ? 'PASS' : 'FAIL',
            details: `aria-label: "${hamburgerButton.getAttribute('aria-label')}", title: "${hamburgerButton.getAttribute('title')}", aria-expanded: "${hamburgerButton.getAttribute('aria-expanded')}"`
          });
        }

        // Test 4: Click functionality (only on mobile)
        if (shouldBeVisible) {
          // Test opening sidebar
          const sidebar = this.document.getElementById('sidebar');
          const backdrop = this.document.getElementById('sidebarBackdrop');
          
          // Initial state
          const initialSidebarOpen = sidebar.classList.contains('open');
          const initialBackdropOpen = backdrop.classList.contains('open');
          
          // Simulate click
          hamburgerButton.click();
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const sidebarOpenAfterClick = sidebar.classList.contains('open');
          const backdropOpenAfterClick = backdrop.classList.contains('open');
          
          testResult.tests.push({
            name: 'Hamburger Click Opens Sidebar',
            status: (!initialSidebarOpen && sidebarOpenAfterClick && !initialBackdropOpen && backdropOpenAfterClick) ? 'PASS' : 'FAIL',
            details: `Before: Sidebar=${initialSidebarOpen}, Backdrop=${initialBackdropOpen}, After: Sidebar=${sidebarOpenAfterClick}, Backdrop=${backdropOpenAfterClick}`
          });

          // Test closing sidebar
          if (sidebarOpenAfterClick) {
            // Test close button
            const closeButton = this.document.querySelector('button[aria-label="Close menu"]');
            if (closeButton) {
              closeButton.click();
              await new Promise(resolve => setTimeout(resolve, 100));
              
              const sidebarClosedAfterClose = !sidebar.classList.contains('open');
              const backdropClosedAfterClose = !backdrop.classList.contains('open');
              
              testResult.tests.push({
                name: 'Close Button Closes Sidebar',
                status: (sidebarClosedAfterClose && backdropClosedAfterClose) ? 'PASS' : 'FAIL',
                details: `Sidebar ${sidebarClosedAfterClose ? 'closed' : 'still open'}, Backdrop ${backdropClosedAfterClose ? 'closed' : 'still visible'}`
              });
            }

            // Test overlay click
            // Reopen sidebar
            hamburgerButton.click();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (sidebar.classList.contains('open')) {
              backdrop.click();
              await new Promise(resolve => setTimeout(resolve, 100));
              
              const sidebarClosedAfterOverlayClick = !sidebar.classList.contains('open');
              const backdropClosedAfterOverlayClick = !backdrop.classList.contains('open');
              
              testResult.tests.push({
                name: 'Overlay Click Closes Sidebar',
                status: (sidebarClosedAfterOverlayClick && backdropClosedAfterOverlayClick) ? 'PASS' : 'FAIL',
                details: `Sidebar ${sidebarClosedAfterOverlayClick ? 'closed' : 'still open'}, Backdrop ${backdropClosedAfterOverlayClick ? 'closed' : 'still visible'}`
              });
            }
          }
        }
      }

      // Test 5: Responsive classes
      const computedStyle = this.getComputedStyle(hamburgerButton);
      const hasCorrectResponsiveClass = hamburgerButton.className.includes('lg:hidden');
      
      testResult.tests.push({
        name: 'Responsive Classes Applied Correctly',
        status: hasCorrectResponsiveClass ? 'PASS' : 'FAIL',
        details: `Has lg:hidden class: ${hasCorrectResponsiveClass}, Classes: "${hamburgerButton.className}"`
      });

    } catch (error) {
      testResult.tests.push({
        name: 'Test Execution Error',
        status: 'FAIL',
        details: `Error: ${error.message}`
      });
    }

    this.results.push(testResult);
    return testResult;
  }

  getComputedStyle(element) {
    return this.dom.window.getComputedStyle(element);
  }

  async runAllTests() {
    console.log('\n🎯 Starting comprehensive hamburger menu testing...\n');

    // Test each screen size
    for (const testSize of TEST_SIZES) {
      await this.testViewport(testSize);
    }

    // Generate comprehensive report
    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE HAMBURGER MENU TEST REPORT');
    console.log('='.repeat(80));

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    this.results.forEach(result => {
      console.log(`\n📱 ${result.screenSize} (${result.dimensions})`);
      console.log('-'.repeat(50));

      result.tests.forEach(test => {
        totalTests++;
        
        const status = test.status;
        const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
        
        console.log(`${icon} ${test.name}: ${status}`);
        console.log(`   ${test.details}`);
        
        if (status === 'PASS') passedTests++;
        else if (status === 'FAIL') failedTests++;
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
    
    const successRate = (passedTests / totalTests) * 100;
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);

    // Overall assessment
    console.log('\n' + '='.repeat(80));
    console.log('🎯 OVERALL ASSESSMENT');
    console.log('='.repeat(80));
    
    if (successRate >= 95) {
      console.log('🟢 EXCELLENT: Hamburger menu functionality is working perfectly across all tested screen sizes!');
    } else if (successRate >= 85) {
      console.log('🟡 GOOD: Hamburger menu functionality is working well with minor issues.');
    } else if (successRate >= 70) {
      console.log('🟠 FAIR: Hamburger menu functionality has some issues that need attention.');
    } else {
      console.log('🔴 POOR: Hamburger menu functionality has significant issues that require immediate attention.');
    }

    // Save detailed report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate
      },
      results: this.results
    };

    const fs = require('fs');
    const reportFilename = `hamburger-menu-automated-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(reportFilename, JSON.stringify(reportData, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportFilename}`);
    
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate,
      results: this.results
    };
  }
}

// Run the tests
async function main() {
  const tester = new HamburgerMenuTester();
  
  try {
    await tester.init();
    const results = await tester.runAllTests();
    
    // Exit with appropriate code
    process.exit(results.successRate >= 85 ? 0 : 1);
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = HamburgerMenuTester;