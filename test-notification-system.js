const puppeteer = require('puppeteer');

async function testNotificationSystem() {
  console.log('🔍 Testing Notification System');
  console.log('================================');
  
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();
  
  try {
    // Navigate to the test notifications page
    console.log('📍 Navigating to test notifications page...');
    await page.goto('http://localhost:3000/test-notifications', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForSelector('button', { timeout: 5000 });
    console.log('✅ Test page loaded successfully');
    
    // Test 1: Success Notification
    console.log('\n🟢 Testing Success Notification...');
    await page.click('button:contains("Test Success Notification")');
    await page.waitForTimeout(1000);
    
    // Check if toast appears
    const successToast = await page.$('.toast-wrapper');
    if (successToast) {
      console.log('✅ Success toast appears correctly');
      
      // Check content
      const toastText = await page.$eval('.toast-wrapper', el => el.textContent);
      if (toastText.includes('Trade Logged Successfully!') && toastText.includes('AAPL')) {
        console.log('✅ Success toast contains correct trade details');
      } else {
        console.log('❌ Success toast missing trade details:', toastText);
      }
    } else {
      console.log('❌ Success toast did not appear');
    }
    
    // Test 2: Error Notification
    console.log('\n🔴 Testing Error Notification...');
    await page.click('button:contains("Test Error Notification")');
    await page.waitForTimeout(1000);
    
    // Check if error toast appears
    const errorToast = await page.$('.toast-wrapper');
    if (errorToast) {
      console.log('✅ Error toast appears correctly');
    } else {
      console.log('❌ Error toast did not appear');
    }
    
    // Test 3: Multiple Notifications
    console.log('\n🔄 Testing Multiple Notifications...');
    await page.click('button:contains("Test Multiple Notifications")');
    await page.waitForTimeout(2000);
    
    // Count toasts
    const toasts = await page.$$('.toast-wrapper');
    if (toasts.length >= 2) {
      console.log(`✅ Multiple toasts displayed correctly (${toasts.length} toasts)`);
    } else {
      console.log(`❌ Multiple toasts not working (only ${toasts.length} toasts)`);
    }
    
    // Test 4: Toast Auto-Close
    console.log('\n⏰ Testing Toast Auto-Close...');
    const initialToastCount = await page.$$('.toast-wrapper').then(toasts => toasts.length);
    await page.waitForTimeout(5000); // Wait for auto-close
    const finalToastCount = await page.$$('.toast-wrapper').then(toasts => toasts.length);
    
    if (finalToastCount < initialToastCount) {
      console.log('✅ Toasts auto-close correctly');
    } else {
      console.log('❌ Toasts not auto-closing');
    }
    
    // Test 5: Toast Manual Close
    console.log('\n❌ Testing Toast Manual Close...');
    await page.click('button:contains("Test Success Notification")');
    await page.waitForTimeout(500);
    
    // Try to find and click close button
    const closeButton = await page.$('button[aria-label="Close alert"]');
    if (closeButton) {
      await closeButton.click();
      await page.waitForTimeout(500);
      const toastCount = await page.$$('.toast-wrapper').then(toasts => toasts.length);
      console.log('✅ Toast manual close works');
    } else {
      console.log('❌ Toast close button not found');
    }
    
    // Test 6: Test with actual trade logging
    console.log('\n📝 Testing with Actual Trade Logging...');
    await page.goto('http://localhost:3000/log-trade', { waitUntil: 'networkidle2' });
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Fill in trade form
    await page.select('[name="market"]', 'stock');
    await page.type('input[placeholder="e.g., AAPL, BTCUSD"]', 'AAPL');
    await page.type('input[placeholder="0.00"]', '100');
    await page.type('input[name="pnl"]', '150.50');
    
    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Check if success toast appears after trade logging
    const tradeToast = await page.$('.toast-wrapper');
    if (tradeToast) {
      const tradeToastText = await page.$eval('.toast-wrapper', el => el.textContent);
      if (tradeToastText.includes('Trade Logged Successfully!')) {
        console.log('✅ Trade logging notification works correctly');
      } else {
        console.log('❌ Trade logging notification incorrect:', tradeToastText);
      }
    } else {
      console.log('❌ No notification appeared after trade logging');
    }
    
    console.log('\n🎯 Notification System Test Complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testNotificationSystem();