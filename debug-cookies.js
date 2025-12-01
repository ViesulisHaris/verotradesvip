const puppeteer = require('puppeteer');

async function debugCookies() {
  console.log('🍪 Debugging cookies and authentication flow...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Enable console logging from the page
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
    
    // Go to login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Check cookies before login
    console.log('\n🍪 Cookies before login:');
    const cookiesBefore = await page.cookies();
    console.log(JSON.stringify(cookiesBefore, null, 2));
    
    // Fill in login form
    console.log('📝 Filling in login form...');
    await page.type('input[type="email"]', 'testuser@verotrade.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    
    // Submit form
    console.log('🔐 Submitting login form...');
    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Check cookies after login
    console.log('\n🍪 Cookies after login:');
    const cookiesAfter = await page.cookies();
    console.log(JSON.stringify(cookiesAfter, null, 2));
    
    // Look for the sb-auth-token cookie specifically
    const authToken = cookiesAfter.find(cookie => cookie.name === 'sb-auth-token');
    if (authToken) {
      console.log('\n✅ Found sb-auth-token cookie:');
      console.log('Value length:', authToken.value.length);
      console.log('Value preview:', authToken.value.substring(0, 100) + '...');
      
      try {
        const parsed = JSON.parse(authToken.value);
        console.log('Parsed token keys:', Object.keys(parsed));
        console.log('Has access_token:', !!parsed.access_token);
        console.log('Access token length:', parsed.access_token?.length);
      } catch (e) {
        console.log('❌ Failed to parse token as JSON:', e.message);
      }
    } else {
      console.log('\n❌ sb-auth-token cookie not found!');
      console.log('Available cookie names:', cookiesAfter.map(c => c.name));
    }
    
    // Check current URL
    const currentUrl = page.url();
    console.log('\n🔍 Current URL after login:', currentUrl);
    
  } catch (error) {
    console.error('💥 Debug failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

debugCookies();