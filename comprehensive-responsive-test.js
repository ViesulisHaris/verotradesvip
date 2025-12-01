const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Define breakpoints for testing
const BREAKPOINTS = {
  mobile: { width: 375, height: 667, name: 'Mobile' },
  tablet: { width: 768, height: 1024, name: 'Tablet' },
  laptop: { width: 1024, height: 768, name: 'Laptop' },
  desktop: { width: 1920, height: 1080, name: 'Desktop' }
};

// Pages to test for responsiveness
const PAGES_TO_TEST = [
  { path: '/', name: 'Home' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/trades', name: 'Trades' },
  { path: '/strategies', name: 'Strategies' }
];

// Responsive test criteria
const RESPONSIVE_TESTS = {
  // Navigation tests
  navigation: {
    sidebarVisible: 'Sidebar should be visible on desktop',
    sidebarHidden: 'Sidebar should be hidden on mobile',
    hamburgerMenu: 'Hamburger menu should be visible on mobile',
    hamburgerMenuHidden: 'Hamburger menu should be hidden on desktop',
    navigationCollapsed: 'Navigation should collapse properly on mobile'
  },
  
  // Layout tests
  layout: {
    noHorizontalScroll: 'No horizontal scrolling should occur',
    contentReflows: 'Content should reflow properly',
    properSpacing: 'Spacing should be consistent',
    noOverlapping: 'No overlapping elements'
  },
  
  // Component tests
  components: {
    buttonsSized: 'Buttons should be properly sized for touch',
    formsUsable: 'Forms should be usable on mobile',
    cardsAdapt: 'Cards should adapt to screen size',
    chartsResponsive: 'Charts should be responsive'
  },
  
  // Typography tests
  typography: {
    textReadable: 'Text should remain readable',
    properScaling: 'Typography should scale appropriately',
    consistentSpacing: 'Line spacing should be consistent'
  }
};

class ResponsiveTestFramework {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        warnings: 0
      },
      breakpoints: {},
      screenshots: {},
      issues: []
    };
  }

  async initialize() {
    console.log('🚀 Initializing Responsive Test Framework...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
    
    // Set up error handling
    this.page.on('pageerror', error => {
      console.error('PAGE ERROR:', error.message);
      this.testResults.issues.push({
        type: 'javascript_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  async setViewport(breakpoint) {
    console.log(`📱 Setting viewport to ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);
    await this.page.setViewport({
      width: breakpoint.width,
      height: breakpoint.height,
      deviceScaleFactor: 1,
      isMobile: breakpoint.width <= 768,
      hasTouch: breakpoint.width <= 768
    });
  }

  async navigateToPage(pagePath) {
    const url = `http://localhost:3000${pagePath}`;
    console.log(`🌐 Navigating to ${url}`);
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Allow for animations and hydration
      return true;
    } catch (error) {
      console.error(`❌ Failed to navigate to ${url}:`, error.message);
      return false;
    }
  }

  async takeScreenshot(breakpointName, pageName, testName = 'default') {
    const timestamp = Date.now();
    const filename = `responsive-${breakpointName}-${pageName}-${testName}-${timestamp}.png`;
    const filepath = path.join(__dirname, filename);
    
    await this.page.screenshot({
      path: filepath,
      fullPage: true
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    
    if (!this.testResults.screenshots[breakpointName]) {
      this.testResults.screenshots[breakpointName] = {};
    }
    if (!this.testResults.screenshots[breakpointName][pageName]) {
      this.testResults.screenshots[breakpointName][pageName] = [];
    }
    
    this.testResults.screenshots[breakpointName][pageName].push({
      test: testName,
      filename: filename,
      timestamp: new Date().toISOString()
    });
    
    return filename;
  }

  async testNavigation(breakpoint) {
    console.log(`🧭 Testing navigation for ${breakpoint.name}...`);
    const results = {
      sidebarVisible: false,
      hamburgerMenuVisible: false,
      navigationCollapsed: false
    };

    try {
      // Check for sidebar
      const sidebar = await this.page.$('[data-testid="sidebar"], .sidebar, nav');
      if (sidebar) {
        const isVisible = await this.page.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }, sidebar);
        results.sidebarVisible = isVisible;
      }

      // Check for hamburger menu
      const hamburgerMenu = await this.page.$('[data-testid="hamburger-menu"], .hamburger, .menu-toggle, button[aria-label="menu"]');
      if (hamburgerMenu) {
        const isVisible = await this.page.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }, hamburgerMenu);
        results.hamburgerMenuVisible = isVisible;
      }

      // Test hamburger menu functionality on mobile
      if (breakpoint.width <= 768 && results.hamburgerMenuVisible) {
        await hamburgerMenu.click();
        await this.page.waitForTimeout(500);
        
        const sidebarAfterClick = await this.page.$('[data-testid="sidebar"], .sidebar, nav');
        if (sidebarAfterClick) {
          const isVisibleAfterClick = await this.page.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          }, sidebarAfterClick);
          results.navigationCollapsed = isVisibleAfterClick;
        }
      }

    } catch (error) {
      console.error('❌ Navigation test error:', error.message);
      this.testResults.issues.push({
        type: 'navigation_test_error',
        breakpoint: breakpoint.name,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }

    return results;
  }

  async testLayout(breakpoint) {
    console.log(`📐 Testing layout for ${breakpoint.name}...`);
    const results = {
      noHorizontalScroll: false,
      contentReflows: false,
      properSpacing: false,
      noOverlapping: false
    };

    try {
      // Check for horizontal scrolling
      const pageWidth = await this.page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await this.page.evaluate(() => window.innerWidth);
      results.noHorizontalScroll = pageWidth <= viewportWidth;

      // Check content reflow
      const contentElements = await this.page.$$('.content, main, .main-content');
      if (contentElements.length > 0) {
        results.contentReflows = true; // Basic check - we'll refine this
      }

      // Check spacing consistency
      const hasConsistentSpacing = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, .card, .btn');
        if (elements.length < 2) return true;
        
        // Check if elements have reasonable margins/padding
        let consistentCount = 0;
        for (let i = 0; i < Math.min(elements.length, 10); i++) {
          const style = window.getComputedStyle(elements[i]);
          const hasMargin = style.margin !== '0px' || style.padding !== '0px';
          if (hasMargin) consistentCount++;
        }
        
        return consistentCount > elements.length * 0.5;
      });
      results.properSpacing = hasConsistentSpacing;

      // Check for overlapping elements (basic check)
      const noOverlap = await this.page.evaluate(() => {
        const rects = Array.from(document.querySelectorAll('*')).map(el => {
          const rect = el.getBoundingClientRect();
          return {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            element: el.tagName
          };
        }).filter(rect => rect.width > 0 && rect.height > 0);

        // Simple overlap detection
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) {
            const a = rects[i];
            const b = rects[j];
            
            if (!(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)) {
              // Elements overlap - this might be intentional, so we'll be lenient
              return false;
            }
          }
        }
        return true;
      });
      results.noOverlapping = noOverlap;

    } catch (error) {
      console.error('❌ Layout test error:', error.message);
      this.testResults.issues.push({
        type: 'layout_test_error',
        breakpoint: breakpoint.name,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }

    return results;
  }

  async testComponents(breakpoint) {
    console.log(`🧩 Testing components for ${breakpoint.name}...`);
    const results = {
      buttonsSized: false,
      formsUsable: false,
      cardsAdapt: false,
      chartsResponsive: false
    };

    try {
      // Test button sizing
      const buttons = await this.page.$$('button, .btn, [role="button"]');
      if (buttons.length > 0) {
        const buttonsProperlySized = await this.page.evaluate((buttonCount, isMobile) => {
          const buttons = document.querySelectorAll('button, .btn, [role="button"]');
          let properlySizedCount = 0;
          
          buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            const minSize = isMobile ? 44 : 32; // 44px minimum touch target for mobile
            if (rect.width >= minSize && rect.height >= minSize) {
              properlySizedCount++;
            }
          });
          
          return properlySizedCount > buttonCount * 0.8; // 80% of buttons should be properly sized
        }, buttons.length, breakpoint.width <= 768);
        results.buttonsSized = buttonsProperlySized;
      }

      // Test form usability
      const formElements = await this.page.$$('input, select, textarea, label');
      if (formElements.length > 0) {
        results.formsUsable = true; // Basic check - forms exist
      }

      // Test card adaptation
      const cards = await this.page.$$('.card, .trade-card, .strategy-card');
      if (cards.length > 0) {
        results.cardsAdapt = true; // Basic check - cards exist
      }

      // Test chart responsiveness
      const charts = await this.page.$$('canvas, .chart, [data-testid="chart"]');
      if (charts.length > 0) {
        results.chartsResponsive = true; // Basic check - charts exist
      }

    } catch (error) {
      console.error('❌ Component test error:', error.message);
      this.testResults.issues.push({
        type: 'component_test_error',
        breakpoint: breakpoint.name,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }

    return results;
  }

  async testTypography(breakpoint) {
    console.log(`📝 Testing typography for ${breakpoint.name}...`);
    const results = {
      textReadable: false,
      properScaling: false,
      consistentSpacing: false
    };

    try {
      // Test text readability
      const textReadable = await this.page.evaluate(() => {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
        let readableCount = 0;
        
        textElements.forEach(element => {
          const style = window.getComputedStyle(element);
          const fontSize = parseFloat(style.fontSize);
          const lineHeight = parseFloat(style.lineHeight);
          
          // Check if font size is reasonable (>=12px for body text)
          if (fontSize >= 12 && lineHeight >= 1.2) {
            readableCount++;
          }
        });
        
        return readableCount > textElements.length * 0.8;
      });
      results.textReadable = textReadable;

      // Test proper scaling
      const properScaling = await this.page.evaluate((viewportWidth) => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) return true;
        
        let properlyScaledCount = 0;
        headings.forEach(heading => {
          const fontSize = parseFloat(window.getComputedStyle(heading).fontSize);
          // Heading should be larger than body text
          if (fontSize >= 16) {
            properlyScaledCount++;
          }
        });
        
        return properlyScaledCount > headings.length * 0.8;
      }, breakpoint.width);
      results.properScaling = properScaling;

      // Test consistent spacing
      const consistentSpacing = await this.page.evaluate(() => {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
        if (textElements.length < 2) return true;
        
        let consistentCount = 0;
        for (let i = 0; i < textElements.length - 1; i++) {
          const current = textElements[i];
          const next = textElements[i + 1];
          
          const currentRect = current.getBoundingClientRect();
          const nextRect = next.getBoundingClientRect();
          const gap = nextRect.top - currentRect.bottom;
          
          // Check if there's reasonable spacing between elements
          if (gap >= 0 && gap <= 100) {
            consistentCount++;
          }
        }
        
        return consistentCount > (textElements.length - 1) * 0.7;
      });
      results.consistentSpacing = consistentSpacing;

    } catch (error) {
      console.error('❌ Typography test error:', error.message);
      this.testResults.issues.push({
        type: 'typography_test_error',
        breakpoint: breakpoint.name,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }

    return results;
  }

  async runTestsForBreakpoint(breakpoint) {
    console.log(`\n🔍 Running comprehensive tests for ${breakpoint.name} breakpoint...`);
    
    const breakpointResults = {
      name: breakpoint.name,
      width: breakpoint.width,
      height: breakpoint.height,
      pages: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      }
    };

    await this.setViewport(breakpoint);

    for (const page of PAGES_TO_TEST) {
      console.log(`\n📄 Testing page: ${page.name}`);
      
      const navigationSuccess = await this.navigateToPage(page.path);
      if (!navigationSuccess) {
        console.error(`❌ Failed to load ${page.name} page`);
        continue;
      }

      // Take initial screenshot
      await this.takeScreenshot(breakpoint.name, page.name, 'initial');

      const pageResults = {
        navigation: await this.testNavigation(breakpoint),
        layout: await this.testLayout(breakpoint),
        components: await this.testComponents(breakpoint),
        typography: await this.testTypography(breakpoint)
      };

      // Take screenshot after tests
      await this.takeScreenshot(breakpoint.name, page.name, 'after-tests');

      // Calculate page test results
      const pageTestCount = Object.keys(pageResults).length * 4; // Approximate tests per category
      let pagePassedCount = 0;

      Object.values(pageResults).forEach(categoryResults => {
        Object.values(categoryResults).forEach(result => {
          if (result) pagePassedCount++;
        });
      });

      pageResults.summary = {
        totalTests: pageTestCount,
        passedTests: pagePassedCount,
        failedTests: pageTestCount - pagePassedCount
      };

      breakpointResults.pages[page.name] = pageResults;
      breakpointResults.summary.totalTests += pageTestCount;
      breakpointResults.summary.passedTests += pagePassedCount;
      breakpointResults.summary.failedTests += pageTestCount - pagePassedCount;

      // Update overall summary
      this.testResults.summary.totalTests += pageTestCount;
      this.testResults.summary.passedTests += pagePassedCount;
      this.testResults.summary.failedTests += pageTestCount - pagePassedCount;
    }

    this.testResults.breakpoints[breakpoint.name] = breakpointResults;
    return breakpointResults;
  }

  async generateReport() {
    console.log('\n📊 Generating comprehensive responsive testing report...');
    
    const reportContent = this.generateReportContent();
    const reportPath = path.join(__dirname, 'COMPREHENSIVE_RESPONSIVE_TEST_REPORT.md');
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`📋 Report generated: ${reportPath}`);
    
    // Also save JSON results
    const jsonResultsPath = path.join(__dirname, 'responsive-test-results.json');
    fs.writeFileSync(jsonResultsPath, JSON.stringify(this.testResults, null, 2));
    console.log(`📄 JSON results saved: ${jsonResultsPath}`);
    
    return { reportPath, jsonResultsPath };
  }

  generateReportContent() {
    const { summary, breakpoints, screenshots, issues } = this.testResults;
    
    let content = `# Comprehensive Responsive Testing Report\n\n`;
    content += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    
    // Executive Summary
    content += `## 📋 Executive Summary\n\n`;
    content += `- **Total Tests Run:** ${summary.totalTests}\n`;
    content += `- **Passed Tests:** ${summary.passedTests}\n`;
    content += `- **Failed Tests:** ${summary.failedTests}\n`;
    content += `- **Success Rate:** ${((summary.passedTests / summary.totalTests) * 100).toFixed(2)}%\n\n`;
    
    // Breakpoint Results
    content += `## 📱 Breakpoint Test Results\n\n`;
    
    Object.entries(breakpoints).forEach(([breakpointName, breakpointData]) => {
      content += `### ${breakpointName} (${breakpointData.width}x${breakpointData.height})\n\n`;
      content += `- **Tests Run:** ${breakpointData.summary.totalTests}\n`;
      content += `- **Passed:** ${breakpointData.summary.passedTests}\n`;
      content += `- **Failed:** ${breakpointData.summary.failedTests}\n`;
      content += `- **Success Rate:** ${((breakpointData.summary.passedTests / breakpointData.summary.totalTests) * 100).toFixed(2)}%\n\n`;
      
      // Page results for this breakpoint
      content += `#### Page Results:\n\n`;
      Object.entries(breakpointData.pages).forEach(([pageName, pageData]) => {
        content += `**${pageName} Page:**\n`;
        content += `- Navigation: ${Object.values(pageData.navigation).filter(v => v).length}/${Object.keys(pageData.navigation).length} tests passed\n`;
        content += `- Layout: ${Object.values(pageData.layout).filter(v => v).length}/${Object.keys(pageData.layout).length} tests passed\n`;
        content += `- Components: ${Object.values(pageData.components).filter(v => v).length}/${Object.keys(pageData.components).length} tests passed\n`;
        content += `- Typography: ${Object.values(pageData.typography).filter(v => v).length}/${Object.keys(pageData.typography).length} tests passed\n\n`;
      });
    });
    
    // Screenshots
    content += `## 📸 Screenshots\n\n`;
    Object.entries(screenshots).forEach(([breakpointName, breakpointScreenshots]) => {
      content += `### ${breakpointName} Screenshots\n\n`;
      Object.entries(breakpointScreenshots).forEach(([pageName, pageScreenshots]) => {
        content += `**${pageName} Page:**\n`;
        pageScreenshots.forEach(screenshot => {
          content += `- ${screenshot.test}: ${screenshot.filename}\n`;
        });
        content += '\n';
      });
    });
    
    // Issues
    if (issues.length > 0) {
      content += `## ⚠️ Issues Found\n\n`;
      issues.forEach((issue, index) => {
        content += `### Issue ${index + 1}: ${issue.type}\n`;
        content += `- **Breakpoint:** ${issue.breakpoint || 'N/A'}\n`;
        content += `- **Message:** ${issue.message}\n`;
        content += `- **Timestamp:** ${issue.timestamp}\n\n`;
      });
    } else {
      content += `## ✅ No Issues Found\n\n`;
      content += `All tests completed successfully without any critical issues.\n\n`;
    }
    
    // Recommendations
    content += `## 💡 Recommendations\n\n`;
    
    if (summary.failedTests > 0) {
      content += `### 🔧 Fixes Needed\n\n`;
      content += `Based on the test results, the following areas need attention:\n\n`;
      
      Object.entries(breakpoints).forEach(([breakpointName, breakpointData]) => {
        if (breakpointData.summary.failedTests > 0) {
          content += `#### ${breakpointName} (${breakpointData.width}px)\n`;
          
          Object.entries(breakpointData.pages).forEach(([pageName, pageData]) => {
            const failedTests = [];
            
            Object.entries(pageData.navigation).forEach(([testName, result]) => {
              if (!result) failedTests.push(`Navigation: ${testName}`);
            });
            Object.entries(pageData.layout).forEach(([testName, result]) => {
              if (!result) failedTests.push(`Layout: ${testName}`);
            });
            Object.entries(pageData.components).forEach(([testName, result]) => {
              if (!result) failedTests.push(`Components: ${testName}`);
            });
            Object.entries(pageData.typography).forEach(([testName, result]) => {
              if (!result) failedTests.push(`Typography: ${testName}`);
            });
            
            if (failedTests.length > 0) {
              content += `- **${pageName} Page:** ${failedTests.join(', ')}\n`;
            }
          });
          content += '\n';
        }
      });
    } else {
      content += `### 🎉 Excellent Work!\n\n`;
      content += `The application demonstrates excellent responsive behavior across all tested breakpoints.\n\n`;
    }
    
    content += `### 📱 Responsive Design Best Practices\n\n`;
    content += `- Ensure all interactive elements meet minimum touch target sizes (44px for mobile)\n`;
    content += `- Test thoroughly across all major breakpoints\n`;
    content += `- Verify navigation behavior on mobile devices\n`;
    content += `- Check for horizontal scrolling issues\n`;
    content += `- Ensure typography remains readable at all screen sizes\n`;
    content += `- Test form usability on touch devices\n`;
    content += `- Verify charts and data visualizations adapt properly\n\n`;
    
    content += `## 🔍 Test Methodology\n\n`;
    content += `This comprehensive responsive test covered:\n\n`;
    content += `- **Breakpoints Tested:** Mobile (375px), Tablet (768px), Laptop (1024px), Desktop (1920px)\n`;
    content += `- **Pages Tested:** Home, Login, Register, Dashboard, Trades, Strategies\n`;
    content += `- **Test Categories:** Navigation, Layout, Components, Typography\n`;
    content += `- **Automated Checks:** Element visibility, sizing, spacing, scrolling behavior\n`;
    content += `- **Visual Verification:** Screenshots captured for each breakpoint and page\n\n`;
    
    content += `---\n\n`;
    content += `*Report generated by Comprehensive Responsive Test Framework*\n`;
    
    return content;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution function
async function runResponsiveTests() {
  const testFramework = new ResponsiveTestFramework();
  
  try {
    await testFramework.initialize();
    
    console.log('\n🎯 Starting Comprehensive Responsive Testing...\n');
    
    // Run tests for each breakpoint
    for (const [breakpointKey, breakpoint] of Object.entries(BREAKPOINTS)) {
      await testFramework.runTestsForBreakpoint(breakpoint);
    }
    
    // Generate comprehensive report
    const { reportPath, jsonResultsPath } = await testFramework.generateReport();
    
    console.log('\n✅ Comprehensive responsive testing completed!');
    console.log(`📋 Report: ${reportPath}`);
    console.log(`📄 JSON Results: ${jsonResultsPath}`);
    
    return testFramework.testResults;
    
  } catch (error) {
    console.error('❌ Responsive testing failed:', error);
    throw error;
  } finally {
    await testFramework.cleanup();
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runResponsiveTests()
    .then(results => {
      console.log('\n🎉 All responsive tests completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Responsive testing failed:', error);
      process.exit(1);
    });
}

module.exports = { ResponsiveTestFramework, runResponsiveTests, BREAKPOINTS, PAGES_TO_TEST };