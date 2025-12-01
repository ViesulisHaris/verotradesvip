const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Focused Diagnostic Test for Dashboard Issues
class DashboardDiagnostic {
  constructor() {
    this.browser = null;
    this.page = null;
    this.diagnosticResults = {
      authenticationFlow: { status: 'pending', details: [] },
      dashboardContent: { status: 'pending', details: [] },
      componentRendering: { status: 'pending', details: [] },
      dataConnectivity: { status: 'pending', details: [] }
    };
    this.consoleMessages = [];
  }

  async initialize() {
    console.log('🔍 Initializing Focused Dashboard Diagnostic...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Capture console messages with detailed logging
    this.page.on('console', msg => {
      const message = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };
      this.consoleMessages.push(message);
      
      // Log authentication-related messages immediately
      if (message.text.includes('AuthContext') || message.text.includes('auth')) {
        console.log(`🔐 AUTH LOG: ${message.type.toUpperCase()} - ${message.text}`);
      }
    });

    // Capture unhandled errors
    this.page.on('pageerror', error => {
      console.log(`🚨 PAGE ERROR: ${error.message}`);
      this.consoleMessages.push({
        type: 'error',
        text: `Page Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    });

    // Monitor network requests
    this.page.on('request', request => {
      if (request.url().includes('supabase') || request.url().includes('auth')) {
        console.log(`🌐 NETWORK: ${request.method()} ${request.url()}`);
      }
    });

    console.log('✅ Diagnostic browser initialized');
  }

  async testAuthenticationFlow() {
    console.log('\n🔐 Testing Authentication Flow...');
    
    try {
      // Test 1: Check home page first
      console.log('📍 Testing home page access...');
      await this.page.goto('http://localhost:3000/', { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });
      
      const homePageState = await this.page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          bodyContent: document.body.textContent.substring(0, 200),
          hasLoginForm: !!document.querySelector('form'),
          hasAuthButtons: !!document.querySelector('button'),
          authContextErrors: Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && el.textContent.includes('AuthContext')
          ).length
        };
      });
      
      // Test 2: Try to access dashboard directly
      console.log('📍 Testing direct dashboard access...');
      await this.page.goto('http://localhost:3000/dashboard', { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });
      
      // Wait for any redirects
      await this.page.waitForTimeout(3000);
      
      const dashboardAccessState = await this.page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          bodyContent: document.body.textContent.substring(0, 200),
          wasRedirected: !window.location.href.includes('/dashboard'),
          hasLoginForm: !!document.querySelector('form'),
          hasDashboardElements: !!document.querySelector('.dashboard, [data-dashboard], main'),
          authContextErrors: Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && el.textContent.includes('AuthContext')
          ).length
        };
      });
      
      // Test 3: Check if login page exists
      console.log('📍 Testing login page access...');
      await this.page.goto('http://localhost:3000/login', { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });
      
      const loginPageState = await this.page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          hasLoginForm: !!document.querySelector('form'),
          hasInputFields: document.querySelectorAll('input').length,
          hasSubmitButton: !!document.querySelector('button[type="submit"], input[type="submit"]'),
          bodyContent: document.body.textContent.substring(0, 200)
        };
      });
      
      this.diagnosticResults.authenticationFlow = {
        status: 'completed',
        details: {
          homePage: homePageState,
          dashboardAccess: dashboardAccessState,
          loginPage: loginPageState,
          authErrorsInConsole: this.consoleMessages.filter(msg => 
            msg.text.includes('AuthContext') && msg.type === 'error'
          ).length,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('✅ Authentication flow diagnostic completed');
      
    } catch (error) {
      this.diagnosticResults.authenticationFlow = {
        status: 'failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
      console.log('❌ Authentication flow diagnostic failed:', error.message);
    }
  }

  async testDashboardContent() {
    console.log('\n📊 Testing Dashboard Content...');
    
    try {
      // Navigate to dashboard and wait for content
      await this.page.goto('http://localhost:3000/dashboard', { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });
      
      // Wait for dynamic content to load
      await this.page.waitForTimeout(5000);
      
      const contentAnalysis = await this.page.evaluate(() => {
        // Check for actual dashboard content
        const dashboardSelectors = [
          '.dashboard',
          '.dashboard-content',
          '[data-dashboard]',
          '.trading-stats',
          '.statistics',
          '.metrics',
          '.emotion-radar',
          '.emotional-analysis',
          '.trades-list',
          '.performance-chart'
        ];
        
        const foundElements = {};
        dashboardSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          foundElements[selector] = {
            count: elements.length,
            hasContent: elements.length > 0
          };
        });
        
        // Analyze page structure
        const pageStructure = {
          hasMain: !!document.querySelector('main'),
          hasSections: document.querySelectorAll('section').length,
          hasDivs: document.querySelectorAll('div').length,
          hasText: document.body.textContent.trim().length > 0,
          textLength: document.body.textContent.trim().length,
          bodyClasses: document.body.className,
          bodyId: document.body.id
        };
        
        // Look for any loading or error states
        const stateIndicators = {
          loadingElements: document.querySelectorAll('.loading, .spinner, [data-loading]').length,
          errorElements: document.querySelectorAll('.error, .error-message, [data-error]').length,
          emptyElements: document.querySelectorAll('.empty, .no-data, .empty-state').length
        };
        
        return {
          foundElements,
          pageStructure,
          stateIndicators,
          rawHTML: document.documentElement.outerHTML.substring(0, 1000)
        };
      });
      
      this.diagnosticResults.dashboardContent = {
        status: 'completed',
        details: {
          ...contentAnalysis,
          hasDashboardComponents: Object.values(contentAnalysis.foundElements).some(el => el.hasContent),
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('✅ Dashboard content diagnostic completed');
      
    } catch (error) {
      this.diagnosticResults.dashboardContent = {
        status: 'failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
      console.log('❌ Dashboard content diagnostic failed:', error.message);
    }
  }

  async testComponentRendering() {
    console.log('\n🎨 Testing Component Rendering...');
    
    try {
      await this.page.goto('http://localhost:3000/dashboard', { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });
      
      await this.page.waitForTimeout(3000);
      
      const renderingAnalysis = await this.page.evaluate(() => {
        // Check React component patterns
        const reactPatterns = {
          hasDataAttributes: document.querySelectorAll('[data-*]').length,
          hasReactRoot: !!document.querySelector('#root, [data-reactroot]'),
          hasNextJS: !!document.querySelector('[data-nextjs]') || document.body.textContent.includes('Next.js'),
          hasComponentClasses: document.querySelectorAll('[class*="component"], [class*="Component"]').length
        };
        
        // Check for specific dashboard components
        const componentChecks = {
          navigation: {
            hasNav: !!document.querySelector('nav'),
            hasMenu: !!document.querySelector('.menu, .nav-menu'),
            hasLinks: document.querySelectorAll('a').length
          },
          statistics: {
            hasStatsGrid: !!document.querySelector('.stats-grid, .statistics-grid'),
            hasStatCards: document.querySelectorAll('.stat-card, .metric-card').length,
            hasNumbers: /\d+/.test(document.body.textContent)
          },
          charts: {
            hasCanvas: !!document.querySelector('canvas'),
            hasChartElements: document.querySelectorAll('[data-chart], .chart').length,
            hasSVG: !!document.querySelector('svg')
          },
          tables: {
            hasTable: !!document.querySelector('table'),
            hasRows: document.querySelectorAll('tr, .row').length,
            hasDataCells: document.querySelectorAll('td, .cell').length
          }
        };
        
        // Check for hydration issues
        const hydrationCheck = {
          bodyHTML: document.body.innerHTML.substring(0, 500),
          hasHydrationWarnings: document.body.textContent.includes('hydration'),
          hasServerClientMismatch: document.body.textContent.includes('server') && 
                                  document.body.textContent.includes('client')
        };
        
        return {
          reactPatterns,
          componentChecks,
          hydrationCheck,
          renderTime: performance.now()
        };
      });
      
      this.diagnosticResults.componentRendering = {
        status: 'completed',
        details: {
          ...renderingAnalysis,
          hasComponents: Object.values(renderingAnalysis.componentChecks).some(check => 
            Object.values(check).some(value => value === true || value > 0)
          ),
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('✅ Component rendering diagnostic completed');
      
    } catch (error) {
      this.diagnosticResults.componentRendering = {
        status: 'failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
      console.log('❌ Component rendering diagnostic failed:', error.message);
    }
  }

  async testDataConnectivity() {
    console.log('\n🔄 Testing Data Connectivity...');
    
    try {
      const networkRequests = [];
      const supabaseRequests = [];
      
      // Monitor network requests
      const requestHandler = request => {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
        
        if (request.url().includes('supabase')) {
          supabaseRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: new Date().toISOString()
          });
        }
      };
      
      this.page.on('request', requestHandler);
      
      await this.page.goto('http://localhost:3000/dashboard', { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });
      
      // Wait for network activity
      await this.page.waitForTimeout(5000);
      
      // Check for Supabase client initialization
      const supabaseCheck = await this.page.evaluate(() => {
        // Look for Supabase in window object
        const hasSupabase = !!(window.supabase || window._supabase);
        
        // Check for Supabase-related scripts
        const supabaseScripts = Array.from(document.querySelectorAll('script')).filter(script =>
          script.textContent && script.textContent.includes('supabase')
        ).length;
        
        // Look for API calls in console
        const hasAPIKeys = document.body.textContent.includes('eyJ') || 
                          document.body.textContent.includes('supabase');
        
        return {
          hasSupabase,
          supabaseScripts,
          hasAPIKeys,
          localStorageKeys: Object.keys(window.localStorage || {}),
          sessionStorageKeys: Object.keys(window.sessionStorage || {})
        };
      });
      
      this.diagnosticResults.dataConnectivity = {
        status: 'completed',
        details: {
          networkRequests: networkRequests.length,
          supabaseRequests: supabaseRequests.length,
          supabaseCheck,
          hasNetworkActivity: networkRequests.length > 0,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('✅ Data connectivity diagnostic completed');
      
    } catch (error) {
      this.diagnosticResults.dataConnectivity = {
        status: 'failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
      console.log('❌ Data connectivity diagnostic failed:', error.message);
    }
  }

  async generateDiagnosticReport() {
    console.log('\n📋 Generating Diagnostic Report...');
    
    const report = {
      diagnosticSummary: {
        totalTests: Object.keys(this.diagnosticResults).length,
        completed: Object.values(this.diagnosticResults).filter(r => r.status === 'completed').length,
        failed: Object.values(this.diagnosticResults).filter(r => r.status === 'failed').length,
        timestamp: new Date().toISOString()
      },
      diagnosticResults: this.diagnosticResults,
      consoleAnalysis: {
        totalMessages: this.consoleMessages.length,
        errors: this.consoleMessages.filter(msg => msg.type === 'error').length,
        warnings: this.consoleMessages.filter(msg => msg.type === 'warning').length,
        authRelatedErrors: this.consoleMessages.filter(msg => 
          msg.text.includes('AuthContext') && msg.type === 'error'
        ).length,
        recentErrors: this.consoleMessages.filter(msg => msg.type === 'error').slice(-10)
      },
      environment: {
        userAgent: await this.page.evaluate(() => navigator.userAgent),
        url: this.page.url(),
        timestamp: new Date().toISOString()
      }
    };
    
    // Save diagnostic report
    const reportPath = path.join(__dirname, `DASHBOARD_DIAGNOSTIC_REPORT_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const markdownReport = this.generateMarkdownDiagnostic(report);
    const markdownPath = path.join(__dirname, `DASHBOARD_DIAGNOSTIC_REPORT_${Date.now()}.md`);
    fs.writeFileSync(markdownPath, markdownReport);
    
    console.log(`📄 Diagnostic report saved: ${reportPath}`);
    console.log(`📝 Markdown report saved: ${markdownPath}`);
    
    return { report, reportPath, markdownPath };
  }

  generateMarkdownDiagnostic(report) {
    const { diagnosticSummary, diagnosticResults, consoleAnalysis } = report;
    
    let markdown = `# Dashboard Diagnostic Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    
    // Summary
    markdown += `## Diagnostic Summary\n\n`;
    markdown += `- **Total Tests:** ${diagnosticSummary.totalTests}\n`;
    markdown += `- **Completed:** ✅ ${diagnosticSummary.completed}\n`;
    markdown += `- **Failed:** ❌ ${diagnosticSummary.failed}\n\n`;
    
    // Console Analysis
    markdown += `## Console Analysis\n\n`;
    markdown += `- **Total Messages:** ${consoleAnalysis.totalMessages}\n`;
    markdown += `- **Errors:** 🔴 ${consoleAnalysis.errors}\n`;
    markdown += `- **Warnings:** 🟡 ${consoleAnalysis.warnings}\n`;
    markdown += `- **AuthContext Errors:** 🔐 ${consoleAnalysis.authRelatedErrors}\n\n`;
    
    if (consoleAnalysis.authRelatedErrors > 0) {
      markdown += `### 🚨 Critical Authentication Issues Detected\n\n`;
      markdown += `The application is experiencing ${consoleAnalysis.authRelatedErrors} AuthContext-related errors.\n`;
      markdown += `This indicates a fundamental authentication system failure.\n\n`;
    }
    
    // Detailed Results
    markdown += `## Detailed Diagnostic Results\n\n`;
    
    const testNames = {
      authenticationFlow: 'Authentication Flow',
      dashboardContent: 'Dashboard Content',
      componentRendering: 'Component Rendering',
      dataConnectivity: 'Data Connectivity'
    };
    
    Object.entries(diagnosticResults).forEach(([key, result]) => {
      const status = result.status === 'completed' ? '✅' : '❌';
      markdown += `### ${status} ${testNames[key] || key}\n\n`;
      markdown += `**Status:** ${result.status.toUpperCase()}\n\n`;
      
      if (result.details) {
        markdown += `**Key Findings:**\n`;
        
        // Extract key insights based on test type
        if (key === 'authenticationFlow') {
          const authErrors = result.details.authErrorsInConsole || 0;
          markdown += `- AuthContext errors in console: ${authErrors}\n`;
          if (result.details.dashboardAccess && result.details.dashboardAccess.wasRedirected) {
            markdown += `- Dashboard access redirected (authentication working)\n`;
          } else {
            markdown += `- Dashboard access not redirected (potential auth issue)\n`;
          }
        }
        
        if (key === 'dashboardContent') {
          markdown += `- Has dashboard components: ${result.details.hasDashboardComponents ? 'Yes' : 'No'}\n`;
          markdown += `- Total text content length: ${result.details.pageStructure?.textLength || 0} characters\n`;
        }
        
        if (key === 'componentRendering') {
          markdown += `- Has rendered components: ${result.details.hasComponents ? 'Yes' : 'No'}\n`;
          markdown += `- React patterns detected: ${result.details.reactPatterns?.hasNextJS ? 'Yes' : 'No'}\n`;
        }
        
        if (key === 'dataConnectivity') {
          markdown += `- Network requests: ${result.details.networkRequests}\n`;
          markdown += `- Supabase requests: ${result.details.supabaseRequests}\n`;
          markdown += `- Supabase client detected: ${result.details.supababaseCheck?.hasSupabase ? 'Yes' : 'No'}\n`;
        }
        
        markdown += `\n`;
      }
    });
    
    // Recommendations
    markdown += `## Recommendations\n\n`;
    
    if (consoleAnalysis.authRelatedErrors > 0) {
      markdown += `### 🔴 High Priority - Fix Authentication System\n\n`;
      markdown += `1. **AuthContext Initialization**: The AuthContext is not being properly initialized\n`;
      markdown += `2. **Provider Setup**: Check if AuthProvider is wrapping the application correctly\n`;
      markdown += `3. **Environment Variables**: Verify Supabase configuration is properly loaded\n\n`;
    }
    
    if (!diagnosticResults.dashboardContent.details?.hasDashboardComponents) {
      markdown += `### 🟡 Medium Priority - Dashboard Content Missing\n\n`;
      markdown += `1. **Component Loading**: Dashboard components are not rendering\n`;
      markdown += `2. **Data Dependencies**: Check if components are waiting for authentication\n`;
      markdown += `3. **Error Boundaries**: Verify components aren't being caught by error boundaries\n\n`;
    }
    
    return markdown;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Diagnostic browser closed');
    }
  }
}

// Main diagnostic execution
async function runDashboardDiagnostic() {
  const diagnostic = new DashboardDiagnostic();
  
  try {
    await diagnostic.initialize();
    
    // Run focused diagnostics
    await diagnostic.testAuthenticationFlow();
    await diagnostic.testDashboardContent();
    await diagnostic.testComponentRendering();
    await diagnostic.testDataConnectivity();
    
    // Generate report
    const { report, reportPath, markdownPath } = await diagnostic.generateDiagnosticReport();
    
    console.log('\n🎉 Dashboard Diagnostic Complete!');
    console.log(`📊 Summary: ${report.diagnosticSummary.completed} completed, ${report.diagnosticSummary.failed} failed`);
    console.log(`🔐 AuthContext Errors: ${report.consoleAnalysis.authRelatedErrors}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Diagnostic execution failed:', error);
    throw error;
  } finally {
    await diagnostic.cleanup();
  }
}

// Run diagnostic if this file is executed directly
if (require.main === module) {
  runDashboardDiagnostic()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Diagnostic execution failed:', error);
      process.exit(1);
    });
}

module.exports = { DashboardDiagnostic, runDashboardDiagnostic };