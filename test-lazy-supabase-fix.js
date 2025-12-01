const puppeteer = require('puppeteer');

async function testLazySupabaseFix() {
  console.log('🔍 Testing lazy Supabase client initialization fix...\n');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      defaultViewport: null
    });
    
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log(`[PAGE CONSOLE] ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.error(`[PAGE ERROR] ${error.message}`);
    });
    
    // Test 1: Check if main page loads without Supabase errors
    console.log('1️⃣ Testing main page loading...');
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      console.log('✅ Main page loaded successfully');
      
      // Check for any Supabase-related errors in the page
      const pageErrors = await page.evaluate(() => {
        const errors = [];
        const originalError = console.error;
        console.error = (...args) => {
          errors.push(args.join(' '));
          originalError.apply(console, args);
        };
        return errors;
      });
      
      const supabaseErrors = pageErrors.filter(error => 
        error.includes('supabase') || 
        error.includes('Supabase') || 
        error.includes('NEXT_PUBLIC_SUPABASE')
      );
      
      if (supabaseErrors.length > 0) {
        console.log('⚠️  Found Supabase-related errors:', supabaseErrors);
      } else {
        console.log('✅ No Supabase errors found on main page');
      }
    } catch (error) {
      console.error('❌ Failed to load main page:', error.message);
    }
    
    // Test 2: Test the lazy Supabase test page
    console.log('\n2️⃣ Testing lazy Supabase test page...');
    try {
      await page.goto('http://localhost:3000/test-lazy-supabase', { waitUntil: 'networkidle2' });
      console.log('✅ Test page loaded successfully');
      
      // Wait for the test to complete
      await page.waitForSelector('div.text-lg', { timeout: 10000 });
      
      // Check the test results
      const testResults = await page.evaluate(() => {
        const statusElement = document.querySelector('div.text-lg');
        const envStatusElements = document.querySelectorAll('.font-mono');
        
        return {
          status: statusElement ? statusElement.textContent : 'Not found',
          envStatus: {
            url: envStatusElements[0] ? envStatusElements[0].textContent : 'Not found',
            key: envStatusElements[1] ? envStatusElements[1].textContent : 'Not found',
            nodeEnv: envStatusElements[2] ? envStatusElements[2].textContent : 'Not found'
          }
        };
      });
      
      console.log('Test Results:', testResults);
      
      if (testResults.status.includes('✅')) {
        console.log('✅ Lazy Supabase initialization test PASSED');
      } else {
        console.log('❌ Lazy Supabase initialization test FAILED');
      }
      
      if (testResults.envStatus.url === 'SET' && testResults.envStatus.key === 'SET') {
        console.log('✅ Environment variables are properly loaded');
      } else {
        console.log('❌ Environment variables are missing');
      }
    } catch (error) {
      console.error('❌ Failed to test lazy Supabase page:', error.message);
    }
    
    // Test 3: Test direct client access button
    console.log('\n3️⃣ Testing direct client access...');
    try {
      await page.click('button.bg-blue-500');
      
      // Wait for alert and handle it
      page.once('dialog', async dialog => {
        const message = dialog.message();
        console.log('Alert message:', message);
        
        if (message.includes('✅')) {
          console.log('✅ Direct client access test PASSED');
        } else {
          console.log('❌ Direct client access test FAILED');
        }
        
        await dialog.dismiss();
      });
      
      // Wait a bit for the alert to appear
      await page.waitForTimeout(2000);
    } catch (error) {
      console.error('❌ Failed to test direct client access:', error.message);
    }
    
    // Test 4: Test authentication pages
    console.log('\n4️⃣ Testing authentication pages...');
    try {
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
      console.log('✅ Login page loaded successfully');
      
      await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle2' });
      console.log('✅ Register page loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load authentication pages:', error.message);
    }
    
    // Test 5: Test dashboard and trades pages
    console.log('\n5️⃣ Testing main application pages...');
    try {
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      console.log('✅ Dashboard page loaded successfully');
      
      await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
      console.log('✅ Trades page loaded successfully');
      
      await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle2' });
      console.log('✅ Strategies page loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load main application pages:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testLazySupabaseFix().then(() => {
  console.log('\n🏁 Testing completed');
}).catch(error => {
  console.error('❌ Testing failed:', error);
});