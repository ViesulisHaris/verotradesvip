const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Comprehensive Hamburger Menu Testing Script
 * Tests hamburger menu functionality across different mobile screen sizes
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

const BASE_URL = 'http://localhost:3000';

class HamburgerMenuTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    console.log('🚀 Initializing browser for hamburger menu testing...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set default timeout
    this.page.setDefaultTimeout(10000);
    
    console.log('✅ Browser initialized successfully');
  }

  async navigateToPage() {
    console.log('📍 Navigating to dashboard page...');
    
    try {
      await this.page.goto(`${BASE_URL}/dashboard`, { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });
      
      // Wait for page to load
      await this.page.waitForTimeout(2000);
      
      console.log('✅ Successfully navigated to dashboard');
      return true;
    } catch (error) {
      console.error('❌ Failed to navigate to dashboard:', error.message);
      return false;
    }
  }

  async setViewportSize(width, height) {
    console.log(`📱 Setting viewport to ${width}x${height}`);
    await this.page.setViewport({ width, height });
    await this.page.waitForTimeout(500); // Allow for responsive adjustments
  }

  async testHamburgerMenuVisibility(testSize) {
    const { name, width, height } = testSize;
    console.log(`\n🔍 Testing hamburger menu visibility on ${name} (${width}x${height})`);
    
    const testResult = {
      screenSize: name,
      dimensions: `${width}x${height}`,
      tests: []
    };

    try {
      // Set viewport size
      await this.setViewportSize(width, height);

      // Test 1: Check if hamburger menu button exists in DOM
      const hamburgerButton = await this.page.$('button[aria-label="Toggle mobile menu"]');
      const existsInDOM = hamburgerButton !== null;
      
      testResult.tests.push({
        name: 'Hamburger Menu Button Exists in DOM',
        status: existsInDOM ? 'PASS' : 'FAIL',
        details: existsInDOM ? 'Button found in DOM' : 'Button not found in DOM'
      });

      // Test 2: Check if hamburger menu is visible
      let isVisible = false;
      let visibilityDetails = '';
      
      if (hamburgerButton) {
        const isVisibleInViewport = await this.page.evaluate((button) => {
          const rect = button.getBoundingClientRect();
          const style = window.getComputedStyle(button);
          
          return {
            visible: style.display !== 'none' && 
                     style.visibility !== 'hidden' && 
                     style.opacity !== '0',
            inViewport: rect.width > 0 && rect.height > 0,
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            rect: {
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left
            }
          };
        }, hamburgerButton);
        
        isVisible = isVisibleInViewport.visible && isVisibleInViewport.inViewport;
        visibilityDetails = JSON.stringify(isVisibleInViewport, null, 2);
      }

      // Expected visibility based on screen size
      const shouldBeVisible = width < 1024; // lg breakpoint
      const visibilityCorrect = isVisible === shouldBeVisible;
      
      testResult.tests.push({
        name: 'Hamburger Menu Visibility Correct',
        status: visibilityCorrect ? 'PASS' : 'FAIL',
        details: `Expected: ${shouldBeVisible ? 'Visible' : 'Hidden'}, Actual: ${isVisible ? 'Visible' : 'Hidden'}\n${visibilityDetails}`
      });

      // Test 3: Check responsive classes
      const responsiveClasses = await this.page.evaluate(() => {
        const button = document.querySelector('button[aria-label="Toggle mobile menu"]');
        if (!button) return null;
        
        return {
          className: button.className,
          hasLgHidden: button.classList.contains('lg:hidden'),
          computedStyle: {
            display: window.getComputedStyle(button).display,
            position: window.getComputedStyle(button).position,
            zIndex: window.getComputedStyle(button).zIndex
          }
        };
      });

      if (responsiveClasses) {
        testResult.tests.push({
          name: 'Responsive Classes Applied Correctly',
          status: responsiveClasses.hasLgHidden ? 'PASS' : 'FAIL',
          details: `Has lg:hidden class: ${responsiveClasses.hasLgHidden}\nClasses: ${responsiveClasses.className}`
        });
      }

      // Test 4: Check touch-friendly sizing
      if (hamburgerButton && isVisible) {
        const touchSize = await this.page.evaluate((button) => {
          const rect = button.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            isTouchFriendly: rect.width >= 44 && rect.height >= 44
          };
        }, hamburgerButton);

        testResult.tests.push({
          name: 'Touch-Friendly Sizing',
          status: touchSize.isTouchFriendly ? 'PASS' : 'FAIL',
          details: `Size: ${touchSize.width}x${touchSize.height}px (minimum: 44x44px)`
        });
      }

      // Test 5: Check accessibility attributes
      const accessibility = await this.page.evaluate(() => {
        const button = document.querySelector('button[aria-label="Toggle mobile menu"]');
        if (!button) return null;
        
        return {
          ariaLabel: button.getAttribute('aria-label'),
          title: button.getAttribute('title'),
          role: button.getAttribute('role'),
          tabIndex: button.tabIndex
        };
      });

      if (accessibility) {
        testResult.tests.push({
          name: 'Accessibility Attributes',
          status: (accessibility.ariaLabel && accessibility.title) ? 'PASS' : 'FAIL',
          details: `aria-label: "${accessibility.ariaLabel}", title: "${accessibility.title}", role: "${accessibility.role}", tabIndex: ${accessibility.tabIndex}`
        });
      }

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

  async testHamburgerMenuClickFunctionality(testSize) {
    const { name, width, height } = testSize;
    console.log(`\n🖱️ Testing hamburger menu click functionality on ${name}`);
    
    const testResult = {
      screenSize: name,
      dimensions: `${width}x${height}`,
      tests: []
    };

    try {
      // Set viewport size
      await this.setViewportSize(width, height);

      // Only test on mobile sizes where hamburger should be visible
      if (width >= 1024) {
        testResult.tests.push({
          name: 'Skip Click Test on Desktop',
          status: 'SKIP',
          details: 'Hamburger menu should not be visible on desktop screens'
        });
        this.results.push(testResult);
        return testResult;
      }

      // Test 1: Find and click hamburger button
      const hamburgerButton = await this.page.$('button[aria-label="Toggle mobile menu"]');
      if (!hamburgerButton) {
        testResult.tests.push({
          name: 'Hamburger Button Available for Click Test',
          status: 'FAIL',
          details: 'Hamburger button not found'
        });
        this.results.push(testResult);
        return testResult;
      }

      // Check initial sidebar state
      const initialSidebarState = await this.page.evaluate(() => {
        const sidebar = document.querySelector('aside.sidebar-overlay');
        if (!sidebar) return { exists: false };
        
        const rect = sidebar.getBoundingClientRect();
        const transform = window.getComputedStyle(sidebar).transform;
        
        return {
          exists: true,
          visible: transform === 'matrix(1, 0, 0, 1, 0, 0)' || transform === 'none',
          transform: transform,
          position: rect.left
        };
      });

      // Test 2: Click hamburger button to open sidebar
      console.log('🖱️ Clicking hamburger button to open sidebar...');
      await hamburgerButton.click();
      await this.page.waitForTimeout(500); // Wait for animation

      const sidebarAfterClick = await this.page.evaluate(() => {
        const sidebar = document.querySelector('aside.sidebar-overlay');
        if (!sidebar) return { exists: false };
        
        const rect = sidebar.getBoundingClientRect();
        const transform = window.getComputedStyle(sidebar).transform;
        
        return {
          exists: true,
          visible: transform === 'matrix(1, 0, 0, 1, 0, 0)' || transform === 'none',
          transform: transform,
          position: rect.left
        };
      });

      const sidebarOpened = !initialSidebarState.visible && sidebarAfterClick.visible;
      
      testResult.tests.push({
        name: 'Hamburger Click Opens Sidebar',
        status: sidebarOpened ? 'PASS' : 'FAIL',
        details: `Initial state: ${initialSidebarState.visible ? 'Visible' : 'Hidden'}, After click: ${sidebarAfterClick.visible ? 'Visible' : 'Hidden'}`
      });

      // Test 3: Check overlay appears
      const overlayAfterClick = await this.page.evaluate(() => {
        const overlay = document.querySelector('div.sidebar-backdrop');
        if (!overlay) return { exists: false };
        
        return {
          exists: true,
          visible: window.getComputedStyle(overlay).display !== 'none',
          opacity: window.getComputedStyle(overlay).opacity
        };
      });

      testResult.tests.push({
        name: 'Overlay Appears When Sidebar Opens',
        status: overlayAfterClick.exists && overlayAfterClick.visible ? 'PASS' : 'FAIL',
        details: `Overlay exists: ${overlayAfterClick.exists}, Visible: ${overlayAfterClick.visible}, Opacity: ${overlayAfterClick.opacity}`
      });

      // Test 4: Click overlay to close sidebar
      if (overlayAfterClick.exists) {
        console.log('🖱️ Clicking overlay to close sidebar...');
        await this.page.click('div.sidebar-backdrop');
        await this.page.waitForTimeout(500);

        const sidebarAfterOverlayClick = await this.page.evaluate(() => {
          const sidebar = document.querySelector('aside.sidebar-overlay');
          if (!sidebar) return { exists: false };
          
          const transform = window.getComputedStyle(sidebar).transform;
          
          return {
            exists: true,
            visible: transform === 'matrix(1, 0, 0, 1, 0, 0)' || transform === 'none'
          };
        });

        const sidebarClosed = sidebarAfterClick.visible && !sidebarAfterOverlayClick.visible;
        
        testResult.tests.push({
          name: 'Overlay Click Closes Sidebar',
          status: sidebarClosed ? 'PASS' : 'FAIL',
          details: `Before overlay click: ${sidebarAfterClick.visible ? 'Visible' : 'Hidden'}, After: ${sidebarAfterOverlayClick.visible ? 'Visible' : 'Hidden'}`
        });
      }

      // Test 5: Click hamburger button again to reopen sidebar
      console.log('🖱️ Clicking hamburger button again to reopen sidebar...');
      await hamburgerButton.click();
      await this.page.waitForTimeout(500);

      const sidebarAfterSecondClick = await this.page.evaluate(() => {
        const sidebar = document.querySelector('aside.sidebar-overlay');
        if (!sidebar) return { exists: false };
        
        const transform = window.getComputedStyle(sidebar).transform;
        
        return {
          exists: true,
          visible: transform === 'matrix(1, 0, 0, 1, 0, 0)' || transform === 'none'
        };
      });

      const sidebarReopened = !sidebarAfterOverlayClick.visible && sidebarAfterSecondClick.visible;
      
      testResult.tests.push({
        name: 'Hamburger Click Reopens Sidebar',
        status: sidebarReopened ? 'PASS' : 'FAIL',
        details: `Before second click: ${sidebarAfterOverlayClick.visible ? 'Visible' : 'Hidden'}, After: ${sidebarAfterSecondClick.visible ? 'Visible' : 'Hidden'}`
      });

      // Test 6: Test close button in sidebar
      if (sidebarAfterSecondClick.visible) {
        console.log('🖱️ Clicking close button in sidebar...');
        const closeButton = await this.page.$('button[aria-label="Close menu"]');
        if (closeButton) {
          await closeButton.click();
          await this.page.waitForTimeout(500);

          const sidebarAfterCloseClick = await this.page.evaluate(() => {
            const sidebar = document.querySelector('aside.sidebar-overlay');
            if (!sidebar) return { exists: false };
            
            const transform = window.getComputedStyle(sidebar).transform;
            
            return {
              exists: true,
              visible: transform === 'matrix(1, 0, 0, 1, 0, 0)' || transform === 'none'
            };
          });

          const sidebarClosedByButton = sidebarAfterSecondClick.visible && !sidebarAfterCloseClick.visible;
          
          testResult.tests.push({
            name: 'Close Button in Sidebar Works',
            status: sidebarClosedByButton ? 'PASS' : 'FAIL',
            details: `Before close click: ${sidebarAfterSecondClick.visible ? 'Visible' : 'Hidden'}, After: ${sidebarAfterCloseClick.visible ? 'Visible' : 'Hidden'}`
          });
        } else {
          testResult.tests.push({
            name: 'Close Button in Sidebar Works',
            status: 'FAIL',
            details: 'Close button not found in sidebar'
          });
        }
      }

    } catch (error) {
      testResult.tests.push({
        name: 'Click Test Execution Error',
        status: 'FAIL',
        details: `Error: ${error.message}`
      });
    }

    this.results.push(testResult);
    return testResult;
  }

  async testNavigationWorkflow(testSize) {
    const { name, width, height } = testSize;
    console.log(`\n🧭 Testing navigation workflow on ${name}`);
    
    const testResult = {
      screenSize: name,
      dimensions: `${width}x${height}`,
      tests: []
    };

    try {
      // Set viewport size
      await this.setViewportSize(width, height);

      // Only test on mobile sizes where hamburger should be visible
      if (width >= 1024) {
        testResult.tests.push({
          name: 'Skip Navigation Test on Desktop',
          status: 'SKIP',
          details: 'Navigation workflow test only applies to mobile screens'
        });
        this.results.push(testResult);
        return testResult;
      }

      // Open sidebar
      const hamburgerButton = await this.page.$('button[aria-label="Toggle mobile menu"]');
      if (!hamburgerButton) {
        testResult.tests.push({
          name: 'Navigation Workflow Test',
          status: 'FAIL',
          details: 'Hamburger button not found'
        });
        this.results.push(testResult);
        return testResult;
      }

      await hamburgerButton.click();
      await this.page.waitForTimeout(500);

      // Test 1: Check navigation links are visible
      const navLinks = await this.page.evaluate(() => {
        const links = document.querySelectorAll('aside.sidebar-overlay a[href]');
        return Array.from(links).map(link => ({
          href: link.getAttribute('href'),
          text: link.textContent.trim(),
          visible: window.getComputedStyle(link).display !== 'none'
        }));
      });

      testResult.tests.push({
        name: 'Navigation Links Visible in Sidebar',
        status: navLinks.length > 0 ? 'PASS' : 'FAIL',
        details: `Found ${navLinks.length} navigation links: ${navLinks.map(l => l.text).join(', ')}`
      });

      // Test 2: Click a navigation link and verify sidebar closes
      if (navLinks.length > 0) {
        const firstLink = navLinks[0];
        console.log(`🧭 Clicking navigation link: ${firstLink.text}`);
        
        await this.page.click(`aside.sidebar-overlay a[href="${firstLink.href}"]`);
        await this.page.waitForTimeout(1000); // Wait for navigation and animation

        // Check if sidebar closed after navigation
        const sidebarAfterNavigation = await this.page.evaluate(() => {
          const sidebar = document.querySelector('aside.sidebar-overlay');
          if (!sidebar) return { exists: false };
          
          const transform = window.getComputedStyle(sidebar).transform;
          
          return {
            exists: true,
            visible: transform === 'matrix(1, 0, 0, 1, 0, 0)' || transform === 'none'
          };
        });

        testResult.tests.push({
          name: 'Sidebar Closes After Navigation',
          status: !sidebarAfterNavigation.visible ? 'PASS' : 'FAIL',
          details: `Sidebar ${sidebarAfterNavigation.visible ? 'still visible' : 'closed'} after clicking navigation link`
        });

        // Test 3: Verify navigation occurred
        const currentUrl = this.page.url();
        const navigatedCorrectly = currentUrl.includes(firstLink.href);
        
        testResult.tests.push({
          name: 'Navigation Link Works Correctly',
          status: navigatedCorrectly ? 'PASS' : 'FAIL',
          details: `Expected to navigate to ${firstLink.href}, Current URL: ${currentUrl}`
        });
      }

    } catch (error) {
      testResult.tests.push({
        name: 'Navigation Workflow Test Error',
        status: 'FAIL',
        details: `Error: ${error.message}`
      });
    }

    this.results.push(testResult);
    return testResult;
  }

  async takeScreenshot(testName, screenSize) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `hamburger-menu-${testName}-${screenSize}-${timestamp}.png`;
      const filepath = path.join(process.cwd(), filename);
      
      await this.page.screenshot({ 
        path: filepath,
        fullPage: true 
      });
      
      console.log(`📸 Screenshot saved: ${filename}`);
      return filename;
    } catch (error) {
      console.error('❌ Failed to take screenshot:', error.message);
      return null;
    }
  }

  async runAllTests() {
    console.log('\n🎯 Starting comprehensive hamburger menu testing...\n');

    // Navigate to the page first
    const navigationSuccess = await this.navigateToPage();
    if (!navigationSuccess) {
      console.error('❌ Failed to navigate to test page. Aborting tests.');
      return;
    }

    // Test each screen size
    for (const testSize of TEST_SIZES) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📱 Testing on ${testSize.name} (${testSize.width}x${testSize.height})`);
      console.log(`${'='.repeat(60)}`);

      // Test visibility
      await this.testHamburgerMenuVisibility(testSize);
      await this.takeScreenshot('visibility', testSize.name.toLowerCase().replace(/\s+/g, '-'));

      // Test click functionality
      await this.testHamburgerMenuClickFunctionality(testSize);
      await this.takeScreenshot('click-test', testSize.name.toLowerCase().replace(/\s+/g, '-'));

      // Test navigation workflow
      await this.testNavigationWorkflow(testSize);
      await this.takeScreenshot('navigation', testSize.name.toLowerCase().replace(/\s+/g, '-'));
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
    let skippedTests = 0;

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
        else skippedTests++;
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`Skipped: ${skippedTests} (${((skippedTests/totalTests)*100).toFixed(1)}%)`);
    
    const successRate = (passedTests / (totalTests - skippedTests)) * 100;
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
        skippedTests,
        successRate
      },
      results: this.results
    };

    const reportFilename = `hamburger-menu-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    require('fs').writeFileSync(reportFilename, JSON.stringify(reportData, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportFilename}`);
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
    console.log('✅ Cleanup completed');
  }
}

// Run the tests
async function main() {
  const tester = new HamburgerMenuTester();
  
  try {
    await tester.init();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = HamburgerMenuTester;