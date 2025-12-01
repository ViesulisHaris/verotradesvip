/**
 * Detailed Strategy Selection Issue Diagnosis
 * 
 * This script provides comprehensive debugging for strategy selection issues
 * including console logs, network requests, and DOM inspection.
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function detailedStrategyDiagnosis() {
  console.log('🔍 Starting Detailed Strategy Selection Diagnosis...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
      
      if (msg.type() === 'error') {
        console.error('🐛 Browser Console Error:', msg.text());
      } else if (msg.type() === 'warning') {
        console.warn('⚠️ Browser Console Warning:', msg.text());
      } else if (msg.text().includes('[DEBUG]') || msg.text().includes('Strategy')) {
        console.log('📝 Browser Console:', msg.text());
      }
    });
    
    // Enable network monitoring
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    });
    
    page.on('response', response => {
      if (response.url().includes('strategies') || response.url().includes('auth')) {
        console.log('🌐 Network Response:', {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Navigate to login page first
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
    
    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in login credentials
    console.log('🔐 Logging in...');
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Logged in successfully');
    
    // Navigate to trade logging page
    console.log('📍 Navigating to trade logging page...');
    await page.goto('http://localhost:3001/log-trade', { waitUntil: 'networkidle2' });
    
    // Wait for trade form to load
    await page.waitForSelector('form', { timeout: 10000 });
    console.log('✅ Trade form loaded');
    
    // Wait a bit for any useEffect hooks to run
    await page.waitForTimeout(3000);
    
    // Check if strategies are loaded
    console.log('🔍 Checking strategy dropdown...');
    
    // Get detailed DOM state
    const domState = await page.evaluate(() => {
      const select = document.querySelector('select[name="strategy_id"]');
      const form = document.querySelector('form');
      
      return {
        strategySelectExists: !!select,
        strategyOptions: select ? Array.from(select.options).map(opt => ({
          value: opt.value,
          text: opt.text.trim(),
          selected: opt.selected
        })) : [],
        strategyCount: select ? select.options.length : 0,
        formState: form ? {
          action: form.action,
          method: form.method
        } : null,
        hasDebugInfo: !!document.querySelector('[data-strategy-rules]'),
        localStorageData: {
          strategies: localStorage.getItem('strategies'),
          tradeDataLastUpdated: localStorage.getItem('tradeDataLastUpdated')
        }
      };
    });
    
    console.log('📊 DOM State Analysis:', domState);
    
    // Check for React component state
    const reactState = await page.evaluate(() => {
      // Try to access React DevTools if available
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const reactRoot = document.querySelector('[data-reactroot]');
        if (reactRoot) {
          return {
            hasReactRoot: true,
            reactRootFound: true
          };
        }
      }
      return {
        hasReactRoot: false,
        reactRootFound: false
      };
    });
    
    console.log('⚛️ React State:', reactState);
    
    // Check for specific errors in console messages
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    const strategyMessages = consoleMessages.filter(msg => 
      msg.text.includes('Strategy') || msg.text.includes('strategies')
    );
    
    console.log('🐛 Error Messages Found:', errorMessages.length);
    errorMessages.forEach(msg => {
      console.error('  -', msg.text);
    });
    
    console.log('📝 Strategy-Related Messages:', strategyMessages.length);
    strategyMessages.forEach(msg => {
      console.log('  -', msg.text);
    });
    
    // Check network requests for strategies
    const strategyRequests = networkRequests.filter(req => 
      req.url.includes('strategies')
    );
    
    console.log('🌐 Strategy Network Requests:', strategyRequests.length);
    strategyRequests.forEach(req => {
      console.log('  -', req.method, req.url);
    });
    
    // Try to manually trigger strategy loading
    console.log('🔄 Attempting to trigger strategy reload...');
    
    await page.evaluate(() => {
      // Try to find and click any refresh button or trigger reload
      const refreshButton = document.querySelector('[data-refresh-strategies]');
      if (refreshButton) {
        refreshButton.click();
      } else {
        // Try to trigger a state update
        const event = new CustomEvent('strategyReloadRequested');
        window.dispatchEvent(event);
      }
    });
    
    // Wait for potential reload
    await page.waitForTimeout(2000);
    
    // Check final state
    const finalState = await page.evaluate(() => {
      const select = document.querySelector('select[name="strategy_id"]');
      return {
        strategyOptions: select ? Array.from(select.options).map(opt => ({
          value: opt.value,
          text: opt.text.trim(),
          selected: opt.selected
        })) : [],
        strategyCount: select ? select.options.length : 0
      };
    });
    
    console.log('📊 Final State:', finalState);
    
    // Take screenshot for visual verification
    const screenshot = await page.screenshot({ 
      path: 'detailed-strategy-diagnosis.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: detailed-strategy-diagnosis.png');
    
    // Generate diagnosis report
    const diagnosis = {
      timestamp: new Date().toISOString(),
      issue: finalState.strategyCount <= 1 ? 'STRATEGIES_NOT_LOADING' : 'NO_ISSUE',
      domState,
      reactState,
      consoleErrors: errorMessages,
      strategyMessages,
      networkRequests: strategyRequests,
      finalState
    };
    
    console.log('🏁 Diagnosis Report:', JSON.stringify(diagnosis, null, 2));
    
  } catch (error) {
    console.error('❌ Detailed diagnosis failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the detailed diagnosis
detailedStrategyDiagnosis().then(() => {
  console.log('🏁 Detailed strategy selection diagnosis completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Detailed diagnosis failed:', error);
  process.exit(1);
});