const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Sidebar UI Consistency Test
 * 
 * This test verifies that the sidebar UI is consistent across all pages
 * after the fix that implemented UnifiedSidebar across the application.
 */

class SidebarUIConsistencyTest {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = {
      navigationFlow: {},
      settingsLinkFunctionality: {},
      responsiveBehavior: {},
      authenticationFlow: {},
      consoleErrors: [],
      layoutIssues: [],
      screenshots: {},
      summary: {
        passed: 0,
        failed: 0,
        total: 0
      }
    };
    this.screenshotDir = path.join(__dirname, 'sidebar-test-screenshots');
    
    // Create screenshot directory if it doesn't exist
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async init() {
    console.log('🚀 Initializing Sidebar UI Consistency Test...');
    
    this.browser = await chromium.launch({ 
      headless: false, // Set to false for visual verification
      slowMo: 500 // Slow down actions for better observation
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      // Ignore HTTPS errors for local development
      ignoreHTTPSErrors: true
    });
    
    this.page = await this.context.newPage();
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.testResults.consoleErrors.push({
          message: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Listen for page errors
    this.page.on('pageerror', error => {
      this.testResults.consoleErrors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
  }

  async login() {
    console.log('🔐 Logging in to test authenticated features...');
    
    try {
      // Navigate to login page
      await this.page.goto('http://localhost:3000/login');
      await this.page.waitForLoadState('networkidle');
      
      // Take screenshot of login page
      await this.takeScreenshot('login-page');
      
      // Fill in login credentials (using test credentials)
      await this.page.fill('input[type="email"]', 'test@example.com');
      await this.page.fill('input[type="password"]', 'testpassword123');
      
      // Click login button
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await this.page.waitForURL('**/dashboard', { timeout: 10000 });
      await this.page.waitForLoadState('networkidle');
      
      console.log('✅ Login successful');
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      await this.takeScreenshot('login-failed');
      return false;
    }
  }

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    
    await this.page.screenshot({ 
      path: filepath,
      fullPage: true
    });
    
    this.testResults.screenshots[name] = filepath;
    console.log(`📸 Screenshot saved: ${filename}`);
  }

  async testNavigationFlow() {
    console.log('🧭 Testing navigation flow between pages...');
    
    const pages = [
      '/dashboard',
      '/trades',
      '/log-trade',
      '/calendar',
      '/strategies',
      '/analytics',
      '/settings'
    ];
    
    for (const pagePath of pages) {
      try {
        console.log(`📍 Testing navigation to ${pagePath}...`);
        
        // Navigate to page
        await this.page.goto(`http://localhost:3000${pagePath}`);
        await this.page.waitForLoadState('networkidle');
        
        // Take screenshot
        await this.takeScreenshot(`page-${pagePath.replace('/', '-')}`);
        
        // Check if UnifiedSidebar is present
        const sidebarExists = await this.page.locator('aside').count() > 0;
        
        // Check for Settings link in sidebar
        const settingsLinkExists = await this.page.locator('a[href="/settings"]').count() > 0;
        
        // Check sidebar styling (UnifiedSidebar vs old Sidebar)
        const sidebarElement = await this.page.locator('aside').first();
        const hasUnifiedStyling = await sidebarElement.evaluate(el => {
          return el.classList.contains('bg-[#121212]') || 
                 el.style.backgroundColor === 'rgb(18, 18, 18)' ||
                 el.style.backgroundColor === '#121212';
        });
        
        // Check for navigation items
        const navItems = await this.page.locator('nav a').count();
        
        this.testResults.navigationFlow[pagePath] = {
          sidebarExists,
          settingsLinkExists,
          hasUnifiedStyling,
          navItemsCount: navItems,
          passed: sidebarExists && settingsLinkExists && hasUnifiedStyling
        };
        
        if (this.testResults.navigationFlow[pagePath].passed) {
          console.log(`✅ ${pagePath} - Navigation flow test passed`);
        } else {
          console.log(`❌ ${pagePath} - Navigation flow test failed`);
        }
        
        // Wait a moment before next navigation
        await this.page.waitForTimeout(1000);
        
      } catch (error) {
        console.error(`❌ Error testing ${pagePath}:`, error.message);
        this.testResults.navigationFlow[pagePath] = {
          error: error.message,
          passed: false
        };
      }
    }
  }

  async testSettingsLinkFunctionality() {
    console.log('⚙️ Testing Settings link functionality from different pages...');
    
    const testPages = [
      '/dashboard',
      '/trades',
      '/strategies',
      '/analytics'
    ];
    
    for (const pagePath of testPages) {
      try {
        console.log(`🔗 Testing Settings link from ${pagePath}...`);
        
        // Navigate to test page
        await this.page.goto(`http://localhost:3000${pagePath}`);
        await this.page.waitForLoadState('networkidle');
        
        // Find and click Settings link
        const settingsLink = this.page.locator('a[href="/settings"]').first();
        const isVisible = await settingsLink.isVisible();
        
        if (isVisible) {
          // Take screenshot before clicking
          await this.takeScreenshot(`settings-link-before-${pagePath.replace('/', '-')}`);
          
          // Click Settings link
          await settingsLink.click();
          
          // Wait for navigation to settings
          await this.page.waitForURL('**/settings', { timeout: 5000 });
          await this.page.waitForLoadState('networkidle');
          
          // Take screenshot after navigation
          await this.takeScreenshot(`settings-page-from-${pagePath.replace('/', '-')}`);
          
          // Verify we're on settings page
          const currentUrl = this.page.url();
          const navigatedToSettings = currentUrl.includes('/settings');
          
          this.testResults.settingsLinkFunctionality[pagePath] = {
            linkVisible: isVisible,
            navigatedToSettings,
            currentUrl,
            passed: isVisible && navigatedToSettings
          };
          
          if (this.testResults.settingsLinkFunctionality[pagePath].passed) {
            console.log(`✅ Settings link from ${pagePath} works correctly`);
          } else {
            console.log(`❌ Settings link from ${pagePath} failed`);
          }
        } else {
          this.testResults.settingsLinkFunctionality[pagePath] = {
            linkVisible: false,
            passed: false
          };
          console.log(`❌ Settings link not visible on ${pagePath}`);
        }
        
      } catch (error) {
        console.error(`❌ Error testing Settings link from ${pagePath}:`, error.message);
        this.testResults.settingsLinkFunctionality[pagePath] = {
          error: error.message,
          passed: false
        };
      }
    }
  }

  async testResponsiveBehavior() {
    console.log('📱 Testing responsive behavior on different viewports...');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 },
      { name: 'Large Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      try {
        console.log(`📐 Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
        
        // Set viewport
        await this.page.setViewportSize(viewport);
        
        // Navigate to dashboard
        await this.page.goto('http://localhost:3000/dashboard');
        await this.page.waitForLoadState('networkidle');
        
        // Take screenshot
        await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);
        
        // Check sidebar visibility
        const sidebarExists = await this.page.locator('aside').count() > 0;
        
        // Check mobile menu button (should be visible on mobile)
        const mobileMenuButton = await this.page.locator('button[aria-label*="menu"], button:has([class*="menu"])').isVisible();
        
        // Check Settings link visibility
        const settingsLinkVisible = await this.page.locator('a[href="/settings"]').isVisible();
        
        // Check sidebar collapsed state
        const sidebarElement = await this.page.locator('aside').first();
        const sidebarWidth = await sidebarElement.evaluate(el => {
          return el.offsetWidth;
        });
        
        this.testResults.responsiveBehavior[viewport.name] = {
          sidebarExists,
          mobileMenuButton,
          settingsLinkVisible,
          sidebarWidth,
          isMobile: viewport.width < 768,
          passed: sidebarExists && settingsLinkVisible
        };
        
        if (this.testResults.responsiveBehavior[viewport.name].passed) {
          console.log(`✅ ${viewport.name} responsive test passed`);
        } else {
          console.log(`❌ ${viewport.name} responsive test failed`);
        }
        
      } catch (error) {
        console.error(`❌ Error testing ${viewport.name}:`, error.message);
        this.testResults.responsiveBehavior[viewport.name] = {
          error: error.message,
          passed: false
        };
      }
    }
    
    // Reset to desktop viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async testAuthenticationFlow() {
    console.log('🔐 Testing authentication flow with new layout...');
    
    try {
      // Test logout
      console.log('🚪 Testing logout functionality...');
      
      // Navigate to dashboard
      await this.page.goto('http://localhost:3000/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      // Look for logout button/link
      const logoutButton = this.page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
      const logoutExists = await logoutButton.count() > 0;
      
      if (logoutExists) {
        await this.takeScreenshot('before-logout');
        
        await logoutButton.click();
        
        // Wait for redirect to login page
        await this.page.waitForURL('**/login', { timeout: 5000 });
        await this.page.waitForLoadState('networkidle');
        
        await this.takeScreenshot('after-logout');
        
        const currentUrl = this.page.url();
        const loggedOutSuccessfully = currentUrl.includes('/login');
        
        this.testResults.authenticationFlow.logout = {
          logoutButtonExists: logoutExists,
          loggedOutSuccessfully,
          finalUrl: currentUrl,
          passed: loggedOutSuccessfully
        };
        
        if (loggedOutSuccessfully) {
          console.log('✅ Logout test passed');
        } else {
          console.log('❌ Logout test failed');
        }
        
        // Test login again to verify authentication still works
        console.log('🔑 Testing re-login after logout...');
        const loginSuccess = await this.login();
        
        this.testResults.authenticationFlow.relogin = {
          success: loginSuccess,
          passed: loginSuccess
        };
        
      } else {
        this.testResults.authenticationFlow.logout = {
          logoutButtonExists: false,
          passed: false
        };
        console.log('❌ Logout button not found');
      }
      
    } catch (error) {
      console.error('❌ Error testing authentication flow:', error.message);
      this.testResults.authenticationFlow.error = error.message;
    }
  }

  async checkForLayoutIssues() {
    console.log('🔍 Checking for layout issues and console errors...');
    
    try {
      // Navigate to each page and check for layout issues
      const pages = ['/dashboard', '/settings', '/trades', '/strategies'];
      
      for (const pagePath of pages) {
        await this.page.goto(`http://localhost:3000${pagePath}`);
        await this.page.waitForLoadState('networkidle');
        
        // Check for duplicate sidebars
        const sidebarCount = await this.page.locator('aside').count();
        
        // Check for duplicate navigation menus
        const navCount = await this.page.locator('nav').count();
        
        // Check for any overlapping elements
        const overlappingElements = await this.page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          const rects = elements.map(el => el.getBoundingClientRect());
          // Simple check for elements with same position
          const positions = rects.map(r => `${r.left},${r.top},${r.width},${r.height}`);
          const duplicates = positions.filter((pos, index) => positions.indexOf(pos) !== index);
          return duplicates.length;
        });
        
        // Check for horizontal scrollbars (indicates layout issues)
        const hasHorizontalScrollbar = await this.page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        this.testResults.layoutIssues[pagePath] = {
          sidebarCount,
          navCount,
          overlappingElements,
          hasHorizontalScrollbar,
          passed: sidebarCount === 1 && navCount >= 1 && !hasHorizontalScrollbar
        };
        
        if (this.testResults.layoutIssues[pagePath].passed) {
          console.log(`✅ ${pagePath} - No layout issues detected`);
        } else {
          console.log(`❌ ${pagePath} - Layout issues detected`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error checking layout issues:', error.message);
      this.testResults.layoutIssues.error = error.message;
    }
  }

  calculateResults() {
    console.log('📊 Calculating test results...');
    
    let totalTests = 0;
    let passedTests = 0;
    
    // Count navigation flow tests
    Object.values(this.testResults.navigationFlow).forEach(result => {
      totalTests++;
      if (result.passed) passedTests++;
    });
    
    // Count settings link tests
    Object.values(this.testResults.settingsLinkFunctionality).forEach(result => {
      totalTests++;
      if (result.passed) passedTests++;
    });
    
    // Count responsive behavior tests
    Object.values(this.testResults.responsiveBehavior).forEach(result => {
      totalTests++;
      if (result.passed) passedTests++;
    });
    
    // Count authentication flow tests
    Object.values(this.testResults.authenticationFlow).forEach(result => {
      if (typeof result === 'object' && result.passed !== undefined) {
        totalTests++;
        if (result.passed) passedTests++;
      }
    });
    
    // Count layout issue tests
    Object.values(this.testResults.layoutIssues).forEach(result => {
      if (typeof result === 'object' && result.passed !== undefined) {
        totalTests++;
        if (result.passed) passedTests++;
      }
    });
    
    this.testResults.summary = {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      passRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) + '%' : '0%'
    };
  }

  async generateReport() {
    console.log('📋 Generating test report...');
    
    this.calculateResults();
    
    const report = {
      timestamp: new Date().toISOString(),
      testType: 'Sidebar UI Consistency Test',
      summary: this.testResults.summary,
      results: this.testResults,
      screenshots: Object.keys(this.testResults.screenshots),
      consoleErrors: this.testResults.consoleErrors
    };
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'sidebar-ui-consistency-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(__dirname, 'SIDEBAR_UI_CONSISTENCY_TEST_REPORT.md');
    fs.writeFileSync(markdownPath, markdownReport);
    
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    console.log(`📝 Markdown report saved to: ${markdownPath}`);
    
    return report;
  }

  generateMarkdownReport(report) {
    const { summary, results } = report;
    
    let markdown = `# Sidebar UI Consistency Test Report\n\n`;
    markdown += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- **Total Tests:** ${summary.total}\n`;
    markdown += `- **Passed:** ${summary.passed}\n`;
    markdown += `- **Failed:** ${summary.failed}\n`;
    markdown += `- **Pass Rate:** ${summary.passRate}\n\n`;
    
    markdown += `## Test Results\n\n`;
    
    // Navigation Flow
    markdown += `### 1. Navigation Flow Tests\n\n`;
    markdown += `| Page | Sidebar Exists | Settings Link | Unified Styling | Navigation Items | Status |\n`;
    markdown += `|------|----------------|---------------|-----------------|-----------------|--------|\n`;
    
    Object.entries(results.navigationFlow).forEach(([page, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      markdown += `| ${page} | ${result.sidebarExists || 'N/A'} | ${result.settingsLinkExists || 'N/A'} | ${result.hasUnifiedStyling || 'N/A'} | ${result.navItemsCount || 'N/A'} | ${status} |\n`;
    });
    
    // Settings Link Functionality
    markdown += `\n### 2. Settings Link Functionality Tests\n\n`;
    markdown += `| From Page | Link Visible | Navigated to Settings | Status |\n`;
    markdown += `|-----------|--------------|----------------------|--------|\n`;
    
    Object.entries(results.settingsLinkFunctionality).forEach(([page, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      markdown += `| ${page} | ${result.linkVisible || 'N/A'} | ${result.navigatedToSettings || 'N/A'} | ${status} |\n`;
    });
    
    // Responsive Behavior
    markdown += `\n### 3. Responsive Behavior Tests\n\n`;
    markdown += `| Viewport | Sidebar Exists | Mobile Menu | Settings Link | Sidebar Width | Status |\n`;
    markdown += `|----------|----------------|-------------|---------------|---------------|--------|\n`;
    
    Object.entries(results.responsiveBehavior).forEach(([viewport, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      markdown += `| ${viewport} | ${result.sidebarExists || 'N/A'} | ${result.mobileMenuButton || 'N/A'} | ${result.settingsLinkVisible || 'N/A'} | ${result.sidebarWidth || 'N/A'}px | ${status} |\n`;
    });
    
    // Authentication Flow
    markdown += `\n### 4. Authentication Flow Tests\n\n`;
    Object.entries(results.authenticationFlow).forEach(([test, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      markdown += `**${test}:** ${status}\n`;
      if (typeof result === 'object' && result !== null) {
        Object.entries(result).forEach(([key, value]) => {
          if (key !== 'passed') {
            markdown += `- ${key}: ${value}\n`;
          }
        });
      }
      markdown += `\n`;
    });
    
    // Layout Issues
    markdown += `### 5. Layout Issues Tests\n\n`;
    markdown += `| Page | Sidebar Count | Nav Count | Overlapping Elements | Horizontal Scrollbar | Status |\n`;
    markdown += `|------|---------------|-----------|---------------------|---------------------|--------|\n`;
    
    Object.entries(results.layoutIssues).forEach(([page, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      markdown += `| ${page} | ${result.sidebarCount || 'N/A'} | ${result.navCount || 'N/A'} | ${result.overlappingElements || 'N/A'} | ${result.hasHorizontalScrollbar || 'N/A'} | ${status} |\n`;
    });
    
    // Console Errors
    if (report.consoleErrors.length > 0) {
      markdown += `\n### 6. Console Errors\n\n`;
      report.consoleErrors.forEach(error => {
        markdown += `**Error:** ${error.message}\n`;
        if (error.location) {
          markdown += `- Location: ${error.location.url}:${error.location.lineNumber}\n`;
        }
        markdown += `- Timestamp: ${error.timestamp}\n\n`;
      });
    }
    
    // Screenshots
    markdown += `### 7. Screenshots\n\n`;
    markdown += `Screenshots have been saved to the \`sidebar-test-screenshots\` directory:\n\n`;
    Object.keys(results.screenshots).forEach(name => {
      markdown += `- ${name}\n`;
    });
    
    markdown += `\n## Conclusion\n\n`;
    if (summary.failed === 0) {
      markdown += `🎉 **All tests passed!** The sidebar UI consistency fix is working correctly across all pages.\n`;
    } else {
      markdown += `⚠️ **${summary.failed} test(s) failed.** There are still some issues that need to be addressed.\n`;
    }
    
    return markdown;
  }

  async run() {
    try {
      await this.init();
      
      // Login first to test authenticated features
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        console.error('❌ Cannot proceed with tests - login failed');
        return;
      }
      
      // Run all tests
      await this.testNavigationFlow();
      await this.testSettingsLinkFunctionality();
      await this.testResponsiveBehavior();
      await this.testAuthenticationFlow();
      await this.checkForLayoutIssues();
      
      // Generate report
      const report = await this.generateReport();
      
      console.log('\n🏁 Test completed!');
      console.log(`📊 Summary: ${report.summary.passed}/${report.summary.total} tests passed (${report.summary.passRate})`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new SidebarUIConsistencyTest();
  test.run().catch(console.error);
}

module.exports = SidebarUIConsistencyTest;