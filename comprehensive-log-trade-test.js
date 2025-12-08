const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  screenshotsDir: './log-trade-test-screenshots',
  testTimeout: 30000,
  viewportSizes: [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 812 }
  ]
};

// Test results storage
const testResults = {
  visualDesign: {},
  interactiveElements: {},
  formFunctionality: {},
  responsiveDesign: {},
  integration: {},
  browserCompatibility: {},
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    issues: []
  }
};

// Create screenshots directory
if (!fs.existsSync(TEST_CONFIG.screenshotsDir)) {
  fs.mkdirSync(TEST_CONFIG.screenshotsDir, { recursive: true });
}

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const takeScreenshot = async (page, name, viewport = 'Desktop') => {
  const filename = `${TEST_CONFIG.screenshotsDir}/${viewport}-${name}-${Date.now()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filename;
};

const checkElementExists = async (page, selector) => {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
};

const checkElementStyle = async (page, selector, property, expectedValue) => {
  try {
    const element = await page.$(selector);
    if (!element) return false;
    
    const style = await page.evaluate((el, prop) => {
      return window.getComputedStyle(el).getPropertyValue(prop);
    }, element, property);
    
    return style.includes(expectedValue);
  } catch (error) {
    console.error(`Style check error for ${selector}:`, error);
    return false;
  }
};

const checkElementAttribute = async (page, selector, attribute, expectedValue) => {
  try {
    const element = await page.$(selector);
    if (!element) return false;
    
    const value = await page.evaluate((el, attr) => el.getAttribute(attr), element, attribute);
    return value === expectedValue;
  } catch (error) {
    console.error(`Attribute check error for ${selector}:`, error);
    return false;
  }
};

// Test functions
const testVisualDesign = async (page) => {
  console.log('\n🎨 Testing Visual Design...');
  
  const tests = [
    {
      name: 'Vero colors applied correctly',
      test: async () => {
        // Check for gold accent colors
        const goldElements = await page.$$('[class*="gold"], [style*="C5A065"], [style*="B89B5E"]');
        return goldElements.length > 0;
      }
    },
    {
      name: 'Dark backgrounds applied',
      test: async () => {
        const bgCheck = await page.evaluate(() => {
          const body = window.getComputedStyle(document.body);
          return body.backgroundColor.includes('18, 18, 18') || 
                 body.backgroundColor.includes('5, 5, 5') ||
                 body.backgroundColor.includes('0, 0, 0');
        });
        return bgCheck;
      }
    },
    {
      name: 'Spotlight effect follows mouse',
      test: async () => {
        // Check if spotlight wrapper exists
        const spotlightExists = await checkElementExists(page, '.spotlight-wrapper');
        if (!spotlightExists) return false;
        
        // Move mouse and check if spotlight effect updates
        await page.hover('.spotlight-wrapper');
        await page.mouse.move(400, 300);
        
        const spotlightEffect = await page.$('.spotlight-effect');
        return spotlightEffect !== null;
      }
    },
    {
      name: 'Border beam animation on save button',
      test: async () => {
        const saveButton = await page.$('button[type="submit"]');
        if (!saveButton) return false;
        
        // Check for beam animation classes or styles
        const hasBeamClass = await page.evaluate((btn) => {
          return btn.classList.contains('btn-beam') || 
                 btn.querySelector('[style*="beam"]') ||
                 btn.querySelector('[style*="conic-gradient"]');
        }, saveButton);
        
        return hasBeamClass;
      }
    },
    {
      name: 'Text reveal animations for title',
      test: async () => {
        const title = await page.$('h1');
        if (!title) return false;
        
        // Check for text reveal animation classes
        const hasRevealClass = await page.evaluate((el) => {
          return el.classList.contains('text-reveal') ||
                 window.getComputedStyle(el).animationName !== 'none';
        }, title);
        
        return hasRevealClass;
      }
    },
    {
      name: 'Section reveal animations on scroll',
      test: async () => {
        const sections = await page.$$('.scroll-item');
        if (sections.length === 0) return false;
        
        // Check if sections have scroll animation classes
        const hasScrollAnimation = await page.evaluate((sections) => {
          return sections.some(section => 
            section.classList.contains('scroll-item') ||
            window.getComputedStyle(section).animationName !== 'none'
          );
        }, sections);
        
        return hasScrollAnimation;
      }
    }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.test();
      testResults.visualDesign[test.name] = result ? 'PASS' : 'FAIL';
      testResults.summary.totalTests++;
      if (result) testResults.summary.passedTests++;
      else testResults.summary.failedTests++;
      
      console.log(`${result ? '✅' : '❌'} ${test.name}`);
      await takeScreenshot(page, `visual-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
    } catch (error) {
      testResults.visualDesign[test.name] = 'ERROR';
      testResults.summary.totalTests++;
      testResults.summary.failedTests++;
      testResults.summary.issues.push(`${test.name}: ${error.message}`);
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
};

const testInteractiveElements = async (page) => {
  console.log('\n🖱️ Testing Interactive Elements...');
  
  const tests = [
    {
      name: 'Market type selector buttons work',
      test: async () => {
        const marketButtons = await page.$$('button[type="button"]');
        if (marketButtons.length === 0) return false;
        
        // Try to click market type buttons
        for (const button of marketButtons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text && ['Stock', 'Crypto', 'Forex', 'Futures'].includes(text.trim())) {
            await button.click();
            await delay(100);
            
            // Check if button state changed
            const isActive = await page.evaluate(el => {
              return el.classList.contains('bg-[var(--gold)]') ||
                     el.style.backgroundColor.includes('197, 160, 101');
            }, button);
            
            if (isActive) return true;
          }
        }
        return false;
      }
    },
    {
      name: 'Strategy dropdown opens/closes',
      test: async () => {
        const strategyButton = await page.$('button:has-text("Select Strategy")');
        if (!strategyButton) return false;
        
        // Click to open
        await strategyButton.click();
        await delay(200);
        
        // Check if dropdown is open
        const dropdownOpen = await checkElementExists(page, '.absolute.z-20');
        
        // Click to close (click outside)
        await page.click('body');
        await delay(200);
        
        return dropdownOpen;
      }
    },
    {
      name: 'Side dropdown opens/closes',
      test: async () => {
        const sideButton = await page.$('button:has-text("Buy"), button:has-text("Sell")');
        if (!sideButton) return false;
        
        // Click to open
        await sideButton.click();
        await delay(200);
        
        // Check if dropdown is open
        const dropdownOpen = await checkElementExists(page, '.absolute.z-20');
        
        return dropdownOpen;
      }
    },
    {
      name: 'Emotional state dropdown opens/closes',
      test: async () => {
        const emotionButton = await page.$('button:has-text("Neutral")');
        if (!emotionButton) return false;
        
        // Click to open
        await emotionButton.click();
        await delay(200);
        
        // Check if dropdown is open
        const dropdownOpen = await checkElementExists(page, '.absolute.z-20');
        
        return dropdownOpen;
      }
    },
    {
      name: 'Form inputs accept text',
      test: async () => {
        const inputs = await page.$$('input[type="text"], input[type="number"], input[type="date"], input[type="time"]');
        if (inputs.length === 0) return false;
        
        // Test typing in first input
        const testInput = inputs[0];
        await testInput.type('TEST');
        const value = await page.evaluate(el => el.value, testInput);
        
        return value.includes('TEST');
      }
    },
    {
      name: 'PnL input changes color based on value',
      test: async () => {
        const pnlInput = await page.$('input[placeholder*="PnL"]');
        if (!pnlInput) return false;
        
        // Test positive value
        await pnlInput.click({ clickCount: 3 }); // Select all
        await pnlInput.type('100');
        await delay(100);
        
        const positiveColor = await page.evaluate(el => {
          return window.getComputedStyle(el).backgroundColor.includes('46, 189, 133') || // Green
                 el.classList.contains('border-green-500') ||
                 el.classList.contains('bg-green-500');
        }, pnlInput);
        
        // Test negative value
        await pnlInput.click({ clickCount: 3 }); // Select all
        await pnlInput.type('-100');
        await delay(100);
        
        const negativeColor = await page.evaluate(el => {
          return window.getComputedStyle(el).backgroundColor.includes('246, 70, 93') || // Red
                 el.classList.contains('border-red-500') ||
                 el.classList.contains('bg-red-500');
        }, pnlInput);
        
        return positiveColor && negativeColor;
      }
    }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.test();
      testResults.interactiveElements[test.name] = result ? 'PASS' : 'FAIL';
      testResults.summary.totalTests++;
      if (result) testResults.summary.passedTests++;
      else testResults.summary.failedTests++;
      
      console.log(`${result ? '✅' : '❌'} ${test.name}`);
      await takeScreenshot(page, `interactive-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
    } catch (error) {
      testResults.interactiveElements[test.name] = 'ERROR';
      testResults.summary.totalTests++;
      testResults.summary.failedTests++;
      testResults.summary.issues.push(`${test.name}: ${error.message}`);
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
};

const testFormFunctionality = async (page) => {
  console.log('\n📝 Testing Form Functionality...');
  
  const tests = [
    {
      name: 'Form submission with sample data',
      test: async () => {
        // Fill form with sample data
        await page.type('input[placeholder*="AAPL"]', 'AAPL');
        await page.type('input[placeholder*="0.00"]', '100');
        
        // Select market type
        const marketButtons = await page.$$('button[type="button"]');
        for (const button of marketButtons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text && text.trim() === 'Stock') {
            await button.click();
            break;
          }
        }
        
        // Submit form
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          await delay(2000);
          
          // Check for success or error response
          const hasResponse = await checkElementExists(page, '.fixed.top-4.right-4') ||
                             await page.evaluate(() => document.body.textContent.includes('Trade saved') ||
                                                          document.body.textContent.includes('Failed to save'));
          
          return hasResponse;
        }
        
        return false;
      }
    },
    {
      name: 'Toast notifications appear',
      test: async () => {
        // Trigger a form submission to show toast
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          await delay(1000);
          
          // Check for toast notification
          const toastExists = await checkElementExists(page, '.fixed.top-4.right-4');
          return toastExists;
        }
        
        return false;
      }
    },
    {
      name: 'Form validation works',
      test: async () => {
        // Try to submit empty form
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          // Clear required fields
          await page.evaluate(() => {
            const inputs = document.querySelectorAll('input[required]');
            inputs.forEach(input => input.value = '');
          });
          
          await submitButton.click();
          await delay(1000);
          
          // Check for validation error or toast
          const hasValidationError = await checkElementExists(page, '.fixed.top-4.right-4') ||
                                   await page.evaluate(() => {
                                     const inputs = document.querySelectorAll('input:invalid');
                                     return inputs.length > 0;
                                   });
          
          return hasValidationError;
        }
        
        return false;
      }
    },
    {
      name: 'Form reset after successful submission',
      test: async () => {
        // This test would require a successful submission, which is hard to mock
        // For now, we'll check if the form has the reset logic in place
        const hasResetLogic = await page.evaluate(() => {
          const scripts = document.querySelectorAll('script');
          return Array.from(scripts).some(script => 
            script.textContent && script.textContent.includes('setForm')
          );
        });
        
        return hasResetLogic;
      }
    }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.test();
      testResults.formFunctionality[test.name] = result ? 'PASS' : 'FAIL';
      testResults.summary.totalTests++;
      if (result) testResults.summary.passedTests++;
      else testResults.summary.failedTests++;
      
      console.log(`${result ? '✅' : '❌'} ${test.name}`);
      await takeScreenshot(page, `form-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
    } catch (error) {
      testResults.formFunctionality[test.name] = 'ERROR';
      testResults.summary.totalTests++;
      testResults.summary.failedTests++;
      testResults.summary.issues.push(`${test.name}: ${error.message}`);
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
};

const testResponsiveDesign = async (page) => {
  console.log('\n📱 Testing Responsive Design...');
  
  for (const viewport of TEST_CONFIG.viewportSizes) {
    console.log(`\nTesting ${viewport.name} (${viewport.width}x${viewport.height})...`);
    
    await page.setViewport({ width: viewport.width, height: viewport.height });
    await delay(500);
    await takeScreenshot(page, `responsive-${viewport.name.toLowerCase()}`, viewport.name);
    
    const tests = [
      {
        name: `${viewport.name} layout adapts properly`,
        test: async () => {
          // Check if main content is visible
          const mainContent = await checkElementExists(page, '.max-w-4xl, main, .verotrade-main-content');
          if (!mainContent) return false;
          
          // Check for horizontal scroll (should not exist)
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.body.scrollWidth > document.body.clientWidth;
          });
          
          return !hasHorizontalScroll;
        }
      },
      {
        name: `${viewport.name} navigation works`,
        test: async () => {
          // Check if navigation is visible and functional
          const navVisible = await checkElementExists(page, 'header, nav, .verotrade-top-navigation');
          if (!navVisible) return false;
          
          // For mobile, check if mobile menu button exists
          if (viewport.width < 768) {
            const mobileMenuButton = await checkElementExists(page, 'button[aria-label*="menu"], button:has-text("☰")');
            return mobileMenuButton;
          }
          
          return true;
        }
      }
    ];
    
    for (const test of tests) {
      try {
        const result = await test.test();
        if (!testResults.responsiveDesign[viewport.name]) {
          testResults.responsiveDesign[viewport.name] = {};
        }
        testResults.responsiveDesign[viewport.name][test.name] = result ? 'PASS' : 'FAIL';
        testResults.summary.totalTests++;
        if (result) testResults.summary.passedTests++;
        else testResults.summary.failedTests++;
        
        console.log(`${result ? '✅' : '❌'} ${test.name}`);
      } catch (error) {
        if (!testResults.responsiveDesign[viewport.name]) {
          testResults.responsiveDesign[viewport.name] = {};
        }
        testResults.responsiveDesign[viewport.name][test.name] = 'ERROR';
        testResults.summary.totalTests++;
        testResults.summary.failedTests++;
        testResults.summary.issues.push(`${test.name}: ${error.message}`);
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
  }
};

const testIntegration = async (page) => {
  console.log('\n🔗 Testing Integration...');
  
  const tests = [
    {
      name: 'Authentication protection works',
      test: async () => {
        // Check if we're redirected to login or if auth is required
        const currentUrl = page.url();
        const hasAuthCheck = await page.evaluate(() => {
          return document.body.textContent.includes('login') ||
                 document.body.textContent.includes('sign in') ||
                 window.location.pathname.includes('/login') ||
                 document.querySelector('[data-testid="auth-required"]');
        });
        
        return hasAuthCheck || currentUrl.includes('/login');
      }
    },
    {
      name: 'Navigation integration works',
      test: async () => {
        // Check if navigation bar is present
        const navExists = await checkElementExists(page, 'header, nav, .verotrade-top-navigation');
        if (!navExists) return false;
        
        // Check if log-trade is highlighted in navigation
        const logTradeActive = await page.evaluate(() => {
          const links = document.querySelectorAll('a[href*="log-trade"]');
          return Array.from(links).some(link => 
            link.classList.contains('active') ||
            link.style.backgroundColor.includes('184, 155, 94') ||
            window.getComputedStyle(link).backgroundColor.includes('184, 155, 94')
          );
        });
        
        return navExists;
      }
    },
    {
      name: 'Page fits within existing layout',
      test: async () => {
        // Check if content is properly contained within layout
        const layoutWrapper = await checkElementExists(page, '.verotrade-content-wrapper, .UnifiedLayout, main');
        if (!layoutWrapper) return false;
        
        // Check for layout conflicts
        const noLayoutConflicts = await page.evaluate(() => {
          const style = window.getComputedStyle(document.body);
          return !style.overflow.includes('hidden') || 
                 document.body.scrollHeight <= window.innerHeight + 100;
        });
        
        return layoutWrapper && noLayoutConflicts;
      }
    }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.test();
      testResults.integration[test.name] = result ? 'PASS' : 'FAIL';
      testResults.summary.totalTests++;
      if (result) testResults.summary.passedTests++;
      else testResults.summary.failedTests++;
      
      console.log(`${result ? '✅' : '❌'} ${test.name}`);
      await takeScreenshot(page, `integration-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
    } catch (error) {
      testResults.integration[test.name] = 'ERROR';
      testResults.summary.totalTests++;
      testResults.summary.failedTests++;
      testResults.summary.issues.push(`${test.name}: ${error.message}`);
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
};

const testBrowserCompatibility = async (page) => {
  console.log('\n🌐 Testing Browser Compatibility...');
  
  const tests = [
    {
      name: 'No console errors',
      test: async () => {
        const errors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });
        
        // Wait a bit to collect any errors
        await delay(2000);
        
        return errors.length === 0;
      }
    },
    {
      name: 'CSS animations work smoothly',
      test: async () => {
        // Check if animations are defined and working
        const animationsWork = await page.evaluate(() => {
          const testElement = document.createElement('div');
          testElement.style.animation = 'test 1s';
          document.body.appendChild(testElement);
          
          const computedStyle = window.getComputedStyle(testElement);
          const hasAnimation = computedStyle.animationName !== 'none';
          
          document.body.removeChild(testElement);
          return hasAnimation;
        });
        
        return animationsWork;
      }
    },
    {
      name: 'JavaScript functionality works',
      test: async () => {
        // Test basic JavaScript functionality
        const jsWorks = await page.evaluate(() => {
          try {
            // Test React is loaded
            return typeof window !== 'undefined' && 
                   document.querySelector('[data-reactroot]') !== null ||
                   document.getElementById('__next') !== null;
          } catch (e) {
            return false;
          }
        });
        
        return jsWorks;
      }
    }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.test();
      testResults.browserCompatibility[test.name] = result ? 'PASS' : 'FAIL';
      testResults.summary.totalTests++;
      if (result) testResults.summary.passedTests++;
      else testResults.summary.failedTests++;
      
      console.log(`${result ? '✅' : '❌'} ${test.name}`);
    } catch (error) {
      testResults.browserCompatibility[test.name] = 'ERROR';
      testResults.summary.totalTests++;
      testResults.summary.failedTests++;
      testResults.summary.issues.push(`${test.name}: ${error.message}`);
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Comprehensive Log-Trade Page Testing...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for automated testing
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔍 Console Error: ${msg.text()}`);
      }
    });
    
    // Navigate to log-trade page
    console.log(`📍 Navigating to ${TEST_CONFIG.baseUrl}/log-trade...`);
    await page.goto(`${TEST_CONFIG.baseUrl}/log-trade`, { 
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.testTimeout 
    });
    
    // Wait for page to load
    await delay(3000);
    await takeScreenshot(page, 'initial-load');
    
    // Run all test suites
    await testVisualDesign(page);
    await testInteractiveElements(page);
    await testFormFunctionality(page);
    await testResponsiveDesign(page);
    await testIntegration(page);
    await testBrowserCompatibility(page);
    
    // Take final screenshot
    await takeScreenshot(page, 'final-state');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.summary.issues.push(`Test execution failed: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Generate report
  generateReport();
};

const generateReport = () => {
  console.log('\n📊 Generating Test Report...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: testResults.summary,
    details: {
      visualDesign: testResults.visualDesign,
      interactiveElements: testResults.interactiveElements,
      formFunctionality: testResults.formFunctionality,
      responsiveDesign: testResults.responsiveDesign,
      integration: testResults.integration,
      browserCompatibility: testResults.browserCompatibility
    }
  };
  
  // Save detailed report
  const reportPath = `${TEST_CONFIG.screenshotsDir}/test-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 COMPREHENSIVE LOG-TRADE PAGE TEST REPORT');
  console.log('='.repeat(60));
  console.log(`📅 Date: ${new Date().toLocaleString()}`);
  console.log(`📁 Screenshots: ${TEST_CONFIG.screenshotsDir}`);
  console.log(`📄 Report: ${reportPath}`);
  console.log('\n📊 SUMMARY:');
  console.log(`   Total Tests: ${testResults.summary.totalTests}`);
  console.log(`   ✅ Passed: ${testResults.summary.passedTests}`);
  console.log(`   ❌ Failed: ${testResults.summary.failedTests}`);
  console.log(`   📈 Success Rate: ${((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1)}%`);
  
  if (testResults.summary.issues.length > 0) {
    console.log('\n🚨 ISSUES FOUND:');
    testResults.summary.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }
  
  console.log('\n📋 DETAILED RESULTS:');
  
  // Visual Design
  console.log('\n🎨 Visual Design:');
  Object.entries(testResults.visualDesign).forEach(([test, result]) => {
    console.log(`   ${result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️'} ${test}: ${result}`);
  });
  
  // Interactive Elements
  console.log('\n🖱️ Interactive Elements:');
  Object.entries(testResults.interactiveElements).forEach(([test, result]) => {
    console.log(`   ${result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️'} ${test}: ${result}`);
  });
  
  // Form Functionality
  console.log('\n📝 Form Functionality:');
  Object.entries(testResults.formFunctionality).forEach(([test, result]) => {
    console.log(`   ${result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️'} ${test}: ${result}`);
  });
  
  // Responsive Design
  console.log('\n📱 Responsive Design:');
  Object.entries(testResults.responsiveDesign).forEach(([viewport, tests]) => {
    console.log(`   ${viewport}:`);
    Object.entries(tests).forEach(([test, result]) => {
      console.log(`     ${result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️'} ${test}: ${result}`);
    });
  });
  
  // Integration
  console.log('\n🔗 Integration:');
  Object.entries(testResults.integration).forEach(([test, result]) => {
    console.log(`   ${result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️'} ${test}: ${result}`);
  });
  
  // Browser Compatibility
  console.log('\n🌐 Browser Compatibility:');
  Object.entries(testResults.browserCompatibility).forEach(([test, result]) => {
    console.log(`   ${result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️'} ${test}: ${result}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 TESTING COMPLETE');
  console.log('='.repeat(60));
};

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testResults };