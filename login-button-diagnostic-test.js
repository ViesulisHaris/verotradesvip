const puppeteer = require('puppeteer');
const path = require('path');

async function testLoginButton() {
  let browser;
  try {
    console.log('Starting login button diagnostic test...');
    
    // Launch browser with necessary arguments
    browser = await puppeteer.launch({
      headless: false, // Set to false to see the browser interaction
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 100 // Slow down actions to see what's happening
    });
    
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
    
    // Enable request/response logging
    page.on('request', request => {
      if (request.url().includes('supabase') || request.url().includes('auth')) {
        console.log('REQUEST:', request.method(), request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('auth')) {
        console.log('RESPONSE:', response.status(), response.url());
      }
    });
    
    // Set viewport to a common desktop size
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to the login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for the form to be present
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check if form elements exist
    const emailInput = await page.$('#email');
    const passwordInput = await page.$('#password');
    const submitButton = await page.$('button[type="submit"]');
    
    console.log('Form elements check:');
    console.log('- Email input exists:', !!emailInput);
    console.log('- Password input exists:', !!passwordInput);
    console.log('- Submit button exists:', !!submitButton);
    
    if (!emailInput || !passwordInput || !submitButton) {
      throw new Error('Missing form elements');
    }
    
    // Fill in the form with test credentials
    console.log('Filling in login form...');
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'testpassword');
    
    // Take a screenshot before clicking
    const beforeScreenshotPath = path.join(__dirname, `login-before-click-${Date.now()}.png`);
    await page.screenshot({ path: beforeScreenshotPath, fullPage: false });
    console.log('Screenshot saved before click:', beforeScreenshotPath);
    
    // Check for JavaScript errors by evaluating the login function
    const loginFunctionCheck = await page.evaluate(() => {
      try {
        // Check if Supabase client is available
        if (typeof window.supabase === 'undefined') {
          return { error: 'Supabase client not available' };
        }
        
        // Check if the signInWithPassword method exists
        if (typeof window.supabase.auth.signInWithPassword !== 'function') {
          return { error: 'signInWithPassword method not available' };
        }
        
        return { success: 'Login function appears to be available' };
      } catch (err) {
        return { error: err.message };
      }
    });
    
    console.log('Login function check:', loginFunctionCheck);
    
    // Click the submit button
    console.log('Clicking Sign In button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);
    
    // Wait a bit to see what happens
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take a screenshot after clicking
    const afterScreenshotPath = path.join(__dirname, `login-after-click-${Date.now()}.png`);
    await page.screenshot({ path: afterScreenshotPath, fullPage: false });
    console.log('Screenshot saved after click:', afterScreenshotPath);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    
    // Check for any error messages
    const errorElements = await page.$$('text=error');
    if (errorElements.length > 0) {
      console.log('Found error elements on page');
    }
    
    // Check if we're still on login page (indicating failed login)
    if (currentUrl.includes('/login')) {
      console.log('Still on login page - login likely failed');
    } else if (currentUrl.includes('/dashboard')) {
      console.log('Redirected to dashboard - login likely succeeded');
    }
    
    return {
      beforeScreenshot: beforeScreenshotPath,
      afterScreenshot: afterScreenshotPath,
      finalUrl: currentUrl,
      loginFunctionCheck
    };
    
  } catch (error) {
    console.error('Error in testLoginButton:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testLoginButton()
  .then(result => {
    console.log('Test completed successfully:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });