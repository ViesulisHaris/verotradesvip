/**
 * Debug version of Login/Registration Responsiveness Test Script
 * 
 * This script adds detailed logging to diagnose issues with the original test script
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
  zoomLevels: [100],
  viewports: {
    desktop: { width: 1920, height: 1080 }
  },
  pages: {
    login: '/login',
    register: '/register',
    dashboard: '/dashboard'
  }
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
  
  // Enable request logging
  page.on('request', request => {
    console.log('Request:', request.url());
  });
  
  // Enable response logging
  page.on('response', response => {
    console.log('Response:', response.url(), response.status());
  });
  
  return { browser, page };
}

/**
 * Set zoom level for the page
 */
async function setZoomLevel(page, zoomLevel) {
  console.log(`[DEBUG] Setting zoom level to ${zoomLevel}%`);
  const zoomScale = zoomLevel / 100;
  
  await page.evaluate((scale) => {
    console.log(`[DEBUG] Applying zoom scale: ${scale}`);
    document.body.style.transform = `scale(${scale})`;
    document.body.style.transformOrigin = 'top left';
    document.body.style.width = `${100 / scale}%`;
    document.body.style.height = `${100 / scale}%`;
  }, zoomScale);
  
  // Wait a bit for the zoom to apply
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Verify zoom was applied
  const actualZoom = await page.evaluate(() => {
    const transform = window.getComputedStyle(document.body).transform;
    console.log(`[DEBUG] Body transform: ${transform}`);
    return transform;
  });
  
  console.log(`[DEBUG] Actual zoom transform applied: ${actualZoom}`);
}

/**
 * Debug login page responsiveness
 */
async function debugLoginPageResponsiveness(page, viewport, zoomLevel) {
  const viewportKey = `${viewport.width}x${viewport.height}`;
  const zoomKey = `${zoomLevel}%`;
  
  console.log(`[DEBUG] Testing login page at ${viewportKey} with ${zoomKey} zoom`);
  
  // Navigate to login page
  console.log(`[DEBUG] Navigating to ${TEST_CONFIG.baseUrl + TEST_CONFIG.pages.login}`);
  await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.pages.login, { waitUntil: 'networkidle2' });
  
  // Wait for page to be fully loaded
  console.log('[DEBUG] Waiting for page to load...');
  await page.waitForSelector('body', { timeout: 10000 });
  
  // Log page state
  const pageState = await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      readyState: document.readyState,
      bodyClasses: document.body.className
    };
  });
  console.log('[DEBUG] Page state:', pageState);
  
  // Set viewport and zoom
  console.log(`[DEBUG] Setting viewport to ${viewportKey}`);
  await page.setViewport(viewport);
  await setZoomLevel(page, zoomLevel);
  
  // Wait for any animations to complete
  console.log('[DEBUG] Waiting for animations...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Debug zoom-aware components
  const zoomInfo = await page.evaluate(() => {
    const layout = document.querySelector('.zoom-aware-layout');
    const content = document.querySelector('.zoom-content');
    const indicator = document.querySelector('.zoom-indicator');
    
    return {
      zoomAwareLayout: layout ? {
        exists: true,
        classes: layout.className,
        styles: window.getComputedStyle(layout)
      } : { exists: false },
      zoomContent: content ? {
        exists: true,
        classes: content.className,
        styles: window.getComputedStyle(content)
      } : { exists: false },
      zoomIndicator: indicator ? {
        exists: true,
        classes: indicator.className,
        styles: window.getComputedStyle(indicator),
        visible: window.getComputedStyle(indicator).display !== 'none'
      } : { exists: false },
      bodyZoomLevel: document.body.style.getPropertyValue('--zoom-level'),
      bodyZoomPercentage: document.body.style.getPropertyValue('--zoom-percentage')
    };
  });
  
  console.log('[DEBUG] Zoom-aware components:', JSON.stringify(zoomInfo, null, 2));
  
  // Debug form elements
  const formElements = await page.evaluate(() => {
    const elements = {};
    
    // Email input
    const emailInput = document.querySelector('#email');
    elements.emailInput = emailInput ? {
      exists: true,
      tagName: emailInput.tagName,
      type: emailInput.type,
      classes: emailInput.className,
      visible: window.getComputedStyle(emailInput).display !== 'none',
      width: emailInput.offsetWidth,
      height: emailInput.offsetHeight,
      value: emailInput.value
    } : { exists: false };
    
    // Password input
    const passwordInput = document.querySelector('#password');
    elements.passwordInput = passwordInput ? {
      exists: true,
      tagName: passwordInput.tagName,
      type: passwordInput.type,
      classes: passwordInput.className,
      visible: window.getComputedStyle(passwordInput).display !== 'none',
      width: passwordInput.offsetWidth,
      height: passwordInput.offsetHeight,
      value: passwordInput.value
    } : { exists: false };
    
    // Submit button
    const submitButton = document.querySelector('button[type="submit"]');
    elements.submitButton = submitButton ? {
      exists: true,
      tagName: submitButton.tagName,
      type: submitButton.type,
      classes: submitButton.className,
      visible: window.getComputedStyle(submitButton).display !== 'none',
      width: submitButton.offsetWidth,
      height: submitButton.offsetHeight,
      text: submitButton.textContent,
      disabled: submitButton.disabled
    } : { exists: false };
    
    // Login card
    const loginCard = document.querySelector('.zoom-card');
    elements.loginCard = loginCard ? {
      exists: true,
      classes: loginCard.className,
      visible: window.getComputedStyle(loginCard).display !== 'none',
      width: loginCard.offsetWidth,
      height: loginCard.offsetHeight
    } : { exists: false };
    
    // Form element
    const form = document.querySelector('form');
    elements.form = form ? {
      exists: true,
      classes: form.className,
      action: form.action,
      method: form.method
    } : { exists: false };
    
    return elements;
  });
  
  console.log('[DEBUG] Form elements:', JSON.stringify(formElements, null, 2));
  
  // Test form functionality
  console.log('[DEBUG] Testing form functionality...');
  try {
    if (formElements.emailInput.exists && formElements.passwordInput.exists) {
      console.log('[DEBUG] Filling email input...');
      await page.type('#email', TEST_CONFIG.testCredentials.email, { delay: 100 });
      
      console.log('[DEBUG] Filling password input...');
      await page.type('#password', TEST_CONFIG.testCredentials.password, { delay: 100 });
      
      // Verify values were entered
      const filledValues = await page.evaluate(() => {
        return {
          email: document.querySelector('#email').value,
          password: document.querySelector('#password').value
        };
      });
      console.log('[DEBUG] Filled values:', filledValues);
      
      // Check if form submission works (don't actually submit, just check if button is clickable)
      const isButtonClickable = await page.evaluate(() => {
        const button = document.querySelector('button[type="submit"]');
        return button && !button.disabled && window.getComputedStyle(button).pointerEvents !== 'none';
      });
      
      console.log(`[DEBUG] Submit button clickable: ${isButtonClickable}`);
      
      // Clear form for next test
      await page.evaluate(() => {
        const emailInput = document.querySelector('#email');
        const passwordInput = document.querySelector('#password');
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
      });
      
      return {
        formFunctionality: true,
        buttonClickable: isButtonClickable,
        zoomLevel: zoomLevel,
        viewport: viewportKey,
        zoomIndicator: zoomInfo.zoomIndicator.exists && zoomInfo.zoomIndicator.visible,
        elements: formElements
      };
    } else {
      console.log('[DEBUG] Form elements not found, cannot test functionality');
      return {
        formFunctionality: false,
        buttonClickable: false,
        zoomLevel: zoomLevel,
        viewport: viewportKey,
        zoomIndicator: zoomInfo.zoomIndicator.exists && zoomInfo.zoomIndicator.visible,
        elements: formElements
      };
    }
  } catch (error) {
    console.log(`[DEBUG] Form functionality test failed: ${error.message}`);
    return {
      formFunctionality: false,
      buttonClickable: false,
      zoomLevel: zoomLevel,
      viewport: viewportKey,
      zoomIndicator: zoomInfo.zoomIndicator.exists && zoomInfo.zoomIndicator.visible,
      elements: formElements,
      error: error.message
    };
  }
}

/**
 * Main debug function
 */
async function runDebugTests() {
  console.log('Starting Login/Registration Debug Tests...');
  
  const { browser, page } = await initializeBrowser();
  
  try {
    // Debug login page
    console.log('\n=== Debugging Login Page ===');
    const loginResult = await debugLoginPageResponsiveness(page, TEST_CONFIG.viewports.desktop, 100);
    console.log('\n[DEBUG] Login test result:', JSON.stringify(loginResult, null, 2));
    
    // Save debug results
    const debugReport = {
      timestamp: new Date().toISOString(),
      loginResult: loginResult
    };
    
    const reportPath = path.join(__dirname, 'login-registration-debug-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(debugReport, null, 2));
    
    console.log(`\nDebug report saved to: ${reportPath}`);
    
    return debugReport;
    
  } catch (error) {
    console.error('❌ Debug test execution failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run debug tests if called directly
if (require.main === module) {
  runDebugTests()
    .then(report => {
      console.log('\n🎉 Debug tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Debug tests failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runDebugTests,
  debugLoginPageResponsiveness
};