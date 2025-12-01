const puppeteer = require('puppeteer');

async function testGrayScreenFix() {
  console.log('🔧 Testing gray screen fix...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });
  
  try {
    console.log('🔍 Testing login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Wait for the login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('✅ Login form rendered successfully - no gray screen!');
    
    // Check if the page has the expected content
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (emailInput && passwordInput && submitButton) {
      console.log('✅ All login form elements are present and interactive');
    } else {
      console.log('❌ Login form elements missing');
    }
    
    console.log('🔍 Testing auth initialization page...');
    await page.goto('http://localhost:3000/test-auth-init', { waitUntil: 'networkidle2' });
    
    // Wait for the auth initialization to complete
    await page.waitForTimeout(5000);
    
    // Check if auth is initialized
    const authStatus = await page.evaluate(() => {
      const statusElement = document.querySelector('div > h3');
      return statusElement ? statusElement.textContent : 'Not found';
    });
    
    if (authStatus.includes('✅ Auth Initialized Successfully')) {
      console.log('✅ Authentication context initialized successfully');
    } else {
      console.log('❌ Authentication context failed to initialize:', authStatus);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testGrayScreenFix().catch(console.error);