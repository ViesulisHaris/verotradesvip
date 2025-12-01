const puppeteer = require('puppeteer');
const path = require('path');

async function debugAuthInitialization() {
  console.log('🔍 Debugging AuthContext initialization...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Enable console log monitoring
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.text()}`);
  });
  
  // Enable request monitoring
  page.on('request', request => {
    if (request.url().includes('supabase')) {
      console.log(`SUPABASE REQUEST: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('supabase')) {
      console.log(`SUPABASE RESPONSE: ${response.status()} ${response.url()}`);
    }
  });
  
  // Navigate to home page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Wait for authentication to initialize
  await page.waitForTimeout(5000);
  
  // Check AuthContext state directly
  const authState = await page.evaluate(() => {
    // Try to access React state directly
    const reactRoot = document.querySelector('#__next');
    if (!reactRoot) return null;
    
    // This is a hacky way to check React state, but useful for debugging
    const stateInfo = {
      loadingSpinner: !!document.querySelector('div[style*="animation: spin"]'),
      homeContent: !!document.querySelector('h1'),
      authContextLoading: null,
      authContextInitialized: null
    };
    
    // Try to get state from window if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      try {
        const renderers = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers;
        if (renderers && renderers.size > 0) {
          const renderer = Array.from(renderers.values())[0];
          const fiber = renderer.getFiberRoots(reactRoot)[0];
          if (fiber) {
            // This is very hacky but might give us some insight
            const state = fiber.memoizedState;
            if (state) {
              // Try to find auth context in the state tree
              // This is very fragile and might not work
              console.log('Found fiber state, attempting to extract auth info');
            }
          }
        }
      } catch (e) {
        console.log('Error accessing React devtools:', e);
      }
    }
    
    return stateInfo;
  });
  
  console.log('Page state:', authState);
  
  // Take a screenshot
  await page.screenshot({ 
    path: path.join(__dirname, 'auth-debug-result.png'),
    fullPage: true
  });
  
  await browser.close();
  
  return authState;
}

debugAuthInitialization().catch(console.error);