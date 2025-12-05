const puppeteer = require('puppeteer');
const path = require('path');

class SimpleLogTradeTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      pageLoading: {},
      interactiveElements: {},
      animations: {},
      formFunctionality: {},
      responsiveDesign: {},
      errorHandling: {},
      integration: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        criticalIssues: [],
        warnings: []
      }
    };
    this.screenshots = [];
  }

  async init() {
    console.log('🚀 Initializing simple log trade page test...');
    this.browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Enable console logging from page
    this.page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async navigateToLogTradePage() {
    console.log('\n📍 Step 1: Navigating to log trade page...');
    try {
      await this.page.goto('http://localhost:3000/log-trade', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await this.sleep(2000);
      
      // Check if we're redirected to login (not authenticated)
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        console.log('⚠️ Redirected to login page - need to authenticate first');
        await this.authenticate();
        // Navigate back to log trade page after login
        await this.page.goto('http://localhost:3000/log-trade', { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
      }
      
      await this.takeScreenshot('page-loaded');
      this.testResults.pageLoading.navigation = { status: 'pass', message: 'Successfully navigated to log trade page' };
      return true;
    } catch (error) {
      console.error('❌ Navigation failed:', error.message);
      this.testResults.pageLoading.navigation = { status: 'fail', message: error.message };
      this.testResults.summary.criticalIssues.push('Navigation to log trade page failed');
      return false;
    }
  }

  async authenticate() {
    console.log('\n🔐 Authenticating user...');
    try {
      // Navigate to login page
      await this.page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
      
      // Fill login form
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await this.page.type('input[type="email"]', 'test@example.com');
      await this.page.type('input[type="password"]', 'testpassword123');
      
      // Submit form
      await this.page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      
      console.log('✅ Authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      return false;
    }
  }

  async testPageLoadingAndInitialState() {
    console.log('\n📋 Step 2: Testing page loading and initial state...');
    
    const tests = [
      {
        name: 'Page title',
        test: async () => {
          const title = await this.page.title();
          return title.includes('Log New Trade') || title.includes('Log Trade');
        }
      },
      {
        name: 'Main heading',
        test: async () => {
          const heading = await this.page.$eval('h1', el => el.textContent);
          return heading.includes('Log New Trade');
        }
      },
      {
        name: 'Form sections render',
        test: async () => {
          const sections = await this.page.$$('form h2');
          return sections.length >= 3; // Market Context, Execution Details, Risk & Outcome
        }
      },
      {
        name: 'TorchCard component',
        test: async () => {
          const torchCard = await this.page.$('.relative.overflow-hidden.rounded-xl');
          return torchCard !== null;
        }
      },
      {
        name: 'Text reveal animations',
        test: async () => {
          const textRevealElements = await this.page.$$('.text-reveal');
          return textRevealElements.length > 0;
        }
      },
      {
        name: 'Form inputs present',
        test: async () => {
          const inputs = await this.page.$$('input, select, button');
          return inputs.length >= 15; // Expected number of form elements
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.testResults.pageLoading[test.name] = {
          status: result ? 'pass' : 'fail',
          message: result ? 'Test passed' : 'Test failed'
        };
        if (result) {
          this.testResults.summary.passedTests++;
        } else {
          this.testResults.summary.failedTests++;
          this.testResults.summary.criticalIssues.push(`${test.name} failed`);
        }
        this.testResults.summary.totalTests++;
        console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASS' : 'FAIL'}`);
      } catch (error) {
        this.testResults.pageLoading[test.name] = {
          status: 'error',
          message: error.message
        };
        this.testResults.summary.failedTests++;
        this.testResults.summary.totalTests++;
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      }
    }
  }

  async testInteractiveElements() {
    console.log('\n🎯 Step 3: Testing interactive elements...');
    
    // Test Market Type Selector
    console.log('Testing Market Type Selector...');
    const marketTypes = ['stock', 'crypto', 'forex', 'futures'];
    for (const marketType of marketTypes) {
      try {
        const selector = `button[type="button"]:has-text("${marketType}")`;
        await this.page.waitForSelector(selector, { timeout: 5000 });
        
        // Check initial state
        const initialState = await this.page.$eval(selector, el => {
          return el.classList.contains('bg-verotrade-gold-primary/20');
        });
        
        // Click to toggle
        await this.page.click(selector);
        await this.sleep(300);
        
        // Check state after click
        const afterState = await this.page.$eval(selector, el => {
          return el.classList.contains('bg-verotrade-gold-primary/20');
        });
        
        const toggledSuccessfully = initialState !== afterState;
        this.testResults.interactiveElements[`market_${marketType}`] = {
          status: toggledSuccessfully ? 'pass' : 'fail',
          message: `Market type ${marketType} toggle: ${toggledSuccessfully ? 'WORKING' : 'FAILED'}`
        };
        console.log(`${toggledSuccessfully ? '✅' : '❌'} Market type ${marketType}: ${toggledSuccessfully ? 'WORKING' : 'FAILED'}`);
        
        if (toggledSuccessfully) this.testResults.summary.passedTests++;
        else this.testResults.summary.failedTests++;
        this.testResults.summary.totalTests++;
      } catch (error) {
        this.testResults.interactiveElements[`market_${marketType}`] = {
          status: 'error',
          message: error.message
        };
        this.testResults.summary.failedTests++;
        this.testResults.summary.totalTests++;
        console.log(`❌ Market type ${marketType}: ERROR - ${error.message}`);
      }
    }

    // Test Side Selector (Buy/Sell)
    console.log('Testing Side Selector...');
    const sides = ['Buy', 'Sell'];
    for (const side of sides) {
      try {
        const selector = `button[type="button"]:has-text("${side}")`;
        await this.page.waitForSelector(selector, { timeout: 5000 });
        
        await this.page.click(selector);
        await this.sleep(300);
        
        const isActive = await this.page.$eval(selector, el => {
          return el.classList.contains('bg-profit/20') || el.classList.contains('bg-loss/20');
        });
        
        const correctColor = side === 'Buy' ? 
          await this.page.$eval(selector, el => el.classList.contains('bg-profit/20')) :
          await this.page.$eval(selector, el => el.classList.contains('bg-loss/20'));
        
        const working = isActive && correctColor;
        this.testResults.interactiveElements[`side_${side}`] = {
          status: working ? 'pass' : 'fail',
          message: `Side ${side}: ${working ? 'WORKING' : 'FAILED'}`
        };
        console.log(`${working ? '✅' : '❌'} Side ${side}: ${working ? 'WORKING' : 'FAILED'}`);
        
        if (working) this.testResults.summary.passedTests++;
        else this.testResults.summary.failedTests++;
        this.testResults.summary.totalTests++;
      } catch (error) {
        this.testResults.interactiveElements[`side_${side}`] = {
          status: 'error',
          message: error.message
        };
        this.testResults.summary.failedTests++;
        this.testResults.summary.totalTests++;
        console.log(`❌ Side ${side}: ERROR - ${error.message}`);
      }
    }
  }

  async testAnimationsAndVisualEffects() {
    console.log('\n✨ Step 4: Testing animations and visual effects...');
    
    // Test TorchCard Spotlight Effect
    console.log('Testing TorchCard Spotlight Effect...');
    try {
      const torchCard = await this.page.$('.relative.overflow-hidden.rounded-xl');
      if (torchCard) {
        // Move mouse over card
        const boundingBox = await torchCard.boundingBox();
        await this.page.mouse.move(
          boundingBox.x + boundingBox.width / 2,
          boundingBox.y + boundingBox.height / 2
        );
        
        await this.sleep(500);
        
        // Check if spotlight activated
        const spotlightWorking = await this.page.evaluate(() => {
          const glowElements = document.querySelectorAll('[style*="radial-gradient"]');
          return glowElements.length > 0;
        });
        
        this.testResults.animations.torchcard_spotlight = {
          status: spotlightWorking ? 'pass' : 'fail',
          message: `TorchCard spotlight: ${spotlightWorking ? 'WORKING' : 'FAILED'}`
        };
        console.log(`${spotlightWorking ? '✅' : '❌'} TorchCard spotlight: ${spotlightWorking ? 'WORKING' : 'FAILED'}`);
        
        if (spotlightWorking) this.testResults.summary.passedTests++;
        else this.testResults.summary.failedTests++;
        this.testResults.summary.totalTests++;
      }
    } catch (error) {
      this.testResults.animations.torchcard_spotlight = {
        status: 'error',
        message: error.message
      };
      this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
      console.log(`❌ TorchCard spotlight: ERROR - ${error.message}`);
    }

    // Test Text Reveal Animations
    console.log('Testing Text Reveal Animations...');
    try {
      const textRevealElements = await this.page.$$('.text-reveal');
      let workingAnimations = 0;
      
      for (const element of textRevealElements) {
        const hasAnimation = await this.page.evaluate(el => {
          const computedStyle = getComputedStyle(el);
          return computedStyle.animation && computedStyle.animation !== 'none';
        }, element);
        
        if (hasAnimation) workingAnimations++;
      }
      
      const animationsWorking = workingAnimations > 0;
      this.testResults.animations.text_reveal = {
        status: animationsWorking ? 'pass' : 'fail',
        message: `Text reveal animations: ${workingAnimations}/${textRevealElements.length} working`
      };
      console.log(`${animationsWorking ? '✅' : '❌'} Text reveal animations: ${workingAnimations}/${textRevealElements.length} working`);
      
      if (animationsWorking) this.testResults.summary.passedTests++;
      else this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
    } catch (error) {
      this.testResults.animations.text_reveal = {
        status: 'error',
        message: error.message
      };
      this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
      console.log(`❌ Text reveal animations: ERROR - ${error.message}`);
    }
  }

  async testFormFunctionality() {
    console.log('\n📝 Step 5: Testing form functionality...');
    
    // Test form inputs
    console.log('Testing form inputs...');
    const formInputs = [
      { selector: 'input[placeholder*="AAPL"]', value: 'AAPL', name: 'symbol' },
      { selector: 'input[placeholder*="0.00"]', value: '100', name: 'quantity' },
      { selector: 'input[type="date"]', value: '2024-01-15', name: 'date' },
      { selector: 'input[type="time"]', value: '09:30', name: 'entry_time' },
      { selector: 'input[placeholder*="Stop Loss"]', value: '150.00', name: 'stop_loss' },
      { selector: 'input[placeholder*="Take Profit"]', value: '200.00', name: 'take_profit' },
      { selector: 'input[placeholder*="PnL"]', value: '500.00', name: 'pnl' }
    ];

    for (const input of formInputs) {
      try {
        await this.page.waitForSelector(input.selector, { timeout: 5000 });
        await this.page.focus(input.selector);
        await this.page.type(input.selector, input.value);
        
        const valueEntered = await this.page.$eval(input.selector, el => el.value);
        const inputWorking = valueEntered.includes(input.value);
        
        this.testResults.formFunctionality[`input_${input.name}`] = {
          status: inputWorking ? 'pass' : 'fail',
          message: `Input ${input.name}: ${inputWorking ? 'WORKING' : 'FAILED'}`
        };
        console.log(`${inputWorking ? '✅' : '❌'} Input ${input.name}: ${inputWorking ? 'WORKING' : 'FAILED'}`);
        
        if (inputWorking) this.testResults.summary.passedTests++;
        else this.testResults.summary.failedTests++;
        this.testResults.summary.totalTests++;
      } catch (error) {
        this.testResults.formFunctionality[`input_${input.name}`] = {
          status: 'error',
          message: error.message
        };
        this.testResults.summary.failedTests++;
        this.testResults.summary.totalTests++;
        console.log(`❌ Input ${input.name}: ERROR - ${error.message}`);
      }
    }

    // Test save functionality
    console.log('Testing save functionality...');
    try {
      // Fill required fields
      await this.page.type('input[placeholder*="AAPL"]', 'AAPL');
      await this.page.type('input[placeholder*="0.00"]', '100');
      await this.page.type('input[type="date"]', '2024-01-15');
      
      // Select market type
      await this.page.click('button:has-text("stock")');
      
      // Submit form
      await this.page.click('button[type="submit"]');
      
      // Check for loading state
      await this.sleep(1000);
      const loadingState = await this.page.$('.animate-spin') !== null;
      
      this.testResults.formFunctionality.save_functionality = {
        status: loadingState ? 'pass' : 'fail',
        message: `Save functionality: ${loadingState ? 'LOADING STATE DETECTED' : 'NO LOADING STATE'}`
      };
      console.log(`${loadingState ? '✅' : '❌'} Save functionality: ${loadingState ? 'LOADING STATE DETECTED' : 'NO LOADING STATE'}`);
      
      if (loadingState) this.testResults.summary.passedTests++;
      else this.testResults.summary.warnings.push('Save button may not show loading state');
      this.testResults.summary.totalTests++;
    } catch (error) {
      this.testResults.formFunctionality.save_functionality = {
        status: 'error',
        message: error.message
      };
      this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
      console.log(`❌ Save functionality: ERROR - ${error.message}`);
    }
  }

  async testResponsiveDesign() {
    console.log('\n📱 Step 6: Testing responsive design...');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      try {
        await this.page.setViewport({ width: viewport.width, height: viewport.height });
        await this.sleep(1000);
        
        // Check if form is usable
        const formVisible = await this.page.$('form') !== null;
        const inputsVisible = await this.page.$$('input').length > 0;
        const buttonsClickable = await this.page.$$('button').length > 0;
        
        const responsiveWorking = formVisible && inputsVisible && buttonsClickable;
        
        this.testResults.responsiveDesign[viewport.name.toLowerCase()] = {
          status: responsiveWorking ? 'pass' : 'fail',
          message: `${viewport.name} (${viewport.width}x${viewport.height}): ${responsiveWorking ? 'USABLE' : 'NOT USABLE'}`
        };
        console.log(`${responsiveWorking ? '✅' : '❌'} ${viewport.name} (${viewport.width}x${viewport.height}): ${responsiveWorking ? 'USABLE' : 'NOT USABLE'}`);
        
        await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);
        
        if (responsiveWorking) this.testResults.summary.passedTests++;
        else this.testResults.summary.failedTests++;
        this.testResults.summary.totalTests++;
      } catch (error) {
        this.testResults.responsiveDesign[viewport.name.toLowerCase()] = {
          status: 'error',
          message: error.message
        };
        this.testResults.summary.failedTests++;
        this.testResults.summary.totalTests++;
        console.log(`❌ ${viewport.name}: ERROR - ${error.message}`);
      }
    }
    
    // Reset to desktop viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async testIntegration() {
    console.log('\n🔗 Step 7: Testing integration...');
    
    // Test Supabase integration
    console.log('Testing Supabase integration...');
    try {
      const supabaseLoaded = await this.page.evaluate(() => {
        return typeof window.supabase !== 'undefined' || 
               document.querySelector('script[src*="supabase"]') !== null;
      });
      
      this.testResults.integration.supabase = {
        status: supabaseLoaded ? 'pass' : 'fail',
        message: `Supabase integration: ${supabaseLoaded ? 'LOADED' : 'NOT DETECTED'}`
      };
      console.log(`${supabaseLoaded ? '✅' : '❌'} Supabase integration: ${supabaseLoaded ? 'LOADED' : 'NOT DETECTED'}`);
      
      if (supabaseLoaded) this.testResults.summary.passedTests++;
      else this.testResults.summary.warnings.push('Supabase integration may not be properly configured');
      this.testResults.summary.totalTests++;
    } catch (error) {
      this.testResults.integration.supabase = {
        status: 'error',
        message: error.message
      };
      this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
      console.log(`❌ Supabase integration: ERROR - ${error.message}`);
    }

    // Test authentication state
    console.log('Testing authentication state...');
    try {
      const authState = await this.page.evaluate(() => {
        // Check for common auth indicators
        const hasAuthContext = document.querySelector('[data-authenticated]') !== null;
        const hasUserMenu = document.querySelector('.user-menu, .avatar, .profile') !== null;
        const hasLogoutButton = document.querySelector('button:has-text("Logout"), button:has-text("Sign Out")') !== null;
        
        return {
          hasAuthContext,
          hasUserMenu,
          hasLogoutButton,
          isAuthenticated: hasUserMenu || hasLogoutButton
        };
      });
      
      const authWorking = authState.isAuthenticated;
      this.testResults.integration.authentication = {
        status: authWorking ? 'pass' : 'fail',
        message: `Authentication state: ${authWorking ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`
      };
      console.log(`${authWorking ? '✅' : '❌'} Authentication state: ${authWorking ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`);
      
      if (authWorking) this.testResults.summary.passedTests++;
      else this.testResults.summary.warnings.push('User may not be authenticated - some features may not work');
      this.testResults.summary.totalTests++;
    } catch (error) {
      this.testResults.integration.authentication = {
        status: 'error',
        message: error.message
      };
      this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
      console.log(`❌ Authentication state: ERROR - ${error.message}`);
    }
  }

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `log-trade-test-${name}-${timestamp}.png`;
    const screenshotPath = path.join(__dirname, filename);
    
    try {
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      this.screenshots.push({
        name,
        filename,
        path: screenshotPath,
        timestamp: new Date().toISOString()
      });
      console.log(`📸 Screenshot saved: ${filename}`);
      return screenshotPath;
    } catch (error) {
      console.error(`❌ Failed to take screenshot ${name}:`, error.message);
      return null;
    }
  }

  async generateReport() {
    console.log('\n📊 Step 8: Generating comprehensive test report...');
    
    const reportTimestamp = new Date().toISOString();
    const reportFilename = `log-trade-test-report-${reportTimestamp.replace(/[:.]/g, '-')}.json`;
    const reportPath = path.join(__dirname, reportFilename);
    
    const report = {
      timestamp: reportTimestamp,
      testSuite: 'Log Trade Page Simple Test',
      version: '1.0.0',
      environment: {
        userAgent: await this.page.evaluate(() => navigator.userAgent),
        viewport: await this.page.viewport(),
        url: this.page.url()
      },
      results: this.testResults,
      screenshots: this.screenshots,
      summary: {
        ...this.testResults.summary,
        successRate: this.testResults.summary.totalTests > 0 ? 
          (this.testResults.summary.passedTests / this.testResults.summary.totalTests * 100).toFixed(2) + '%' : 
          '0%',
        status: this.testResults.summary.criticalIssues.length > 0 ? 'FAILED' : 
                this.testResults.summary.warnings.length > 0 ? 'WARNING' : 'PASSED'
      }
    };
    
    try {
      require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 Test report saved: ${reportFilename}`);
      
      // Generate markdown report
      const markdownReport = this.generateMarkdownReport(report);
      const markdownFilename = `log-trade-test-report-${reportTimestamp.replace(/[:.]/g, '-')}.md`;
      const markdownPath = path.join(__dirname, markdownFilename);
      
      require('fs').writeFileSync(markdownPath, markdownReport);
      console.log(`📄 Markdown report saved: ${markdownFilename}`);
      
      return { reportPath, markdownPath };
    } catch (error) {
      console.error('❌ Failed to save test report:', error.message);
      return null;
    }
  }

  generateMarkdownReport(report) {
    const { results, summary, screenshots } = report;
    
    let markdown = `# Log Trade Page Test Report\n\n`;
    markdown += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
    markdown += `**Status:** ${summary.status}\n\n`;
    markdown += `**Success Rate:** ${summary.successRate}\n\n`;
    markdown += `**Total Tests:** ${summary.totalTests}\n\n`;
    markdown += `**Passed:** ${summary.passedTests}\n\n`;
    markdown += `**Failed:** ${summary.failedTests}\n\n`;
    
    if (summary.criticalIssues.length > 0) {
      markdown += `## 🚨 Critical Issues\n\n`;
      summary.criticalIssues.forEach(issue => {
        markdown += `- ${issue}\n`;
      });
      markdown += `\n`;
    }
    
    if (summary.warnings.length > 0) {
      markdown += `## ⚠️ Warnings\n\n`;
      summary.warnings.forEach(warning => {
        markdown += `- ${warning}\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `## 📋 Test Results\n\n`;
    
    // Page Loading Results
    markdown += `### Page Loading and Initial State\n\n`;
    Object.entries(results.pageLoading).forEach(([test, result]) => {
      const status = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      markdown += `${status} **${test}:** ${result.message}\n`;
    });
    markdown += `\n`;
    
    // Interactive Elements Results
    markdown += `### Interactive Elements\n\n`;
    Object.entries(results.interactiveElements).forEach(([test, result]) => {
      const status = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      markdown += `${status} **${test}:** ${result.message}\n`;
    });
    markdown += `\n`;
    
    // Animations Results
    markdown += `### Animations and Visual Effects\n\n`;
    Object.entries(results.animations).forEach(([test, result]) => {
      const status = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      markdown += `${status} **${test}:** ${result.message}\n`;
    });
    markdown += `\n`;
    
    // Form Functionality Results
    markdown += `### Form Functionality\n\n`;
    Object.entries(results.formFunctionality).forEach(([test, result]) => {
      const status = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      markdown += `${status} **${test}:** ${result.message}\n`;
    });
    markdown += `\n`;
    
    // Responsive Design Results
    markdown += `### Responsive Design\n\n`;
    Object.entries(results.responsiveDesign).forEach(([test, result]) => {
      const status = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      markdown += `${status} **${test}:** ${result.message}\n`;
    });
    markdown += `\n`;
    
    // Integration Results
    markdown += `### Integration\n\n`;
    Object.entries(results.integration).forEach(([test, result]) => {
      const status = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      markdown += `${status} **${test}:** ${result.message}\n`;
    });
    markdown += `\n`;
    
    // Screenshots
    markdown += `## 📸 Screenshots\n\n`;
    screenshots.forEach(screenshot => {
      markdown += `- **${screenshot.name}:** ${screenshot.filename}\n`;
    });
    markdown += `\n`;
    
    markdown += `---\n\n`;
    markdown += `*Report generated by Log Trade Page Test Suite*\n`;
    
    return markdown;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    try {
      await this.init();
      
      if (!await this.navigateToLogTradePage()) {
        console.error('❌ Cannot proceed with tests - failed to navigate to log trade page');
        return;
      }
      
      await this.testPageLoadingAndInitialState();
      await this.testInteractiveElements();
      await this.testAnimationsAndVisualEffects();
      await this.testFormFunctionality();
      await this.testResponsiveDesign();
      await this.testIntegration();
      
      const reportPaths = await this.generateReport();
      
      console.log('\n🎉 Test suite completed!');
      console.log(`📊 Summary: ${this.testResults.summary.passedTests}/${this.testResults.summary.totalTests} tests passed`);
      console.log(`📈 Success Rate: ${this.testResults.summary.successRate}`);
      console.log(`🚨 Critical Issues: ${this.testResults.summary.criticalIssues.length}`);
      console.log(`⚠️ Warnings: ${this.testResults.summary.warnings.length}`);
      
      if (reportPaths) {
        console.log(`📄 Reports generated:`);
        console.log(`   - JSON: ${reportPaths.reportPath}`);
        console.log(`   - Markdown: ${reportPaths.markdownPath}`);
      }
      
      return this.testResults;
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      return null;
    } finally {
      await this.cleanup();
    }
  }
}

// Run test suite
if (require.main === module) {
  const tester = new SimpleLogTradeTester();
  tester.runAllTests().then(results => {
    if (results) {
      process.exit(results.summary.criticalIssues.length > 0 ? 1 : 0);
    } else {
      process.exit(1);
    }
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = SimpleLogTradeTester;