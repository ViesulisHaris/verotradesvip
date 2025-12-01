const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  confluencePath: '/confluence',
  loginPath: '/login',
  timeout: 30000, // 30 seconds
  screenshotDir: path.join(__dirname, 'diagnostic-screenshots'),
  logFile: path.join(__dirname, 'confluence-diagnostic-log.json'),
  headless: false, // Set to true for headless mode
  slowMo: 100, // Slow down by 100ms
  devtools: true // Open devtools
};

// Test credentials (provided by user)
const testCredentials = {
  email: 'Testuser1000@verotrade.com',
  password: 'TestPassword123!'
};

// Create screenshot directory if it doesn't exist
if (!fs.existsSync(config.screenshotDir)) {
  fs.mkdirSync(config.screenshotDir, { recursive: true });
}

// Initialize log file
const logData = {
  timestamp: new Date().toISOString(),
  testResults: [],
  consoleLogs: [],
  consoleErrors: [],
  networkRequests: [],
  performanceMetrics: [],
  screenshots: []
};

async function saveLog() {
  fs.writeFileSync(config.logFile, JSON.stringify(logData, null, 2));
  console.log(`📄 Log saved to: ${config.logFile}`);
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(config.screenshotDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  logData.screenshots.push({
    name,
    path: screenshotPath,
    timestamp: new Date().toISOString()
  });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function runDiagnostic() {
  console.log('🔍 Starting Confluence Page Infinite Loading Diagnostic...');
  console.log(`📍 Base URL: ${config.baseUrl}`);
  console.log(`📁 Screenshot directory: ${config.screenshotDir}`);
  console.log(`📄 Log file: ${config.logFile}`);

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: config.headless,
      slowMo: config.slowMo,
      devtools: config.devtools,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Capture console logs and errors
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      const location = msg.location();
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        type,
        text,
        location: {
          url: location.url,
          lineNumber: location.lineNumber,
          columnNumber: location.columnNumber
        }
      };
      
      if (type === 'error') {
        logData.consoleErrors.push(logEntry);
        console.error(`❌ Console Error: ${text}`);
      } else {
        logData.consoleLogs.push(logEntry);
        console.log(`📝 Console ${type}: ${text}`);
      }
    });
    
    // Capture network requests
    page.on('request', request => {
      const url = request.url();
      const method = request.method();
      const resourceType = request.resourceType();
      
      // Only log API requests and important resources
      if (resourceType === 'xhr' || resourceType === 'fetch' || url.includes('/api/')) {
        logData.networkRequests.push({
          timestamp: new Date().toISOString(),
          url,
          method,
          resourceType,
          headers: request.headers()
        });
        console.log(`🌐 Network Request: ${method} ${url}`);
      }
    });
    
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      const resourceType = response.request().resourceType();
      
      // Only log API responses and important resources
      if (resourceType === 'xhr' || resourceType === 'fetch' || url.includes('/api/')) {
        logData.networkRequests.push({
          timestamp: new Date().toISOString(),
          url,
          status,
          resourceType,
          headers: response.headers()
        });
        console.log(`🌐 Network Response: ${status} ${url}`);
      }
    });
    
    page.on('requestfailed', request => {
      const url = request.url();
      const failure = request.failure();
      
      logData.networkRequests.push({
        timestamp: new Date().toISOString(),
        url,
        status: 'FAILED',
        error: failure ? failure.errorText : 'Unknown error'
      });
      console.error(`❌ Network Failed: ${url} - ${failure ? failure.errorText : 'Unknown error'}`);
    });
    
    // Navigate to login page first
    console.log('🔄 Navigating to login page...');
    await page.goto(`${config.baseUrl}${config.loginPath}`, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'login-page-loaded');
    
    // Check if login is needed
    const loginFormExists = await page.$('form');
    if (loginFormExists) {
      console.log('🔐 Login form found, attempting login...');
      
      // Fill in login credentials
      await page.type('input[type="email"]', testCredentials.email);
      await page.type('input[type="password"]', testCredentials.password);
      
      // Take screenshot before submitting
      await takeScreenshot(page, 'login-form-filled');
      
      // Submit login form
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: config.timeout })
      ]);
      
      await takeScreenshot(page, 'after-login');
    } else {
      console.log('ℹ️ No login form found, assuming already authenticated');
    }
    
    // First, let's check what navigation options are available after login
    console.log('🔍 Checking available navigation options...');
    const navigationLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('nav a, header a, .nav a, .navigation a, [role="navigation"] a'));
      return links.map(link => ({
        text: link.textContent?.trim(),
        href: link.getAttribute('href')
      }));
    });
    
    console.log('📋 Available navigation links:', navigationLinks);
    logData.testResults.push({
      test: 'navigation-links',
      result: 'INFO',
      message: `Found ${navigationLinks.length} navigation links`,
      data: navigationLinks
    });
    
    // Look for a confluence-related link or use the configured path
    const confluenceLink = navigationLinks.find(link =>
      link.text?.toLowerCase().includes('confluence') ||
      link.href?.toLowerCase().includes('confluence')
    );
    
    let confluenceUrl = `${config.baseUrl}${config.confluencePath}`;
    if (confluenceLink) {
      confluenceUrl = confluenceLink.href.startsWith('http') ?
        confluenceLink.href :
        `${config.baseUrl}${confluenceLink.href}`;
      console.log(`✅ Found confluence link: ${confluenceUrl}`);
    } else {
      console.log(`⚠️ No confluence link found, using configured path: ${confluenceUrl}`);
    }
    
    // Navigate to confluence page
    console.log('🔄 Navigating to confluence page...');
    try {
      await page.goto(confluenceUrl, { waitUntil: 'networkidle2', timeout: config.timeout });
      await takeScreenshot(page, 'confluence-page-loaded');
    } catch (error) {
      console.error(`❌ Failed to navigate to confluence page: ${error.message}`);
      logData.testResults.push({
        test: 'confluence-navigation',
        result: 'FAILED',
        message: `Failed to navigate to confluence page: ${error.message}`
      });
      
      // Take a screenshot of the current state
      await takeScreenshot(page, 'confluence-navigation-failed');
      
      // Let's check the current URL and page title
      const currentUrl = page.url();
      const pageTitle = await page.title();
      console.log(`📍 Current URL after failed navigation: ${currentUrl}`);
      console.log(`📄 Page title: ${pageTitle}`);
      
      // Try to find any confluence-related content on the page
      const confluenceContent = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const confluenceElements = Array.from(elements).filter(el => {
          const text = el.textContent?.toLowerCase() || '';
          return text.includes('confluence');
        });
        return confluenceElements.slice(0, 5).map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          textContent: el.textContent?.substring(0, 100)
        }));
      });
      
      if (confluenceContent.length > 0) {
        console.log(`🔍 Found ${confluenceContent.length} elements containing 'confluence':`);
        confluenceContent.forEach((el, i) => {
          console.log(`  ${i + 1}. ${el.tagName}.${el.className}: ${el.textContent}`);
        });
      }
      
      // Continue with the rest of the diagnostic
    }
    
    // Wait for potential loading states
    console.log('⏳ Waiting for page to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    // Check for loading indicators
    const loadingIndicator = await page.$('[data-testid="loading"], .loading, .spinner, [class*="loading"], [class*="spinner"]');
    if (loadingIndicator) {
      console.log('⚠️ Loading indicator found, waiting additional time...');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait additional 10 seconds
      await takeScreenshot(page, 'loading-indicator-still-present');
    }
    
    // Check for error messages
    const errorElements = await page.$$('.error, [class*="error"], [role="alert"]');
    if (errorElements.length > 0) {
      console.log(`❌ Found ${errorElements.length} error elements`);
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await page.evaluate(el => el.textContent, errorElements[i]);
        console.log(`Error ${i + 1}: ${errorText}`);
      }
      await takeScreenshot(page, 'error-elements-found');
    }
    
    // Get page performance metrics
    const metrics = await page.metrics();
    logData.performanceMetrics.push({
      timestamp: new Date().toISOString(),
      type: 'page-metrics',
      data: metrics
    });
    console.log('📊 Page metrics collected');
    
    // Get timing metrics
    const timing = JSON.parse(
      await page.evaluate(() => JSON.stringify(performance.timing))
    );
    logData.performanceMetrics.push({
      timestamp: new Date().toISOString(),
      type: 'timing',
      data: timing
    });
    console.log('⏱️ Timing metrics collected');
    
    // Check for specific React/Next.js errors
    const reactErrors = await page.evaluate(() => {
      const errors = [];
      if (window.console && window.console.error) {
        // This is a simplified approach - in a real scenario, you might need more sophisticated error capturing
        errors.push('React errors check performed');
      }
      return errors;
    });
    
    if (reactErrors.length > 0) {
      console.log('⚠️ React errors detected');
      logData.consoleErrors.push(...reactErrors.map(error => ({
        timestamp: new Date().toISOString(),
        type: 'react-error',
        text: error
      })));
    }
    
    // Final screenshot
    await takeScreenshot(page, 'final-state');
    
    // Check if the page is still loading
    const isLoading = await page.evaluate(() => {
      return document.readyState !== 'complete';
    });
    
    if (isLoading) {
      console.log('⚠️ Page is still in loading state');
      logData.testResults.push({
        test: 'page-loading-state',
        result: 'FAILED',
        message: 'Page is still in loading state after timeout'
      });
    } else {
      console.log('✅ Page has completed loading');
      logData.testResults.push({
        test: 'page-loading-state',
        result: 'PASSED',
        message: 'Page has completed loading'
      });
    }
    
    // Check for AuthGuard-related issues
    const authGuardContent = await page.evaluate(() => {
      const authGuardElements = document.querySelectorAll('[data-testid*="auth"], [class*="auth"], [id*="auth"]');
      return Array.from(authGuardElements).map(el => el.outerHTML);
    });
    
    if (authGuardContent.length > 0) {
      console.log(`🔍 Found ${authGuardContent.length} AuthGuard-related elements`);
      logData.testResults.push({
        test: 'auth-guard-elements',
        result: 'INFO',
        message: `Found ${authGuardContent.length} AuthGuard-related elements`,
        data: authGuardContent
      });
    }
    
    // Save final log
    await saveLog();
    
    console.log('✅ Diagnostic completed successfully');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    logData.testResults.push({
      test: 'diagnostic-execution',
      result: 'FAILED',
      message: error.message,
      stack: error.stack
    });
    await saveLog();
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Function to create a test user (commented out - using provided credentials instead)
/*
async function createTestUser() {
  console.log('🔧 Creating test user for diagnostic...');
  
  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '.env.local') });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration in .env.local');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Generate unique test user credentials
  const timestamp = Date.now();
  testCredentials = {
    email: `test-user-${timestamp}@example.com`,
    password: `TestPass123!${timestamp}`
  };
  
  try {
    // Sign up the test user
    const { data, error } = await supabase.auth.signUp({
      email: testCredentials.email,
      password: testCredentials.password
    });
    
    if (error) {
      // If user already exists, try to sign in
      if (error.message.includes('already registered')) {
        console.log('ℹ️ Test user already exists, attempting to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testCredentials.email,
          password: testCredentials.password
        });
        
        if (signInError) {
          throw new Error(`Failed to sign in with existing test user: ${signInError.message}`);
        }
        
        console.log('✅ Successfully signed in with existing test user');
        return;
      }
      
      throw new Error(`Failed to create test user: ${error.message}`);
    }
    
    console.log('✅ Test user created successfully');
    console.log(`📧 Email: ${testCredentials.email}`);
    console.log(`🔑 Password: ${testCredentials.password}`);
    
    // Wait a moment for user creation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}
*/

// Run the diagnostic directly with provided credentials
runDiagnostic().catch(console.error);