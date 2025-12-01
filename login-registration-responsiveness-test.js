/**
 * Comprehensive Login/Registration Responsiveness Test Script
 * 
 * This script systematically tests the login and registration pages
 * across different devices and zoom levels to ensure the zoom-aware
 * responsive design fixes work correctly.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testCredentials: {
    email: 'testuser1000@verotrade.com',
    password: 'TestPassword123!'
  },
  newTestUser: {
    email: `testuser-${Date.now()}@verotrade.com`,
    password: 'TestPassword123!'
  },
  zoomLevels: [100, 125, 150, 200],
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  },
  pages: {
    login: '/login',
    register: '/register',
    dashboard: '/dashboard'
  }
};

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  summary: {},
  loginPage: {},
  registrationPage: {},
  authenticationFlow: {},
  edgeCases: {},
  comparisons: {}
};

/**
 * Initialize browser and page
 */
async function initializeBrowser() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized', '--disable-web-security'],
    defaultViewport: null
  });
  
  const page = await browser.newPage();
  
  // Set default timeout
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);
  
  // Enable console logging
  page.on('console', msg => {
    console.log('Browser Console:', msg.text());
  });
  
  return { browser, page };
}

/**
 * Set zoom level for the page
 */
async function setZoomLevel(page, zoomLevel) {
  const zoomScale = zoomLevel / 100;
  await page.evaluate((scale) => {
    document.body.style.transform = `scale(${scale})`;
    document.body.style.transformOrigin = 'top left';
    document.body.style.width = `${100 / scale}%`;
    document.body.style.height = `${100 / scale}%`;
  }, zoomScale);
  
  // Wait a bit for the zoom to apply
  await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Capture screenshot with descriptive filename
 */
async function captureScreenshot(page, testType, description) {
  const timestamp = Date.now();
  const filename = `${testType}-${description.replace(/\s+/g, '-')}-${timestamp}.png`;
  const filepath = path.join(__dirname, 'test-screenshots', filename);
  
  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved: ${filename}`);
  return filepath;
}

/**
 * Test login page responsiveness
 */
async function testLoginPageResponsiveness(page, viewport, zoomLevel) {
  const viewportKey = `${viewport.width}x${viewport.height}`;
  const zoomKey = `${zoomLevel}%`;
  
  console.log(`Testing login page at ${viewportKey} with ${zoomKey} zoom`);
  
  // Navigate to login page
  await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.pages.login);
  await page.waitForSelector('.zoom-content');
  
  // Set viewport and zoom
  await page.setViewport(viewport);
  await setZoomLevel(page, zoomLevel);
  
  // Wait for any animations to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Capture screenshot
  await captureScreenshot(page, 'login-page', `${viewportKey}-${zoomKey}`);
  
  // Test responsive elements
  const results = {
    zoomLevel,
    viewport: viewportKey,
    elements: {},
    zoomIndicator: false,
    formFunctionality: false
  };
  
  // Check if zoom indicator is visible (when zoom != 100%)
  if (zoomLevel !== 100) {
    const zoomIndicatorVisible = await page.evaluate(() => {
      const indicator = document.querySelector('.zoom-indicator');
      return indicator && window.getComputedStyle(indicator).display !== 'none';
    });
    results.zoomIndicator = zoomIndicatorVisible;
  }
  
  // Check form elements
  const formElements = await page.evaluate(() => {
    const elements = {};
    
    // Email input
    const emailInput = document.querySelector('#email');
    elements.emailInput = emailInput ? {
      visible: window.getComputedStyle(emailInput).display !== 'none',
      width: emailInput.offsetWidth,
      height: emailInput.offsetHeight
    } : null;
    
    // Password input
    const passwordInput = document.querySelector('#password');
    elements.passwordInput = passwordInput ? {
      visible: window.getComputedStyle(passwordInput).display !== 'none',
      width: passwordInput.offsetWidth,
      height: passwordInput.offsetHeight
    } : null;
    
    // Submit button
    const submitButton = document.querySelector('button[type="submit"]');
    elements.submitButton = submitButton ? {
      visible: window.getComputedStyle(submitButton).display !== 'none',
      width: submitButton.offsetWidth,
      height: submitButton.offsetHeight,
      text: submitButton.textContent
    } : null;
    
    // Login card
    const loginCard = document.querySelector('.zoom-card');
    elements.loginCard = loginCard ? {
      visible: window.getComputedStyle(loginCard).display !== 'none',
      width: loginCard.offsetWidth,
      height: loginCard.offsetHeight
    } : null;
    
    return elements;
  });
  
  results.elements = formElements;
  
  // Test form functionality
  try {
    await page.type('#email', TEST_CONFIG.testCredentials.email);
    await page.type('#password', TEST_CONFIG.testCredentials.password);
    
    // Check if form submission works (don't actually submit, just check if button is clickable)
    const isButtonClickable = await page.evaluate(() => {
      const button = document.querySelector('button[type="submit"]');
      return button && !button.disabled && window.getComputedStyle(button).pointerEvents !== 'none';
    });
    
    results.formFunctionality = isButtonClickable;
    
    // Clear form for next test
    await page.evaluate(() => {
      const emailInput = document.querySelector('#email');
      const passwordInput = document.querySelector('#password');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
  } catch (error) {
    results.formFunctionality = false;
    results.formError = error.message;
  }
  
  return results;
}

/**
 * Test registration page responsiveness
 */
async function testRegistrationPageResponsiveness(page, viewport, zoomLevel) {
  const viewportKey = `${viewport.width}x${viewport.height}`;
  const zoomKey = `${zoomLevel}%`;
  
  console.log(`Testing registration page at ${viewportKey} with ${zoomKey} zoom`);
  
  // Navigate to registration page
  await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.pages.register);
  await page.waitForSelector('.zoom-content');
  
  // Set viewport and zoom
  await page.setViewport(viewport);
  await setZoomLevel(page, zoomLevel);
  
  // Wait for any animations to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Capture screenshot
  await captureScreenshot(page, 'registration-page', `${viewportKey}-${zoomKey}`);
  
  // Test responsive elements
  const results = {
    zoomLevel,
    viewport: viewportKey,
    elements: {},
    zoomIndicator: false,
    formFunctionality: false
  };
  
  // Check if zoom indicator is visible (when zoom != 100%)
  if (zoomLevel !== 100) {
    const zoomIndicatorVisible = await page.evaluate(() => {
      const indicator = document.querySelector('.zoom-indicator');
      return indicator && window.getComputedStyle(indicator).display !== 'none';
    });
    results.zoomIndicator = zoomIndicatorVisible;
  }
  
  // Check form elements
  const formElements = await page.evaluate(() => {
    const elements = {};
    
    // Email input
    const emailInput = document.querySelector('#email');
    elements.emailInput = emailInput ? {
      visible: window.getComputedStyle(emailInput).display !== 'none',
      width: emailInput.offsetWidth,
      height: emailInput.offsetHeight
    } : null;
    
    // Password input
    const passwordInput = document.querySelector('#password');
    elements.passwordInput = passwordInput ? {
      visible: window.getComputedStyle(passwordInput).display !== 'none',
      width: passwordInput.offsetWidth,
      height: passwordInput.offsetHeight
    } : null;
    
    // Submit button
    const submitButton = document.querySelector('button[type="submit"]');
    elements.submitButton = submitButton ? {
      visible: window.getComputedStyle(submitButton).display !== 'none',
      width: submitButton.offsetWidth,
      height: submitButton.offsetHeight,
      text: submitButton.textContent
    } : null;
    
    // Registration card
    const registrationCard = document.querySelector('.zoom-card');
    elements.registrationCard = registrationCard ? {
      visible: window.getComputedStyle(registrationCard).display !== 'none',
      width: registrationCard.offsetWidth,
      height: registrationCard.offsetHeight
    } : null;
    
    return elements;
  });
  
  results.elements = formElements;
  
  // Test form functionality
  try {
    await page.type('#email', TEST_CONFIG.newTestUser.email);
    await page.type('#password', TEST_CONFIG.newTestUser.password);
    
    // Check if form submission works (don't actually submit, just check if button is clickable)
    const isButtonClickable = await page.evaluate(() => {
      const button = document.querySelector('button[type="submit"]');
      return button && !button.disabled && window.getComputedStyle(button).pointerEvents !== 'none';
    });
    
    results.formFunctionality = isButtonClickable;
    
    // Clear form for next test
    await page.evaluate(() => {
      const emailInput = document.querySelector('#email');
      const passwordInput = document.querySelector('#password');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
  } catch (error) {
    results.formFunctionality = false;
    results.formError = error.message;
  }
  
  return results;
}

/**
 * Test authentication flow
 */
async function testAuthenticationFlow(page) {
  console.log('Testing authentication flow');
  
  const results = {
    loginSuccess: false,
    redirectSuccess: false,
    errorHandling: false
  };
  
  try {
    // Navigate to login page
    await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.pages.login);
    await page.waitForSelector('.zoom-content');
    
    // Fill in login form
    await page.type('#email', TEST_CONFIG.testCredentials.email);
    await page.type('#password', TEST_CONFIG.testCredentials.password);
    
    // Submit form
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
    
    // Check if redirected to dashboard
    const currentUrl = page.url();
    results.redirectSuccess = currentUrl.includes('/dashboard');
    
    // Check if login was successful
    const dashboardLoaded = await page.evaluate(() => {
      return document.querySelector('.zoom-content') !== null;
    });
    
    results.loginSuccess = dashboardLoaded && results.redirectSuccess;
    
    // Capture screenshot of dashboard
    await captureScreenshot(page, 'authentication-flow', 'successful-login-dashboard');
    
    // Logout for next tests
    await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.pages.login);
    
  } catch (error) {
    results.loginError = error.message;
  }
  
  // Test error handling with invalid credentials
  try {
    await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.pages.login);
    await page.waitForSelector('.zoom-content');
    
    // Fill in invalid credentials
    await page.type('#email', 'invalid@example.com');
    await page.type('#password', 'invalidpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('.zoom-error-message', { timeout: 5000 });
    
    const errorVisible = await page.evaluate(() => {
      const errorElement = document.querySelector('.zoom-error-message');
      return errorElement && window.getComputedStyle(errorElement).display !== 'none';
    });
    
    results.errorHandling = errorVisible;
    
    // Capture screenshot of error
    await captureScreenshot(page, 'authentication-flow', 'error-message');
    
  } catch (error) {
    results.errorTestError = error.message;
  }
  
  return results;
}

/**
 * Test registration functionality
 */
async function testRegistrationFunctionality(page) {
  console.log('Testing registration functionality');
  
  const results = {
    formSubmission: false,
    successMessage: false,
    errorHandling: false
  };
  
  try {
    // Navigate to registration page
    await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.pages.register);
    await page.waitForSelector('.zoom-content');
    
    // Fill in registration form
    await page.type('#email', TEST_CONFIG.newTestUser.email);
    await page.type('#password', TEST_CONFIG.newTestUser.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message or error
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for success message
    const successVisible = await page.evaluate(() => {
      const successElement = document.querySelector('.zoom-success-message');
      return successElement && window.getComputedStyle(successElement).display !== 'none';
    });
    
    // Check for error message (might happen if user already exists)
    const errorVisible = await page.evaluate(() => {
      const errorElement = document.querySelector('.zoom-error-message');
      return errorElement && window.getComputedStyle(errorElement).display !== 'none';
    });
    
    results.formSubmission = true;
    results.successMessage = successVisible;
    results.errorHandling = errorVisible;
    
    // Capture screenshot
    await captureScreenshot(page, 'registration-flow', successVisible ? 'success' : 'error');
    
  } catch (error) {
    results.registrationError = error.message;
  }
  
  return results;
}

/**
 * Test edge cases
 */
async function testEdgeCases(page) {
  console.log('Testing edge cases');
  
  const results = {
    highZoom: {},
    windowResize: {},
    dynamicZoom: {}
  };
  
  // Test very high zoom levels
  for (const zoomLevel of [200, 250]) {
    try {
      await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.pages.login);
      await page.setViewport(TEST_CONFIG.viewports.desktop);
      await setZoomLevel(page, zoomLevel);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if layout is still functional
      const layoutFunctional = await page.evaluate(() => {
        const card = document.querySelector('.zoom-card');
        const form = document.querySelector('.zoom-form');
        return card && form && 
               window.getComputedStyle(card).display !== 'none' &&
               window.getComputedStyle(form).display !== 'none';
      });
      
      results.highZoom[`${zoomLevel}%`] = layoutFunctional;
      
      await captureScreenshot(page, 'edge-cases', `high-zoom-${zoomLevel}`);
      
    } catch (error) {
      results.highZoom[`${zoomLevel}%`] = false;
      results.highZoom[`${zoomLevel}%-error`] = error.message;
    }
  }
  
  // Test window resizing
  try {
    await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.pages.login);
    await page.setViewport(TEST_CONFIG.viewports.desktop);
    
    // Resize window to different sizes
    const sizes = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 }
    ];
    
    for (const size of sizes) {
      await page.setViewport(size);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const layoutAdapted = await page.evaluate(() => {
        const content = document.querySelector('.zoom-content');
        return content && window.getComputedStyle(content).display !== 'none';
      });
      
      results.windowResize[`${size.width}x${size.height}`] = layoutAdapted;
    }
    
  } catch (error) {
    results.windowResizeError = error.message;
  }
  
  // Test dynamic zoom changes
  try {
    await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.pages.login);
    await page.setViewport(TEST_CONFIG.viewports.desktop);
    
    // Change zoom levels dynamically
    const zoomLevels = [100, 125, 150, 100];
    
    for (const zoomLevel of zoomLevels) {
      await setZoomLevel(page, zoomLevel);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const zoomIndicatorUpdated = await page.evaluate(() => {
        const indicator = document.querySelector('.zoom-indicator');
        if (!indicator) return true; // No indicator at 100% is normal
        
        const zoomText = indicator.textContent;
        return zoomText && zoomText.includes(`${zoomLevel}%`);
      });
      
      results.dynamicZoom[`${zoomLevel}%`] = zoomIndicatorUpdated;
    }
    
  } catch (error) {
    results.dynamicZoomError = error.message;
  }
  
  return results;
}

/**
 * Compare with dashboard
 */
async function compareWithDashboard(page) {
  console.log('Comparing login/registration with dashboard responsive behavior');
  
  const results = {
    zoomClasses: {},
    layoutConsistency: {},
    zoomIndicatorConsistency: {}
  };
  
  const pages = [
    { name: 'login', url: TEST_CONFIG.pages.login },
    { name: 'register', url: TEST_CONFIG.pages.register },
    { name: 'dashboard', url: TEST_CONFIG.pages.dashboard }
  ];
  
  for (const pageInfo of pages) {
    try {
      await page.goto(TEST_CONFIG.baseUrl + pageInfo.url);
      await page.waitForSelector('.zoom-content');
      await page.setViewport(TEST_CONFIG.viewports.desktop);
      await setZoomLevel(page, 125); // Test with 125% zoom
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check zoom classes
      const zoomClasses = await page.evaluate(() => {
        const layout = document.querySelector('.zoom-aware-layout');
        return layout ? Array.from(layout.classList).filter(cls => cls.startsWith('zoom-')) : [];
      });
      
      results.zoomClasses[pageInfo.name] = zoomClasses;
      
      // Check layout consistency
      const layoutFunctional = await page.evaluate(() => {
        const content = document.querySelector('.zoom-content');
        return content && window.getComputedStyle(content).display !== 'none';
      });
      
      results.layoutConsistency[pageInfo.name] = layoutFunctional;
      
      // Check zoom indicator consistency
      const zoomIndicatorVisible = await page.evaluate(() => {
        const indicator = document.querySelector('.zoom-indicator');
        return indicator && window.getComputedStyle(indicator).display !== 'none';
      });
      
      results.zoomIndicatorConsistency[pageInfo.name] = zoomIndicatorVisible;
      
      await captureScreenshot(page, 'comparison', `${pageInfo.name}-125%-zoom`);
      
    } catch (error) {
      results[`${pageInfo.name}Error`] = error.message;
    }
  }
  
  return results;
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  const report = {
    timestamp: testResults.timestamp,
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      overallStatus: 'UNKNOWN'
    },
    details: testResults
  };
  
  // Calculate summary statistics
  let totalTests = 0;
  let passedTests = 0;
  
  function countTests(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'boolean') {
        totalTests++;
        if (value) passedTests++;
      } else if (typeof value === 'object' && value !== null) {
        countTests(value, prefix + key + '.');
      }
    }
  }
  
  countTests(testResults);
  
  report.summary.totalTests = totalTests;
  report.summary.passedTests = passedTests;
  report.summary.failedTests = totalTests - passedTests;
  report.summary.overallStatus = passedTests === totalTests ? 'PASS' : 'FAIL';
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  
  // Save report
  const reportPath = path.join(__dirname, 'LOGIN_REGISTRATION_RESPONSIVENESS_TEST_REPORT.md');
  fs.writeFileSync(reportPath, markdownReport);
  
  console.log(`Test report saved to: ${reportPath}`);
  console.log(`Summary: ${passedTests}/${totalTests} tests passed`);
  
  return report;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report) {
  const { summary, details } = report;
  
  let markdown = `# Login/Registration Responsiveness Test Report\n\n`;
  markdown += `**Generated:** ${report.timestamp}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Tests:** ${summary.totalTests}\n`;
  markdown += `- **Passed:** ${summary.passedTests}\n`;
  markdown += `- **Failed:** ${summary.failedTests}\n`;
  markdown += `- **Overall Status:** ${summary.overallStatus}\n\n`;
  
  // Login Page Results
  markdown += `## Login Page Results\n\n`;
  if (details.loginPage) {
    for (const [key, value] of Object.entries(details.loginPage)) {
      markdown += `### ${key}\n\n`;
      if (typeof value === 'object') {
        markdown += `- **Zoom Level:** ${value.zoomLevel}%\n`;
        markdown += `- **Viewport:** ${value.viewport}\n`;
        markdown += `- **Zoom Indicator:** ${value.zoomIndicator ? '✓' : '✗'}\n`;
        markdown += `- **Form Functionality:** ${value.formFunctionality ? '✓' : '✗'}\n`;
        
        if (value.elements) {
          markdown += `#### Elements\n\n`;
          for (const [elementName, elementData] of Object.entries(value.elements)) {
            if (elementData) {
              markdown += `- **${elementName}:** Visible (${elementData.visible ? '✓' : '✗'}), `;
              markdown += `Size: ${elementData.width}x${elementData.height}px\n`;
            }
          }
        }
      }
      markdown += `\n`;
    }
  }
  
  // Registration Page Results
  markdown += `## Registration Page Results\n\n`;
  if (details.registrationPage) {
    for (const [key, value] of Object.entries(details.registrationPage)) {
      markdown += `### ${key}\n\n`;
      if (typeof value === 'object') {
        markdown += `- **Zoom Level:** ${value.zoomLevel}%\n`;
        markdown += `- **Viewport:** ${value.viewport}\n`;
        markdown += `- **Zoom Indicator:** ${value.zoomIndicator ? '✓' : '✗'}\n`;
        markdown += `- **Form Functionality:** ${value.formFunctionality ? '✓' : '✗'}\n`;
        
        if (value.elements) {
          markdown += `#### Elements\n\n`;
          for (const [elementName, elementData] of Object.entries(value.elements)) {
            if (elementData) {
              markdown += `- **${elementName}:** Visible (${elementData.visible ? '✓' : '✗'}), `;
              markdown += `Size: ${elementData.width}x${elementData.height}px\n`;
            }
          }
        }
      }
      markdown += `\n`;
    }
  }
  
  // Authentication Flow Results
  markdown += `## Authentication Flow Results\n\n`;
  if (details.authenticationFlow) {
    markdown += `- **Login Success:** ${details.authenticationFlow.loginSuccess ? '✓' : '✗'}\n`;
    markdown += `- **Redirect Success:** ${details.authenticationFlow.redirectSuccess ? '✓' : '✗'}\n`;
    markdown += `- **Error Handling:** ${details.authenticationFlow.errorHandling ? '✓' : '✗'}\n\n`;
  }
  
  // Edge Cases Results
  markdown += `## Edge Cases Results\n\n`;
  if (details.edgeCases) {
    markdown += `### High Zoom Levels\n\n`;
    if (details.edgeCases.highZoom) {
      for (const [zoomLevel, result] of Object.entries(details.edgeCases.highZoom)) {
        markdown += `- **${zoomLevel}:** ${result ? '✓' : '✗'}\n`;
      }
    }
    
    markdown += `\n### Window Resize\n\n`;
    if (details.edgeCases.windowResize) {
      for (const [size, result] of Object.entries(details.edgeCases.windowResize)) {
        markdown += `- **${size}:** ${result ? '✓' : '✗'}\n`;
      }
    }
    
    markdown += `\n### Dynamic Zoom\n\n`;
    if (details.edgeCases.dynamicZoom) {
      for (const [zoomLevel, result] of Object.entries(details.edgeCases.dynamicZoom)) {
        markdown += `- **${zoomLevel}:** ${result ? '✓' : '✗'}\n`;
      }
    }
    markdown += `\n`;
  }
  
  // Comparison Results
  markdown += `## Comparison with Dashboard\n\n`;
  if (details.comparisons) {
    markdown += `### Zoom Classes\n\n`;
    if (details.comparisons.zoomClasses) {
      for (const [page, classes] of Object.entries(details.comparisons.zoomClasses)) {
        markdown += `- **${page}:** ${classes.join(', ')}\n`;
      }
    }
    
    markdown += `\n### Layout Consistency\n\n`;
    if (details.comparisons.layoutConsistency) {
      for (const [page, consistent] of Object.entries(details.comparisons.layoutConsistency)) {
        markdown += `- **${page}:** ${consistent ? '✓' : '✗'}\n`;
      }
    }
    
    markdown += `\n### Zoom Indicator Consistency\n\n`;
    if (details.comparisons.zoomIndicatorConsistency) {
      for (const [page, consistent] of Object.entries(details.comparisons.zoomIndicatorConsistency)) {
        markdown += `- **${page}:** ${consistent ? '✓' : '✗'}\n`;
      }
    }
    markdown += `\n`;
  }
  
  // Screenshots
  markdown += `## Screenshots\n\n`;
  markdown += `Screenshots have been saved to the \`test-screenshots\` directory.\n\n`;
  
  return markdown;
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting Login/Registration Responsiveness Tests...');
  
  const { browser, page } = await initializeBrowser();
  
  try {
    // Test login page responsiveness
    console.log('\n=== Testing Login Page Responsiveness ===');
    testResults.loginPage = {};
    
    for (const [viewportName, viewport] of Object.entries(TEST_CONFIG.viewports)) {
      testResults.loginPage[viewportName] = {};
      
      for (const zoomLevel of TEST_CONFIG.zoomLevels) {
        const result = await testLoginPageResponsiveness(page, viewport, zoomLevel);
        testResults.loginPage[viewportName][`${zoomLevel}%`] = result;
      }
    }
    
    // Test registration page responsiveness
    console.log('\n=== Testing Registration Page Responsiveness ===');
    testResults.registrationPage = {};
    
    for (const [viewportName, viewport] of Object.entries(TEST_CONFIG.viewports)) {
      testResults.registrationPage[viewportName] = {};
      
      for (const zoomLevel of TEST_CONFIG.zoomLevels) {
        const result = await testRegistrationPageResponsiveness(page, viewport, zoomLevel);
        testResults.registrationPage[viewportName][`${zoomLevel}%`] = result;
      }
    }
    
    // Test authentication flow
    console.log('\n=== Testing Authentication Flow ===');
    testResults.authenticationFlow = await testAuthenticationFlow(page);
    
    // Test registration functionality
    console.log('\n=== Testing Registration Functionality ===');
    testResults.registrationFlow = await testRegistrationFunctionality(page);
    
    // Test edge cases
    console.log('\n=== Testing Edge Cases ===');
    testResults.edgeCases = await testEdgeCases(page);
    
    // Compare with dashboard
    console.log('\n=== Comparing with Dashboard ===');
    testResults.comparisons = await compareWithDashboard(page);
    
    // Generate test report
    console.log('\n=== Generating Test Report ===');
    const report = generateTestReport();
    
    console.log('\n✅ All tests completed!');
    console.log(`📊 Test Summary: ${report.summary.passedTests}/${report.summary.totalTests} tests passed`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests()
    .then(report => {
      console.log('\n🎉 Test execution completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testLoginPageResponsiveness,
  testRegistrationPageResponsiveness,
  testAuthenticationFlow,
  testRegistrationFunctionality,
  testEdgeCases,
  compareWithDashboard
};