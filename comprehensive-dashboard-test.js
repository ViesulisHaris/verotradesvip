const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Comprehensive Dashboard Testing Framework
class DashboardTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      pageLoading: { status: 'pending', details: [] },
      authentication: { status: 'pending', details: [] },
      tradingStatistics: { status: 'pending', details: [] },
      emotionalAnalysis: { status: 'pending', details: [] },
      dataFetching: { status: 'pending', details: [] },
      errorHandling: { status: 'pending', details: [] },
      navigation: { status: 'pending', details: [] },
      consoleErrors: { status: 'pending', details: [] },
      responsiveDesign: { status: 'pending', details: [] }
    };
    this.screenshots = [];
    this.consoleMessages = [];
  }

  async initialize() {
    console.log('🚀 Initializing Comprehensive Dashboard Test...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Capture console messages
    this.page.on('console', msg => {
      this.consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });

    // Capture unhandled errors
    this.page.on('pageerror', error => {
      this.consoleMessages.push({
        type: 'error',
        text: `Page Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    });

    console.log('✅ Browser initialized successfully');
  }

  async takeScreenshot(name, description) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `dashboard-test-${name}-${timestamp}.png`;
    const filepath = path.join(__dirname, filename);
    
    await this.page.screenshot({ path: filepath, fullPage: true });
    this.screenshots.push({ name, description, filename, filepath });
    console.log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  }

  async testPageLoading() {
    console.log('\n📄 Testing Dashboard Page Loading and Rendering...');
    
    try {
      const startTime = Date.now();
      
      // Navigate to dashboard
      await this.page.goto('http://localhost:3000/dashboard', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      const loadTime = Date.now() - startTime;
      
      // Check if page loaded successfully
      const pageTitle = await this.page.title();
      const pageUrl = this.page.url();
      
      // Wait for key components to load
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      // Check for main dashboard elements
      const dashboardElements = await this.page.evaluate(() => {
        const elements = {
          body: document.querySelector('body') ? true : false,
          main: document.querySelector('main') ? true : false,
          container: document.querySelector('.container, .dashboard-container, main > div') ? true : false
        };
        return elements;
      });
      
      this.testResults.pageLoading = {
        status: 'passed',
        details: {
          loadTime: `${loadTime}ms`,
          pageTitle,
          pageUrl,
          elementsFound: dashboardElements,
          timestamp: new Date().toISOString()
        }
      };
      
      await this.takeScreenshot('page-load', 'Dashboard page loaded');
      console.log('✅ Page loading test completed successfully');
      
    } catch (error) {
      this.testResults.pageLoading = {
        status: 'failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
      console.log('❌ Page loading test failed:', error.message);
    }
  }

  async testAuthentication() {
    console.log('\n🔐 Testing Authentication Requirements...');
    
    try {
      // Check if we're redirected to login or if auth is required
      const currentUrl = this.page.url();
      
      // Look for authentication indicators
      const authState = await this.page.evaluate(() => {
        const loginForm = document.querySelector('form[action*="login"], .login-form, #login-form');
        const registerForm = document.querySelector('form[action*="register"], .register-form, #register-form');
        const dashboardContent = document.querySelector('.dashboard, .dashboard-content, [data-dashboard]');
        const userMenu = document.querySelector('.user-menu, .user-profile, [data-user]');
        
        return {
          hasLoginForm: !!loginForm,
          hasRegisterForm: !!registerForm,
          hasDashboardContent: !!dashboardContent,
          hasUserMenu: !!userMenu,
          bodyClasses: document.body.className
        };
      });
      
      // Test authentication flow if needed
      if (authState.hasLoginForm || authState.hasRegisterForm) {
        // Try to access dashboard without authentication
        await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
        
        const afterAuthUrl = this.page.url();
        const isRedirected = afterAuthUrl.includes('/login') || afterAuthUrl.includes('/register');
        
        this.testResults.authentication = {
          status: 'passed',
          details: {
            authRequired: true,
            isRedirected,
            currentUrl: afterAuthUrl,
            authState,
            timestamp: new Date().toISOString()
          }
        };
      } else if (authState.hasDashboardContent) {
        this.testResults.authentication = {
          status: 'passed',
          details: {
            authRequired: false,
            hasDashboardContent: true,
            authState,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        this.testResults.authentication = {
          status: 'warning',
          details: {
            message: 'Unable to determine authentication state',
            authState,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      await this.takeScreenshot('auth-test', 'Authentication state check');
      console.log('✅ Authentication test completed');
      
    } catch (error) {
      this.testResults.authentication = {
        status: 'failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
      console.log('❌ Authentication test failed:', error.message);
    }
  }

  async testTradingStatistics() {
    console.log('\n📊 Testing Trading Statistics Display...');
    
    try {
      // Look for trading statistics components
      const statistics = await this.page.evaluate(() => {
        const stats = {};
        
        // Common trading metrics selectors
        const metricSelectors = [
          '[data-metric="pnl"]', '[data-stat="pnl"]', '.pnl', '.profit-loss',
          '[data-metric="winrate"]', '[data-stat="winrate"]', '.win-rate', '.winrate',
          '[data-metric="profit-factor"]', '[data-stat="profit-factor"]', '.profit-factor',
          '[data-metric="total-trades"]', '[data-stat="total-trades"]', '.total-trades',
          '[data-metric="avg-win"]', '[data-stat="avg-win"]', '.average-win',
          '[data-metric="avg-loss"]', '[data-stat="avg-loss"]', '.average-loss'
        ];
        
        metricSelectors.forEach(selector => {
          const element = document.querySelector(selector);
          if (element) {
            const metricName = selector.replace(/[^a-zA-Z0-9]/g, '');
            stats[metricName] = {
              found: true,
              text: element.textContent?.trim(),
              value: element.textContent?.match(/[\d.-]+/)?.[0]
            };
          }
        });
        
        // Look for statistics containers
        const containers = {
          statsGrid: document.querySelector('.stats-grid, .statistics-grid, .metrics-grid'),
          statsCards: document.querySelectorAll('.stat-card, .metric-card, .stat-card').length,
          statsContainer: document.querySelector('.statistics, .trading-stats, .performance-stats')
        };
        
        return { metrics: stats, containers };
      });
      
      // Check if statistics are being calculated and displayed
      const hasValidMetrics = Object.values(statistics.metrics).some(metric => 
        metric.found && metric.value && !isNaN(parseFloat(metric.value))
      );
      
      this.testResults.tradingStatistics = {
        status: hasValidMetrics ? 'passed' : 'warning',
        details: {
          statistics,
          hasValidMetrics,
          metricsCount: Object.keys(statistics.metrics).length,
          timestamp: new Date().toISOString()
        }
      };
      
      await this.takeScreenshot('trading-stats', 'Trading statistics display');
      console.log('✅ Trading statistics test completed');
      
    } catch (error) {
      this.testResults.tradingStatistics = {
        status: 'failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
      console.log('❌ Trading statistics test failed:', error.message);
    }
  }

  async testEmotionalAnalysis() {
    console.log('\n🎭 Testing Emotional Analysis Components...');
    
    try {
      // Look for emotional analysis components
      const emotionalComponents = await this.page.evaluate(() => {
        const components = {};
        
        // EmotionRadar chart
        const emotionRadar = {
          canvas: document.querySelector('canvas'),
          radarChart: document.querySelector('.emotion-radar, #emotion-radar, [data-chart="radar"]'),
          emotionContainer: document.querySelector('.emotional-analysis, .emotion-analysis, .emotions')
        };
        
        // Emotional state displays
        const emotionDisplays = {
          currentEmotion: document.querySelector('[data-emotion="current"], .current-emotion'),
          emotionHistory: document.querySelector('.emotion-history, .emotional-timeline'),
          emotionTags: document.querySelectorAll('.emotion-tag, .emotion-label').length
        };
        
        // Check for emotional data processing
        const emotionalData = {
          hasEmotionFields: document.querySelector('[data-emotion], [data-emotional]') !== null,
          emotionInputs: document.querySelectorAll('input[name*="emotion"], select[name*="emotion"]').length
        };
        
        return {
          radar: emotionRadar,
          displays: emotionDisplays,
          data: emotionalData
        };
      });
      
      // Test if EmotionRadar chart is rendered
      let radarWorking = false;
      if (emotionalComponents.radar.canvas) {
        // Check if canvas has content (not just blank)
        const canvasData = await this.page.evaluate(() => {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasContent = imageData.data.some((channel, index) => index % 4 === 3 && channel > 0);
            return {
              width: canvas.width,
              height: canvas.height,
              hasContent
            };
          }
          return null;
        });
        
        radarWorking = canvasData && canvasData.hasContent;
      }
      
      this.testResults.emotionalAnalysis = {
        status: radarWorking || emotionalComponents.displays.emotionTags > 0 ? 'passed' : 'warning',
        details: {
          components: emotionalComponents,
          radarWorking,
          timestamp: new Date().toISOString()
        }
      };
      
      await this.takeScreenshot('emotional-analysis', 'Emotional analysis components');
      console.log('✅ Emotional analysis test completed');
      
    } catch (error) {
      this.testResults.emotionalAnalysis = {
        status: 'failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
      console.log('❌ Emotional analysis test failed:', error.message);
    }
  }

  async testDataFetching() {
    console.log('\n🔄 Testing Data Fetching from Supabase...');
    
    try {
      // Monitor network requests for Supabase calls
      const supabaseRequests = [];
      
      this.page.on('request', request => {
        if (request.url().includes('supabase')) {
          supabaseRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Wait a bit to capture network activity
      await this.page.waitForTimeout(3000);
      
      // Check for data loading indicators
      const dataState = await this.page.evaluate(() => {
        const loadingIndicators = document.querySelectorAll('.loading, .spinner, [data-loading]').length;
        const errorMessages = document.querySelectorAll('.error, .error-message, [data-error]').length;
        const dataContainers = document.querySelectorAll('[data-loaded], .data-container, .trades-list').length;
        
        // Look for trade data or table content
        const tradeData = {
          tables: document.querySelectorAll('table').length,
          listItems: document.querySelectorAll('li, .trade-item, .trade-row').length,
          dataRows: document.querySelectorAll('tbody tr, .data-row').length
        };
        
        return {
          loadingIndicators,
          errorMessages,
          dataContainers,
          tradeData
        };
      });
      
      this.testResults.dataFetching = {
        status: supabaseRequests.length > 0 || dataState.dataContainers > 0 ? 'passed' : 'warning',
        details: {
          supabaseRequests,
          dataState,
          hasNetworkActivity: supabaseRequests.length > 0,
          timestamp: new Date().toISOString()
        }
      };
      
      await this.takeScreenshot('data-fetching', 'Data fetching state');
      console.log('✅ Data fetching test completed');
      
    } catch (error) {
      this.testResults.dataFetching = {
        status: 'failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
      console.log('❌ Data fetching test failed:', error.message);
    }
  }

  async testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling and Loading States...');
    
    try {
      // Check for error handling mechanisms
      const errorHandling = await this.page.evaluate(() => {
        const errorElements = {
          errorBoundaries: document.querySelectorAll('[data-error-boundary], .error-boundary').length,
          errorMessages: document.querySelectorAll('.error, .error-message, .alert-error').length,
          loadingStates: document.querySelectorAll('.loading, .spinner, .skeleton, [data-loading]').length,
          emptyStates: document.querySelectorAll('.empty, .no-data, .empty-state').length
        };
        
        // Check for try-catch patterns in scripts (basic check)
        const scripts = Array.from(document.querySelectorAll('script'));
        const hasErrorHandling = scripts.some(script => 
          script.textContent && script.textContent.includes('try') && script.textContent.includes('catch')
        );
        
        return {
          elements: errorElements,
          hasErrorHandling,
          totalErrorElements: Object.values(errorElements).reduce((sum, count) => sum + count, 0)
        };
      });
      
      // Test navigation to invalid routes
      await this.page.goto('http://localhost:3000/invalid-route', { waitUntil: 'networkidle2' });
      
      const invalidRouteHandled = await this.page.evaluate(() => {
        const has404Content = document.body.textContent.includes('404') || 
                             document.body.textContent.includes('not found') ||
                             document.querySelector('.not-found, .error-404');
        return !!has404Content;
      });
      
      // Go back to dashboard
      await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      
      this.testResults.errorHandling = {
        status: errorHandling.hasErrorHandling || invalidRouteHandled ? 'passed' : 'warning',
        details: {
          errorHandling,
          invalidRouteHandled,
          timestamp: new Date().toISOString()
        }
      };
      
      await this.takeScreenshot('error-handling', 'Error handling mechanisms');
      console.log('✅ Error handling test completed');
      
    } catch (error) {
      this.testResults.errorHandling = {
        status: 'failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
      console.log('❌ Error handling test failed:', error.message);
    }
  }

  async testNavigation() {
    console.log('\n🧭 Testing Navigation and Quick Actions...');
    
    try {
      // Test navigation elements
      const navigation = await this.page.evaluate(() => {
        const navElements = {
          mainNav: document.querySelector('nav, .navigation, .navbar'),
          sidebar: document.querySelector('.sidebar, .side-nav'),
          menuItems: document.querySelectorAll('nav a, .nav-link, .menu-item').length,
          buttons: document.querySelectorAll('button, .btn, [role="button"]').length,
          links: document.querySelectorAll('a[href]').length
        };
        
        // Test specific navigation links
        const navLinks = Array.from(document.querySelectorAll('a[href]')).map(link => ({
          text: link.textContent?.trim(),
          href: link.getAttribute('href'),
          isInternal: link.getAttribute('href')?.startsWith('/') || 
                     link.getAttribute('href')?.includes('localhost')
        }));
        
        return {
          elements: navElements,
          links: navLinks
        };
      });
      
      // Test clicking on navigation elements
      let navigationWorking = false;
      if (navigation.elements.menuItems > 0) {
        try {
          // Click on first navigation item
          const firstNav = await this.page.$('nav a, .nav-link, .menu-item');
          if (firstNav) {
            await firstNav.click();
            await this.page.waitForTimeout(2000);
            navigationWorking = true;
          }
        } catch (error) {
          console.log('Navigation click test failed:', error.message);
        }
      }
      
      this.testResults.navigation = {
        status: navigation.elements.menuItems > 0 || navigationWorking ? 'passed' : 'warning',
        details: {
          navigation,
          navigationWorking,
          timestamp: new Date().toISOString()
        }
      };
      
      await this.takeScreenshot('navigation', 'Navigation and quick actions');
      console.log('✅ Navigation test completed');
      
    } catch (error) {
      this.testResults.navigation = {
        status: 'failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
      console.log('❌ Navigation test failed:', error.message);
    }
  }

  async testConsoleErrors() {
    console.log('\n🔍 Checking Browser Console for Errors and Warnings...');
    
    try {
      // Analyze collected console messages
      const errors = this.consoleMessages.filter(msg => msg.type === 'error');
      const warnings = this.consoleMessages.filter(msg => msg.type === 'warning');
      const logs = this.consoleMessages.filter(msg => msg.type === 'log');
      
      // Categorize errors
      const errorCategories = {
        javascript: errors.filter(e => e.text.includes('TypeError') || e.text.includes('ReferenceError')),
        network: errors.filter(e => e.text.includes('Network') || e.text.includes('fetch')),
        supabase: errors.filter(e => e.text.includes('supabase')),
        other: errors.filter(e => !e.text.includes('TypeError') && !e.text.includes('ReferenceError') && 
                                 !e.text.includes('Network') && !e.text.includes('supabase'))
      };
      
      const hasCriticalErrors = errors.length > 0;
      const hasWarnings = warnings.length > 0;
      
      this.testResults.consoleErrors = {
        status: hasCriticalErrors ? 'failed' : (hasWarnings ? 'warning' : 'passed'),
        details: {
          totalMessages: this.consoleMessages.length,
          errors: errors.length,
          warnings: warnings.length,
          logs: logs.length,
          errorCategories,
          recentErrors: errors.slice(-5), // Last 5 errors
          recentWarnings: warnings.slice(-5), // Last 5 warnings
          timestamp: new Date().toISOString()
        }
      };
      
      console.log(`📊 Console Analysis: ${errors.length} errors, ${warnings.length} warnings, ${logs.length} logs`);
      
    } catch (error) {
      this.testResults.consoleErrors = {
        status: 'failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
      console.log('❌ Console error check failed:', error.message);
    }
  }

  async testResponsiveDesign() {
    console.log('\n📱 Testing Responsive Design...');
    
    try {
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 1366, height: 768, name: 'Laptop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];
      
      const responsiveResults = [];
      
      for (const viewport of viewports) {
        await this.page.setViewport({ width: viewport.width, height: viewport.height });
        await this.page.waitForTimeout(1000);
        
        const viewportTest = await this.page.evaluate((vp) => {
          const body = document.body;
          const html = document.documentElement;
          
          // Check for responsive elements
          const responsive = {
            hasHorizontalScroll: body.scrollWidth > body.clientWidth,
            hasVerticalScroll: body.scrollHeight > body.clientHeight,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            bodyWidth: body.offsetWidth,
            bodyHeight: body.offsetHeight
          };
          
          // Check for mobile-specific elements
          const mobileElements = {
            hamburgerMenu: document.querySelector('.hamburger, .mobile-menu, [data-mobile-toggle]'),
            mobileNav: document.querySelector('.mobile-nav, .nav-mobile'),
            collapsedSidebar: document.querySelector('.sidebar.collapsed, .sidebar-mobile')
          };
          
          return {
            viewport: vp,
            responsive,
            mobileElements,
            hasResponsiveClasses: html.className.includes('responsive') || 
                                 body.className.includes('responsive')
          };
        }, viewport);
        
        responsiveResults.push(viewportTest);
        
        // Take screenshot for each viewport
        await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`, `${viewport.name} view`);
      }
      
      // Check if layout adapts properly
      const hasHorizontalScrollIssues = responsiveResults.some(r => r.responsive.hasHorizontalScroll);
      const hasMobileAdaptation = responsiveResults.some(r => 
        r.viewport.width <= 768 && (r.mobileElements.hamburgerMenu || r.mobileElements.mobileNav)
      );
      
      this.testResults.responsiveDesign = {
        status: !hasHorizontalScrollIssues && hasMobileAdaptation ? 'passed' : 'warning',
        details: {
          viewports: responsiveResults,
          hasHorizontalScrollIssues,
          hasMobileAdaptation,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('✅ Responsive design test completed');
      
    } catch (error) {
      this.testResults.responsiveDesign = {
        status: 'failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
      console.log('❌ Responsive design test failed:', error.message);
    }
  }

  async generateReport() {
    console.log('\n📋 Generating Comprehensive Test Report...');
    
    const report = {
      testSummary: {
        totalTests: Object.keys(this.testResults).length,
        passed: Object.values(this.testResults).filter(r => r.status === 'passed').length,
        failed: Object.values(this.testResults).filter(r => r.status === 'failed').length,
        warnings: Object.values(this.testResults).filter(r => r.status === 'warning').length,
        timestamp: new Date().toISOString()
      },
      testResults: this.testResults,
      screenshots: this.screenshots,
      consoleMessages: this.consoleMessages.slice(-20), // Last 20 messages
      environment: {
        userAgent: await this.page.evaluate(() => navigator.userAgent),
        viewport: await this.page.viewport(),
        url: this.page.url()
      }
    };
    
    // Save detailed report
    const reportPath = path.join(__dirname, `COMPREHENSIVE_DASHBOARD_TEST_REPORT_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(__dirname, `COMPREHENSIVE_DASHBOARD_TEST_REPORT_${Date.now()}.md`);
    fs.writeFileSync(markdownPath, markdownReport);
    
    console.log(`📄 Detailed report saved: ${reportPath}`);
    console.log(`📝 Markdown report saved: ${markdownPath}`);
    
    return { report, reportPath, markdownPath };
  }

  generateMarkdownReport(report) {
    const { testSummary, testResults } = report;
    
    let markdown = `# Comprehensive Dashboard Test Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    
    // Summary
    markdown += `## Test Summary\n\n`;
    markdown += `- **Total Tests:** ${testSummary.totalTests}\n`;
    markdown += `- **Passed:** ✅ ${testSummary.passed}\n`;
    markdown += `- **Failed:** ❌ ${testSummary.failed}\n`;
    markdown += `- **Warnings:** ⚠️ ${testSummary.warnings}\n\n`;
    
    // Detailed Results
    markdown += `## Detailed Test Results\n\n`;
    
    const testNames = {
      pageLoading: 'Page Loading and Rendering',
      authentication: 'Authentication Requirements',
      tradingStatistics: 'Trading Statistics Display',
      emotionalAnalysis: 'Emotional Analysis Components',
      dataFetching: 'Data Fetching from Supabase',
      errorHandling: 'Error Handling and Loading States',
      navigation: 'Navigation and Quick Actions',
      consoleErrors: 'Browser Console Errors',
      responsiveDesign: 'Responsive Design'
    };
    
    Object.entries(testResults).forEach(([key, result]) => {
      const status = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
      markdown += `### ${status} ${testNames[key] || key}\n\n`;
      markdown += `**Status:** ${result.status.toUpperCase()}\n\n`;
      
      if (result.details) {
        markdown += `**Details:**\n`;
        markdown += `\`\`\`json\n${JSON.stringify(result.details, null, 2)}\n\`\`\`\n\n`;
      }
    });
    
    // Screenshots
    markdown += `## Screenshots\n\n`;
    report.screenshots.forEach(screenshot => {
      markdown += `- **${screenshot.name}:** ${screenshot.description} (${screenshot.filename})\n`;
    });
    
    return markdown;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }
}

// Main test execution
async function runComprehensiveDashboardTest() {
  const tester = new DashboardTester();
  
  try {
    await tester.initialize();
    
    // Run all tests
    await tester.testPageLoading();
    await tester.testAuthentication();
    await tester.testTradingStatistics();
    await tester.testEmotionalAnalysis();
    await tester.testDataFetching();
    await tester.testErrorHandling();
    await tester.testNavigation();
    await tester.testConsoleErrors();
    await tester.testResponsiveDesign();
    
    // Generate report
    const { report, reportPath, markdownPath } = await tester.generateReport();
    
    console.log('\n🎉 Comprehensive Dashboard Testing Complete!');
    console.log(`📊 Summary: ${report.testSummary.passed} passed, ${report.testSummary.failed} failed, ${report.testSummary.warnings} warnings`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    throw error;
  } finally {
    await tester.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveDashboardTest()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { DashboardTester, runComprehensiveDashboardTest };