const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class VisualEnhancementDiagnostic {
  constructor() {
    this.browser = null;
    this.page = null;
    this.diagnosticResults = {
      authentication: {},
      componentRendering: {},
      dataLoading: {},
      errorStates: {},
      performance: {}
    };
  }

  async init() {
    console.log('🔍 Initializing Visual Enhancement Diagnostic...');
    this.browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Capture console logs and errors
    this.page.on('console', (msg) => {
      console.log(`📝 Browser Console: ${msg.text()}`);
    });
    
    this.page.on('pageerror', (error) => {
      console.log(`❌ Page Error: ${error.message}`);
      this.diagnosticResults.errorStates.pageErrors = this.diagnosticResults.errorStates.pageErrors || [];
      this.diagnosticResults.errorStates.pageErrors.push(error.message);
    });
  }

  async testAuthenticationState() {
    console.log('\n🔐 Testing Authentication State...');
    
    try {
      // Navigate to dashboard
      await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
      
      // Check current URL
      const currentUrl = this.page.url();
      this.diagnosticResults.authentication.currentUrl = currentUrl;
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // Check if redirected to login
      const isLoginPage = currentUrl.includes('/login');
      this.diagnosticResults.authentication.redirectedToLogin = isLoginPage;
      
      if (isLoginPage) {
        console.log('❌ Authentication Issue: Redirected to login page');
        
        // Check for login form
        const loginFormExists = await this.page.$('form') !== null;
        this.diagnosticResults.authentication.loginFormExists = loginFormExists;
        console.log(`📋 Login form exists: ${loginFormExists}`);
        
        // Check for any authentication-related console errors
        const authErrors = await this.page.evaluate(() => {
          const errors = [];
          if (window.console && window.console.error) {
            // Capture any auth-related errors
            const originalError = console.error;
            console.error = (...args) => {
              const errorMsg = args.join(' ');
              if (errorMsg.toLowerCase().includes('auth') || 
                  errorMsg.toLowerCase().includes('session') ||
                  errorMsg.toLowerCase().includes('token')) {
                errors.push(errorMsg);
              }
              originalError.apply(console, args);
            };
          }
          return errors;
        });
        
        this.diagnosticResults.authentication.authErrors = authErrors;
        console.log(`🚨 Authentication errors detected: ${authErrors.length}`);
      } else {
        console.log('✅ Authentication: Access to dashboard granted');
        
        // Check for user session
        const hasSession = await this.page.evaluate(() => {
          return !!localStorage.getItem('supabase.auth.token') ||
                 !!document.cookie.includes('supabase');
        });
        
        this.diagnosticResults.authentication.hasSession = hasSession;
        console.log(`🔑 Session exists: ${hasSession}`);
      }
    } catch (error) {
      console.error(`❌ Authentication test failed: ${error.message}`);
      this.diagnosticResults.authentication.error = error.message;
    }
  }

  async testComponentRendering() {
    console.log('\n🎨 Testing Component Rendering...');
    
    try {
      // Wait for potential dashboard load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for dashboard container
      const dashboardContainer = await this.page.$('[class*="dashboard"], [id*="dashboard"], main');
      this.diagnosticResults.componentRendering.dashboardContainerExists = dashboardContainer !== null;
      console.log(`📊 Dashboard container exists: ${dashboardContainer !== null}`);
      
      // Check for P&L chart container
      const chartContainer = await this.page.$('[class*="chart"], [id*="chart"], [data-testid*="chart"]');
      this.diagnosticResults.componentRendering.chartContainerExists = chartContainer !== null;
      console.log(`📈 Chart container exists: ${chartContainer !== null}`);
      
      if (chartContainer) {
        // Get chart dimensions
        const chartDimensions = await chartContainer.boundingBox();
        this.diagnosticResults.componentRendering.chartDimensions = chartDimensions;
        console.log(`📏 Chart dimensions: ${JSON.stringify(chartDimensions)}`);
        
        // Check if chart has actual content
        const chartContent = await this.page.evaluate((container) => {
          return container.innerHTML.length > 0;
        }, chartContainer);
        
        this.diagnosticResults.componentRendering.chartHasContent = chartContent;
        console.log(`📄 Chart has content: ${chartContent}`);
      }
      
      // Check for card elements
      const cardElements = await this.page.$$('.card, [class*="card"], [data-testid*="card"]');
      this.diagnosticResults.componentRendering.cardCount = cardElements.length;
      console.log(`🃏 Card elements found: ${cardElements.length}`);
      
      // Check for animated elements
      const animatedElements = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let animatedCount = 0;
        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          if (styles.animation !== 'none' || styles.transition !== 'none') {
            animatedCount++;
          }
        });
        return animatedCount;
      });
      
      this.diagnosticResults.componentRendering.animatedElementCount = animatedElements;
      console.log(`🎭 Animated elements: ${animatedElements}`);
      
    } catch (error) {
      console.error(`❌ Component rendering test failed: ${error.message}`);
      this.diagnosticResults.componentRendering.error = error.message;
    }
  }

  async testDataLoading() {
    console.log('\n📡 Testing Data Loading...');
    
    try {
      // Monitor network requests
      const networkRequests = [];
      this.page.on('request', (request) => {
        if (request.url().includes('/api/') || request.url().includes('supabase')) {
          networkRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: Date.now()
          });
        }
      });
      
      // Wait a bit to capture network activity
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.diagnosticResults.dataLoading.networkRequests = networkRequests;
      console.log(`🌐 Network requests captured: ${networkRequests.length}`);
      
      // Check for specific data endpoints
      const dataRequests = networkRequests.filter(req => 
        req.url.includes('trades') || 
        req.url.includes('pnl') || 
        req.url.includes('analytics') ||
        req.url.includes('dashboard')
      );
      
      this.diagnosticResults.dataLoading.dataRequests = dataRequests;
      console.log(`📊 Data-specific requests: ${dataRequests.length}`);
      
      // Check for any failed requests
      const failedRequests = networkRequests.filter(req => 
        req.url.includes('404') || 
        req.url.includes('500') || 
        req.url.includes('error')
      );
      
      this.diagnosticResults.dataLoading.failedRequests = failedRequests;
      console.log(`❌ Failed requests: ${failedRequests.length}`);
      
    } catch (error) {
      console.error(`❌ Data loading test failed: ${error.message}`);
      this.diagnosticResults.dataLoading.error = error.message;
    }
  }

  async testPerformanceMetrics() {
    console.log('\n⚡ Testing Performance Metrics...');
    
    try {
      // Get performance metrics
      const metrics = await this.page.metrics();
      this.diagnosticResults.performance.metrics = metrics;
      
      console.log(`📈 Performance Metrics:`);
      console.log(`   - Layout Count: ${metrics.LayoutCount}`);
      console.log(`   - Recalc Style Count: ${metrics.RecalcStyleCount}`);
      console.log(`   - Script Duration: ${metrics.ScriptDuration}ms`);
      console.log(`   - Task Duration: ${metrics.TaskDuration}ms`);
      
      // Check for performance issues
      const hasPerformanceIssues = 
        metrics.LayoutCount > 100 || 
        metrics.RecalcStyleCount > 200 ||
        metrics.ScriptDuration > 500 ||
        metrics.TaskDuration > 1000;
      
      this.diagnosticResults.performance.hasIssues = hasPerformanceIssues;
      console.log(`⚠️ Performance issues detected: ${hasPerformanceIssues}`);
      
    } catch (error) {
      console.error(`❌ Performance test failed: ${error.message}`);
      this.diagnosticResults.performance.error = error.message;
    }
  }

  async saveDiagnosticReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `visual-enhancement-diagnostic-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.diagnosticResults, null, 2));
    console.log(`\n📄 Diagnostic report saved: ${filename}`);
    
    return filepath;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      await this.testAuthenticationState();
      await this.testComponentRendering();
      await this.testDataLoading();
      await this.testPerformanceMetrics();
      
      const reportPath = await this.saveDiagnosticReport();
      
      console.log('\n🎯 Diagnostic Summary:');
      console.log(`   Authentication Issues: ${Object.keys(this.diagnosticResults.authentication).filter(key => this.diagnosticResults.authentication[key] === false || this.diagnosticResults.authentication[key] === 'error').length}`);
      console.log(`   Component Issues: ${Object.keys(this.diagnosticResults.componentRendering).filter(key => this.diagnosticResults.componentRendering[key] === false || this.diagnosticResults.componentRendering[key] === 'error').length}`);
      console.log(`   Data Loading Issues: ${Object.keys(this.diagnosticResults.dataLoading).filter(key => this.diagnosticResults.dataLoading[key] === 'error').length}`);
      console.log(`   Performance Issues: ${this.diagnosticResults.performance.hasIssues ? 1 : 0}`);
      
      return reportPath;
    } catch (error) {
      console.error(`❌ Diagnostic failed: ${error.message}`);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Main execution
async function main() {
  console.log('🔍 Visual Enhancement Diagnostic Tool');
  console.log('=====================================');
  console.log('This tool will diagnose issues with visual enhancements');
  console.log('by testing authentication, component rendering, data loading, and performance.');
  console.log('');
  
  const diagnostic = new VisualEnhancementDiagnostic();
  
  try {
    const reportPath = await diagnostic.run();
    console.log(`\n✅ Diagnostic completed successfully!`);
    console.log(`📊 Report available at: ${reportPath}`);
  } catch (error) {
    console.error(`\n❌ Diagnostic failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = VisualEnhancementDiagnostic;