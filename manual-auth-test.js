const puppeteer = require('puppeteer');

/**
 * MANUAL AUTHENTICATION SYSTEM TEST
 * Simplified version that works with current Puppeteer setup
 */

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testCredentials: {
    email: 'Testuser1000@verotrade.com',
    password: 'TestPassword123!'
  }
};

class ManualAuthTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      errors: [],
      screenshots: []
    };
  }

  async initialize() {
    console.log('🚀 Initializing Manual Authentication Test...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      defaultViewport: { width: 1920, height: 1080 }
    });

    this.page = await this.browser.newPage();
    
    // Track console errors
    this.page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('AuthContext is undefined') || text.includes('error')) {
        console.log(`🔍 [CONSOLE] ${text}`);
        this.results.errors.push({
          timestamp: new Date().toISOString(),
          message: text,
          type: msg.type()
        });
      }
    });

    this.page.on('pageerror', (error) => {
      console.error('🚨 [PAGE_ERROR]:', error.message);
      this.results.errors.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        type: 'page_error'
      });
    });

    console.log('✅ Browser initialized');
  }

  async takeScreenshot(name) {
    try {
      const filename = `manual-auth-test-${name}-${Date.now()}.png`;
      await this.page.screenshot({ path: filename, fullPage: true });
      this.results.screenshots.push({ filename, name });
      console.log(`📸 Screenshot: ${filename}`);
      return filename;
    } catch (error) {
      console.error('❌ Screenshot failed:', error.message);
      return null;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testLoginFlow() {
    console.log('\n🧪 Testing Login Flow...');
    
    try {
      // Navigate to login
      console.log('📍 Navigating to login page...');
      await this.page.goto(`${TEST_CONFIG.baseUrl}/login`, {
        waitUntil: 'networkidle2'
      });
      
      await this.sleep(3000); // Wait for page to fully load
      await this.takeScreenshot('login-page-loaded');

      // Check if login form exists
      const emailInput = await this.page.$('input[type="email"]');
      const passwordInput = await this.page.$('input[type="password"]');
      const submitButton = await this.page.$('button[type="submit"]');

      if (!emailInput || !passwordInput || !submitButton) {
        throw new Error('Login form elements not found');
      }

      console.log('✅ Login form found');

      // Fill credentials
      console.log('📝 Filling login credentials...');
      await this.page.type('input[type="email"]', TEST_CONFIG.testCredentials.email);
      await this.page.type('input[type="password"]', TEST_CONFIG.testCredentials.password);
      
      await this.takeScreenshot('login-form-filled');

      // Submit form
      console.log('🔐 Submitting login form...');
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
        this.page.click('button[type="submit"]')
      ]);

      await this.sleep(3000); // Wait for auth state to settle

      // Check if redirected to dashboard
      const currentUrl = this.page.url();
      console.log(`📍 Current URL after login: ${currentUrl}`);

      if (!currentUrl.includes('/dashboard')) {
        throw new Error(`Expected dashboard redirect, got: ${currentUrl}`);
      }

      await this.takeScreenshot('dashboard-after-login');

      // Check for dashboard content
      const dashboardTitle = await this.page.$eval('h1', el => el.textContent).catch(() => null);
      
      this.results.tests.push({
        name: 'Login Flow',
        status: 'PASSED',
        details: {
          redirectedToDashboard: currentUrl.includes('/dashboard'),
          dashboardTitle,
          currentUrl
        }
      });

      console.log('✅ Login flow test PASSED');
      return true;

    } catch (error) {
      console.error('❌ Login flow test FAILED:', error.message);
      await this.takeScreenshot('login-flow-error');
      
      this.results.tests.push({
        name: 'Login Flow',
        status: 'FAILED',
        error: error.message
      });
      
      return false;
    }
  }

  async testProtectedRoutes() {
    console.log('\n🧪 Testing Protected Routes...');
    
    const routes = ['/trades', '/calendar', '/strategies', '/dashboard'];
    const results = [];

    for (const route of routes) {
      try {
        console.log(`📍 Testing route: ${route}`);
        
        await this.page.goto(`${TEST_CONFIG.baseUrl}${route}`, {
          waitUntil: 'networkidle2'
        });
        
        await this.sleep(2000);

        const currentUrl = this.page.url();
        const isAccessible = !currentUrl.includes('/login');
        
        results.push({
          route,
          accessible: isAccessible,
          currentUrl
        });

        await this.takeScreenshot(`protected-route-${route.replace('/', '')}`);
        
        console.log(`${isAccessible ? '✅' : '❌'} ${route}: ${isAccessible ? 'Accessible' : 'Redirected to login'}`);
        
      } catch (error) {
        console.error(`❌ Route ${route} failed:`, error.message);
        results.push({
          route,
          accessible: false,
          error: error.message
        });
      }
    }

    const allAccessible = results.every(r => r.accessible);
    
    this.results.tests.push({
      name: 'Protected Routes',
      status: allAccessible ? 'PASSED' : 'FAILED',
      details: { results, allAccessible }
    });

    return allAccessible;
  }

  async testAuthContextErrors() {
    console.log('\n🧪 Checking for AuthContext Errors...');
    
    const authContextErrors = this.results.errors.filter(
      error => error.message.includes('AuthContext is undefined')
    );

    const hasNoErrors = authContextErrors.length === 0;
    
    this.results.tests.push({
      name: 'AuthContext Errors',
      status: hasNoErrors ? 'PASSED' : 'FAILED',
      details: {
        authContextErrors: authContextErrors.length,
        totalErrors: this.results.errors.length
      }
    });

    console.log(`${hasNoErrors ? '✅' : '❌'} AuthContext errors: ${authContextErrors.length}`);
    
    return hasNoErrors;
  }

  async generateReport() {
    console.log('\n📊 Generating Test Report...');
    
    const passedTests = this.results.tests.filter(t => t.status === 'PASSED').length;
    const totalTests = this.results.tests.length;
    
    const report = {
      ...this.results,
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        authContextErrors: this.results.errors.filter(e => e.message.includes('AuthContext')).length,
        overallStatus: passedTests === totalTests ? 'SUCCESS' : 'FAILED'
      },
      successCriteria: {
        successfulLogin: this.results.tests.find(t => t.name === 'Login Flow')?.status === 'PASSED',
        noAuthContextErrors: this.results.tests.find(t => t.name === 'AuthContext Errors')?.status === 'PASSED',
        protectedRouteAccess: this.results.tests.find(t => t.name === 'Protected Routes')?.status === 'PASSED'
      }
    };

    // Save report
    const filename = `MANUAL_AUTH_TEST_REPORT_${Date.now()}.json`;
    require('fs').writeFileSync(filename, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Report saved: ${filename}`);
    console.log('='.repeat(60));
    console.log('🎯 MANUAL AUTHENTICATION TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Overall Status: ${report.summary.overallStatus}`);
    console.log(`Tests: ${passedTests}/${totalTests} passed`);
    console.log(`AuthContext Errors: ${report.summary.authContextErrors}`);
    
    console.log('\n✅ SUCCESS CRITERIA:');
    Object.entries(report.successCriteria).forEach(([criterion, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${criterion.replace(/([A-Z])/g, ' $1').trim()}`);
    });
    
    console.log('='.repeat(60));
    
    return report;
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      await this.testLoginFlow();
      await this.testProtectedRoutes();
      await this.testAuthContextErrors();
      
      const report = await this.generateReport();
      
      return report;
      
    } catch (error) {
      console.error('🚨 Test execution failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        console.log('\n🔄 Keeping browser open for manual inspection...');
        console.log('Press Ctrl+C to close');
        // Don't close browser automatically for manual inspection
      }
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new ManualAuthTest();
  
  test.runAllTests()
    .then((report) => {
      console.log('\n🎉 Manual Authentication Test completed!');
      process.exit(report.summary.overallStatus === 'SUCCESS' ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n💥 Manual Authentication Test failed:', error);
      process.exit(1);
    });
}

module.exports = ManualAuthTest;