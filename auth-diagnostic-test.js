const puppeteer = require('puppeteer');

async function runAuthDiagnostic() {
  console.log('🔍 Running Authentication Diagnostic Test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    defaultViewport: null 
  });
  
  const page = await browser.newPage();
  
  // Capture console logs
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(msg.text());
    console.log('📝 Console:', msg.text());
  });
  
  // Capture navigation events
  page.on('response', response => {
    console.log('🌐 Response:', response.url(), response.status());
  });
  
  try {
    console.log('📍 Step 1: Testing AuthContext provider setup...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check for AuthContext errors
    const authContextErrors = consoleMessages.filter(msg => 
      msg.includes('AuthContext is undefined') || 
      msg.includes('AUTH_GUARD_DEBUG') ||
      msg.includes('AUTH_DEBUG')
    );
    
    console.log('\n🔍 AuthContext Analysis:');
    console.log('AuthContext errors found:', authContextErrors.length);
    authContextErrors.forEach(error => console.log('  -', error));
    
    console.log('\n📍 Step 2: Testing dashboard access without authentication...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);
    
    // Check current URL after dashboard access attempt
    const currentUrl = page.url();
    console.log('Current URL after dashboard access:', currentUrl);
    
    // Check if redirected to login
    const wasRedirected = currentUrl.includes('/login');
    console.log('Was redirected to login:', wasRedirected);
    
    // Look for AuthGuard debug messages
    const authGuardMessages = consoleMessages.filter(msg => 
      msg.includes('AUTH_GUARD_DEBUG') && msg.includes('dashboard')
    );
    
    console.log('\n🔍 AuthGuard Analysis:');
    authGuardMessages.forEach(msg => console.log('  -', msg));
    
    console.log('\n📍 Step 3: Testing login flow...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Fill login form (using test credentials)
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'testpassword123');
    
    // Capture auth state before login
    const beforeLoginMessages = consoleMessages.filter(msg => 
      msg.includes('LOGIN_DEBUG') || msg.includes('AUTH_DEBUG')
    );
    
    console.log('\n🔍 Pre-Login State:');
    beforeLoginMessages.slice(-5).forEach(msg => console.log('  -', msg));
    
    // Submit login form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);
    
    await page.waitForTimeout(3000);
    
    // Check final URL
    const finalUrl = page.url();
    console.log('\n📍 Final URL after login:', finalUrl);
    
    // Check post-login auth messages
    const afterLoginMessages = consoleMessages.filter(msg => 
      msg.includes('LOGIN_DEBUG') || msg.includes('SIGNED_IN') || msg.includes('Redirecting')
    );
    
    console.log('\n🔍 Post-Login Analysis:');
    afterLoginMessages.slice(-10).forEach(msg => console.log('  -', msg));
    
    // Final diagnosis
    console.log('\n🎯 DIAGNOSTIC RESULTS:');
    console.log('1. AuthContext Provider Issues:', authContextErrors.length > 0 ? 'YES' : 'NO');
    console.log('2. AuthGuard Redirect Issues:', !wasRedirected ? 'YES' : 'NO');
    console.log('3. Login Redirect Success:', finalUrl.includes('/dashboard') ? 'YES' : 'NO');
    console.log('4. Auth State Persistence:', finalUrl.includes('/dashboard') ? 'YES' : 'NO');
    
    console.log('\n📋 RECOMMENDED FIXES:');
    if (authContextErrors.length > 0) {
      console.log('❌ Fix AuthContext provider in layout.tsx');
    }
    if (!wasRedirected) {
      console.log('❌ Fix AuthGuard redirect logic');
    }
    if (!finalUrl.includes('/dashboard')) {
      console.log('❌ Fix login redirect mechanism');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  } finally {
    await browser.close();
  }
}

runAuthDiagnostic();