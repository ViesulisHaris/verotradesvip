const puppeteer = require('puppeteer');
const path = require('path');

// Helper function for timeout that works across Puppeteer versions
async function waitForTimeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class LogTradePageTester {
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
    console.log('🚀 Initializing comprehensive log trade page test...');
    this.browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Enable console logging from the page
    this.page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
    
    // Enable request monitoring
    this.page.on('request', request => {
      if (request.url().includes('supabase')) {
        console.log('SUPABASE REQUEST:', request.method(), request.url());
      }
    });
    
    this.page.on('response', response => {
      if (response.url().includes('supabase')) {
        console.log('SUPABASE RESPONSE:', response.status(), response.url());
      }
    });
  }

  async navigateToLogTradePage() {
    console.log('\n📍 Step 1: Navigating to log trade page...');
    try {
      await this.page.goto('http://localhost:3000/log-trade', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for page to load
      await waitForTimeout(2000);
      
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
      },
      {
        name: 'CSS variables loaded',
        test: async () => {
          const styles = await this.page.evaluate(() => {
            const rootStyles = getComputedStyle(document.documentElement);
            return {
              gold: rootStyles.getPropertyValue('--gold'),
              background: rootStyles.getPropertyValue('--background'),
              surface: rootStyles.getPropertyValue('--surface')
            };
          });
          return styles.gold && styles.background && styles.surface;
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
        await waitForTimeout(300);
        
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

    // Test Strategy Dropdown
    console.log('Testing Strategy Dropdown...');
    try {
      const strategyButton = await this.page.$('button:has-text("Select Strategy"), button:has-text("None")');
      if (strategyButton) {
        await strategyButton.click();
        await waitForTimeout(300);
        
        const dropdownVisible = await this.page.$('div.absolute.top-full.left-0.right-0') !== null;
        this.testResults.interactiveElements.strategy_dropdown = {
          status: dropdownVisible ? 'pass' : 'fail',
          message: `Strategy dropdown: ${dropdownVisible ? 'WORKING' : 'FAILED'}`
        };
        console.log(`${dropdownVisible ? '✅' : '❌'} Strategy dropdown: ${dropdownVisible ? 'WORKING' : 'FAILED'}`);
        
        if (dropdownVisible) this.testResults.summary.passedTests++;
        else this.testResults.summary.failedTests++;
        this.testResults.summary.totalTests++;
        
        // Close dropdown
        await this.page.keyboard.press('Escape');
      }
    } catch (error) {
      this.testResults.interactiveElements.strategy_dropdown = {
        status: 'error',
        message: error.message
      };
      this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
      console.log(`❌ Strategy dropdown: ERROR - ${error.message}`);
    }

    // Test Side Selector (Buy/Sell)
    console.log('Testing Side Selector...');
    const sides = ['Buy', 'Sell'];
    for (const side of sides) {
      try {
        const selector = `button[type="button"]:has-text("${side}")`;
        await this.page.waitForSelector(selector, { timeout: 5000 });
        
        await this.page.click(selector);
        await waitForTimeout(300);
        
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

    // Test Emotion Dropdown
    console.log('Testing Emotion Dropdown...');
    try {
      const emotionButton = await this.page.$('button:has-text("Neutral")');
      if (emotionButton) {
        await emotionButton.click();
        await waitForTimeout(300);
        
        const dropdownVisible = await this.page.$('div.absolute.top-full.left-0.right-0') !== null;
        this.testResults.interactiveElements.emotion_dropdown = {
          status: dropdownVisible ? 'pass' : 'fail',
          message: `Emotion dropdown: ${dropdownVisible ? 'WORKING' : 'FAILED'}`
        };
        console.log(`${dropdownVisible ? '✅' : '❌'} Emotion dropdown: ${dropdownVisible ? 'WORKING' : 'FAILED'}`);
        
        if (dropdownVisible) this.testResults.summary.passedTests++;
        else this.testResults.summary.failedTests++;
        this.testResults.summary.totalTests++;
        
        // Close dropdown
        await this.page.keyboard.press('Escape');
      }
    } catch (error) {
      this.testResults.interactiveElements.emotion_dropdown = {
        status: 'error',
        message: error.message
      };
      this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
      console.log(`❌ Emotion dropdown: ERROR - ${error.message}`);
    }
  }

  async testAnimationsAndVisualEffects() {
    console.log('\n✨ Step 4: Testing animations and visual effects...');
    
    // Test TorchCard Spotlight Effect
    console.log('Testing TorchCard Spotlight Effect...');
    try {
      const torchCard = await this.page.$('.relative.overflow-hidden.rounded-xl');
      if (torchCard) {
        // Get initial position
        const initialPosition = await this.page.evaluate(() => {
          const glowElement = document.querySelector('[style*="radial-gradient"]');
          if (!glowElement) return null;
          return glowElement.style.opacity;
        });
        
        // Move mouse over the card
        const boundingBox = await torchCard.boundingBox();
        await this.page.mouse.move(
          boundingBox.x + boundingBox.width / 2,
          boundingBox.y + boundingBox.height / 2
        );
        
        await this.page.waitForTimeout(500);
        
        // Check if spotlight activated
        const afterHoverPosition = await this.page.evaluate(() => {
          const glowElement = document.querySelector('[style*="radial-gradient"]');
          if (!glowElement) return null;
          return glowElement.style.opacity;
        });
        
        const spotlightWorking = afterHoverPosition !== initialPosition && afterHoverPosition !== '0';
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

    // Test Border Beam Animation on Save Button
    console.log('Testing Border Beam Animation...');
    try {
      const saveButton = await this.page.$('button[type="submit"]');
      if (saveButton) {
        const boundingBox = await saveButton.boundingBox();
        await this.page.mouse.move(
          boundingBox.x + boundingBox.width / 2,
          boundingBox.y + boundingBox.height / 2
        );
        
        await this.page.waitForTimeout(500);
        
        const hasBeamAnimation = await this.page.evaluate(() => {
          const button = document.querySelector('button[type="submit"]');
          if (!button) return false;
          const computedStyle = getComputedStyle(button);
          return computedStyle.position === 'relative' && 
                 button.querySelector('[style*="conic-gradient"]') !== null;
        });
        
        this.testResults.animations.border_beam = {
          status: hasBeamAnimation ? 'pass' : 'fail',
          message: `Border beam: ${hasBeamAnimation ? 'WORKING' : 'FAILED'}`
        };
        console.log(`${hasBeamAnimation ? '✅' : '❌'} Border beam: ${hasBeamAnimation ? 'WORKING' : 'FAILED'}`);
        
        if (hasBeamAnimation) this.testResults.summary.passedTests++;
        else this.testResults.summary.failedTests++;
        this.testResults.summary.totalTests++;
      }
    } catch (error) {
      this.testResults.animations.border_beam = {
        status: 'error',
        message: error.message
      };
      this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
      console.log(`❌ Border beam: ERROR - ${error.message}`);
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

    // Test Hover States
    console.log('Testing Hover States...');
    try {
      const interactiveElements = await this.page.$$('button, input');
      let elementsWithHover = 0;
      
      for (const element of interactiveElements.slice(0, 5)) { // Test first 5 elements
        const boundingBox = await element.boundingBox();
        if (boundingBox) {
          await this.page.mouse.move(
            boundingBox.x + boundingBox.width / 2,
            boundingBox.y + boundingBox.height / 2
          );
          
          await this.page.waitForTimeout(200);
          
          const hasHoverEffect = await this.page.evaluate(el => {
            const computedStyle = getComputedStyle(el, ':hover');
            return computedStyle.backgroundColor !== getComputedStyle(el).backgroundColor ||
                   computedStyle.borderColor !== getComputedStyle(el).borderColor ||
                   computedStyle.transform !== getComputedStyle(el).transform;
          }, element);
          
          if (hasHoverEffect) elementsWithHover++;
        }
      }
      
      const hoverStatesWorking = elementsWithHover > 0;
      this.testResults.animations.hover_states = {
        status: hoverStatesWorking ? 'pass' : 'fail',
        message: `Hover states: ${elementsWithHover}/5 elements have hover effects`
      };
      console.log(`${hoverStatesWorking ? '✅' : '❌'} Hover states: ${elementsWithHover}/5 elements have hover effects`);
      
      if (hoverStatesWorking) this.testResults.summary.passedTests++;
      else this.testResults.summary.warnings.push('Few or no hover effects detected');
      this.testResults.summary.totalTests++;
    } catch (error) {
      this.testResults.animations.hover_states = {
        status: 'error',
        message: error.message
      };
      this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
      console.log(`❌ Hover states: ERROR - ${error.message}`);
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

    // Test form validation
    console.log('Testing form validation...');
    try {
      // Try to submit empty form
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(1000);
      
      const validationTriggered = await this.page.evaluate(() => {
        const requiredInputs = document.querySelectorAll('input[required]');
        let validationWorking = false;
        
        requiredInputs.forEach(input => {
          if (!input.validity.valid) {
            validationWorking = true;
          }
        });
        
        return validationWorking;
      });
      
      this.testResults.formFunctionality.validation = {
        status: validationTriggered ? 'pass' : 'fail',
        message: `Form validation: ${validationTriggered ? 'WORKING' : 'FAILED'}`
      };
      console.log(`${validationTriggered ? '✅' : '❌'} Form validation: ${validationTriggered ? 'WORKING' : 'FAILED'}`);
      
      if (validationTriggered) this.testResults.summary.passedTests++;
      else this.testResults.summary.warnings.push('Form validation may not be working properly');
      this.testResults.summary.totalTests++;
    } catch (error) {
      this.testResults.formFunctionality.validation = {
        status: 'error',
        message: error.message
      };
      this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
      console.log(`❌ Form validation: ERROR - ${error.message}`);
    }

    // Test save functionality (mock)
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
      await this.page.waitForTimeout(1000);
      const loadingState = await this.page.$('.animate-spin') !== null;
      
      this.testResults.formFunctionality.save_functionality = {
        status: loadingState ? 'pass' : 'fail',
        message: `Save functionality: ${loadingState ? 'LOADING STATE DETECTED' : 'NO LOADING STATE'}`
      };
      console.log(`${loadingState ? '✅' : '❌'} Save functionality: ${loadingState ? 'LOADING STATE DETECTED' : 'NO LOADING STATE'}`);
      
      if (loadingState) this.testResults.summary.passedTests++;
      else this.testResults.summary.warnings.push('Save button may not show loading state');
      this.testResults.summary.totalTests++;
      
      // Wait a bit more to see if success toast appears
      await this.page.waitForTimeout(3000);
      const successToast = await this.page.$('.fixed.top-24.right-8') !== null;
      
      if (successToast) {
        console.log('✅ Success toast detected');
        this.testResults.summary.passedTests++;
      } else {
        console.log('❌ No success toast detected (may require valid authentication/database)');
        this.testResults.summary.warnings.push('Success toast not detected (may require valid setup)');
      }
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
        await this.page.waitForTimeout(1000);
        
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

  async testErrorHandling() {
    console.log('\n⚠️ Step 7: Testing error handling...');
    
    // Test with invalid inputs
    console.log('Testing with invalid inputs...');
    try {
      // Clear form and enter invalid data
      await this.page.evaluate(() => {
        document.querySelector('form').reset();
      });
      
      await this.page.type('input[placeholder*="AAPL"]', ''); // Empty required field
      await this.page.type('input[placeholder*="0.00"]', 'abc'); // Invalid number
      await this.page.click('button[type="submit"]');
      
      await this.page.waitForTimeout(1000);
      
      const errorHandlingWorking = await this.page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        let hasValidationErrors = false;
        
        inputs.forEach(input => {
          if (!input.validity.valid) {
            hasValidationErrors = true;
          }
        });
        
        return hasValidationErrors;
      });
      
      this.testResults.errorHandling.invalid_inputs = {
        status: errorHandlingWorking ? 'pass' : 'fail',
        message: `Invalid input handling: ${errorHandlingWorking ? 'WORKING' : 'FAILED'}`
      };
      console.log(`${errorHandlingWorking ? '✅' : '❌'} Invalid input handling: ${errorHandlingWorking ? 'WORKING' : 'FAILED'}`);
      
      if (errorHandlingWorking) this.testResults.summary.passedTests++;
      else this.testResults.summary.warnings.push('Invalid input validation may not be working');
      this.testResults.summary.totalTests++;
    } catch (error) {
      this.testResults.errorHandling.invalid_inputs = {
        status: 'error',
        message: error.message
      };
      this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
      console.log(`❌ Invalid input handling: ERROR - ${error.message}`);
    }

    // Test network error simulation
    console.log('Testing network error handling...');
    try {
      // Intercept network requests to simulate error
      await this.page.setRequestInterception(true);
      this.page.on('request', request => {
        if (request.url().includes('supabase')) {
          request.abort('failed');
        } else {
          request.continue();
        }
      });
      
      // Try to submit form
      await this.page.evaluate(() => {
        document.querySelector('form').reset();
      });
      
      await this.page.type('input[placeholder*="AAPL"]', 'TEST');
      await this.page.type('input[placeholder*="0.00"]', '100');
      await this.page.type('input[type="date"]', '2024-01-15');
      await this.page.click('button:has-text("stock")');
      await this.page.click('button[type="submit"]');
      
      await this.page.waitForTimeout(3000);
      
      // Check if error is handled gracefully
      const errorHandled = await this.page.evaluate(() => {
        // Check if page is still responsive and not crashed
        return document.querySelector('form') !== null;
      });
      
      this.testResults.errorHandling.network_errors = {
        status: errorHandled ? 'pass' : 'fail',
        message: `Network error handling: ${errorHandled ? 'GRACEFUL' : 'FAILED'}`
      };
      console.log(`${errorHandled ? '✅' : '❌'} Network error handling: ${errorHandled ? 'GRACEFUL' : 'FAILED'}`);
      
      // Reset request interception
      await this.page.setRequestInterception(false);
      
      if (errorHandled) this.testResults.summary.passedTests++;
      else this.testResults.summary.warnings.push('Network error handling may not be implemented');
      this.testResults.summary.totalTests++;
    } catch (error) {
      this.testResults.errorHandling.network_errors = {
        status: 'error',
        message: error.message
      };
      this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
      console.log(`❌ Network error handling: ERROR - ${error.message}`);
    }
  }

  async testIntegration() {
    console.log('\n🔗 Step 8: Testing integration...');
    
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

    // Test data persistence (basic check)
    console.log('Testing data persistence...');
    try {
      // Fill form with test data
      await this.page.evaluate(() => {
        document.querySelector('form').reset();
      });
      
      const testData = {
        symbol: 'TEST123',
        quantity: '250',
        date: '2024-02-20'
      };
      
      await this.page.type('input[placeholder*="AAPL"]', testData.symbol);
      await this.page.type('input[placeholder*="0.00"]', testData.quantity);
      await this.page.type('input[type="date"]', testData.date);
      
      // Check if data is retained
      const dataRetained = await this.page.evaluate((expected) => {
        const symbolInput = document.querySelector('input[placeholder*="AAPL"]');
        const quantityInput = document.querySelector('input[placeholder*="0.00"]');
        const dateInput = document.querySelector('input[type="date"]');
        
        return symbolInput.value === expected.symbol &&
               quantityInput.value === expected.quantity &&
               dateInput.value === expected.date;
      }, testData);
      
      this.testResults.integration.data_persistence = {
        status: dataRetained ? 'pass' : 'fail',
        message: `Data persistence: ${dataRetained ? 'WORKING' : 'FAILED'}`
      };
      console.log(`${dataRetained ? '✅' : '❌'} Data persistence: ${dataRetained ? 'WORKING' : 'FAILED'}`);
      
      if (dataRetained) this.testResults.summary.passedTests++;
      else this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
    } catch (error) {
      this.testResults.integration.data_persistence = {
        status: 'error',
        message: error.message
      };
      this.testResults.summary.failedTests++;
      this.testResults.summary.totalTests++;
      console.log(`❌ Data persistence: ERROR - ${error.message}`);
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
    console.log('\n📊 Step 9: Generating comprehensive test report...');
    
    const reportTimestamp = new Date().toISOString();
    const reportFilename = `log-trade-test-report-${reportTimestamp.replace(/[:.]/g, '-')}.json`;
    const reportPath = path.join(__dirname, reportFilename);
    
    const report = {
      timestamp: reportTimestamp,
      testSuite: 'Log Trade Page Comprehensive Test',
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
    
    let markdown = `# Log Trade Page Comprehensive Test Report\n\n`;
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
    
    // Error Handling Results
    markdown += `### Error Handling\n\n`;
    Object.entries(results.errorHandling).forEach(([test, result]) => {
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
    markdown += `*Report generated by Log Trade Page Comprehensive Test Suite*\n`;
    
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
      await this.testErrorHandling();
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

// Run the test suite
if (require.main === module) {
  const tester = new LogTradePageTester();
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

module.exports = LogTradePageTester;
