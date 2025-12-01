const puppeteer = require('puppeteer');

async function detailedAuthDiagnostic() {
  console.log('Starting detailed authentication diagnostic...');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    page.setDefaultTimeout(30000);
    
    // Set up console logging to capture all client-side errors
    page.on('console', (msg) => {
      console.log(`Browser Console [${msg.type()}]: ${msg.text()}`);
    });
    
    // Set up request monitoring to see API calls
    page.on('request', (request) => {
      if (request.url().includes('supabase')) {
        console.log(`Supabase Request: ${request.method()} ${request.url()}`);
      }
    });
    
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Wait for page to load completely
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check page content and structure
    console.log('Analyzing page structure...');
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        forms: document.querySelectorAll('form').length,
        emailInputs: document.querySelectorAll('input[type="email"]').length,
        passwordInputs: document.querySelectorAll('input[type="password"]').length,
        submitButtons: document.querySelectorAll('button[type="submit"]').length,
        errorMessages: document.querySelectorAll('.error-message, [data-testid="error"], .error, .alert-error').length,
        errorText: Array.from(document.querySelectorAll('.error-message, [data-testid="error"], .error, .alert-error')).map(el => el.textContent.trim()).join(' | '),
        hasBrandTitle: document.querySelector('.brand-title') !== null,
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage)
      };
    });
    
    console.log('Page Analysis:', pageContent);
    
    // Take initial screenshot
    await page.screenshot({ path: './diagnostic-initial.png', fullPage: true });
    console.log('Screenshot saved: diagnostic-initial.png');
    
    // Fill in the form step by step and monitor each action
    console.log('Filling email field...');
    await page.type('input[type="email"]', 'testuser1000@verotrade.com', { delay: 100 });
    
    console.log('Filling password field...');
    await page.type('input[type="password"]', 'TestPassword123!', { delay: 100 });
    
    // Check form state before submission
    const formState = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButton = document.querySelector('button[type="submit"]');
      
      return {
        emailValue: emailInput ? emailInput.value : null,
        passwordValue: passwordInput ? passwordInput.value : null,
        submitDisabled: submitButton ? submitButton.disabled : null,
        submitText: submitButton ? submitButton.textContent : null
      };
    });
    
    console.log('Form state before submission:', formState);
    
    // Take screenshot of filled form
    await page.screenshot({ path: './diagnostic-form-filled.png', fullPage: true });
    console.log('Screenshot saved: diagnostic-form-filled.png');
    
    // Submit the form and monitor what happens
    console.log('Submitting form...');
    
    // Listen for navigation and capture any errors during submission
    let navigationCompleted = false;
    let submissionError = null;
    
    try {
      // Set up a promise to handle either navigation or error appearance
      const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })
        .then(() => {
          navigationCompleted = true;
          console.log('Navigation completed');
        })
        .catch(err => {
          submissionError = err.message;
          console.log('Navigation error:', err.message);
        });
      
      // Click submit button
      await page.click('button[type="submit"]');
      
      // Wait for either navigation or timeout
      await Promise.race([
        navigationPromise,
        new Promise(resolve => setTimeout(resolve, 10000)) // 10 second timeout
      ]);
      
    } catch (error) {
      submissionError = error.message;
      console.log('Submission error:', error.message);
    }
    
    // Wait a bit more for any error messages to appear
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check final state
    const finalState = await page.evaluate(() => {
      const currentUrl = window.location.href;
      const errorElements = document.querySelectorAll('.error-message, [data-testid="error"], .error, .alert-error');
      const errorTexts = Array.from(errorElements).map(el => el.textContent.trim());
      
      return {
        url: currentUrl,
        errorCount: errorElements.length,
        errorTexts: errorTexts,
        hasError: errorElements.length > 0,
        stillOnLoginPage: currentUrl.includes('/login'),
        redirectedToDashboard: currentUrl.includes('/dashboard')
      };
    });
    
    console.log('Final state after submission:', finalState);
    
    // Take final screenshot
    await page.screenshot({ path: './diagnostic-final.png', fullPage: true });
    console.log('Screenshot saved: diagnostic-final.png');
    
    // Check browser console for any Supabase-related errors
    const consoleLogs = await page.evaluate(() => {
      const logs = [];
      const originalLog = console.log;
      console.log = function(...args) {
        logs.push({ type: 'log', message: args.join(' '), timestamp: Date.now() });
        return originalLog.apply(console, args);
      };
      const originalError = console.error;
      console.error = function(...args) {
        logs.push({ type: 'error', message: args.join(' '), timestamp: Date.now() });
        return originalError.apply(console, args);
      };
      const originalWarn = console.warn;
      console.warn = function(...args) {
        logs.push({ type: 'warn', message: args.join(' '), timestamp: Date.now() });
        return originalWarn.apply(console, args);
      };
      
      // Trigger some actions to capture console output
      return logs;
    });
    
    console.log('Console logs captured:', consoleLogs);
    
    console.log('=== DIAGNOSTIC SUMMARY ===');
    console.log('Navigation completed:', navigationCompleted);
    console.log('Submission error:', submissionError);
    console.log('Final URL:', finalState.url);
    console.log('Error count:', finalState.errorCount);
    console.log('Error messages:', finalState.errorTexts);
    console.log('Still on login:', finalState.stillOnLoginPage);
    console.log('Redirected to dashboard:', finalState.redirectedToDashboard);
    
  } catch (error) {
    console.error('Diagnostic failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

detailedAuthDiagnostic();