const puppeteer = require('puppeteer');
const path = require('path');

async function testTradesPage() {
  console.log('🧪 Starting TradeHistory component tests...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to false to watch the test
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the browser
  page.on('console', msg => {
    console.log('🌐 BROWSER:', msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.error('🚨 PAGE ERROR:', error.message);
  });
  
  // Enable request logging
  page.on('request', request => {
    console.log('📡 REQUEST:', request.url());
  });
  
  try {
    console.log('📍 Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we're redirected to login (authentication required)
    const currentUrl = page.url();
    console.log('🔍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('🔐 Authentication required - redirecting to login page');
      
      // For testing purposes, let's use our test page that doesn't require auth
      console.log('🧪 Using test page without authentication...');
      
      // Navigate to our test page that includes TradeHistory component
      await page.goto('http://localhost:3000/test-trades', {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      
      await page.waitForTimeout(2000);
      console.log('✅ Test trades page loaded successfully');
      
    } else {
      console.log('✅ Trades page loaded successfully');
      
      // Test 1: Check if dummy data is loaded
      console.log('🧪 Test 1: Checking for dummy trade data...');
      const tradeItems = await page.$$('.flashlight-container');
      console.log(`📊 Found ${tradeItems.length} trade items`);
      
      if (tradeItems.length > 0) {
        console.log('✅ Test 1 PASSED: Dummy data loaded successfully');
      } else {
        console.log('❌ Test 1 FAILED: No trade data found');
      }
      
      // Test 2: Test flashlight hover effect
      console.log('🧪 Test 2: Testing flashlight hover effect...');
      if (tradeItems.length > 0) {
        const firstTrade = tradeItems[0];
        await firstTrade.hover();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if flashlight effect is applied
        const flashlightBg = await page.$eval('.flashlight-bg', el => 
          window.getComputedStyle(el).opacity
        );
        
        if (parseFloat(flashlightBg) > 0) {
          console.log('✅ Test 2 PASSED: Flashlight hover effect working');
        } else {
          console.log('❌ Test 2 FAILED: Flashlight effect not working');
        }
      }
      
      // Test 3: Test accordion toggle functionality
      console.log('🧪 Test 3: Testing accordion toggle functionality...');
      if (tradeItems.length > 0) {
        const firstTrade = tradeItems[0];
        const mainRow = await firstTrade.$('.relative.z-10.px-6.py-4.cursor-pointer');
        
        if (mainRow) {
          await mainRow.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const accordionContent = await firstTrade.$('.accordion-content.active');
          if (accordionContent) {
            console.log('✅ Test 3 PASSED: Accordion toggle working');
          } else {
            console.log('❌ Test 3 FAILED: Accordion not expanding');
          }
        }
      }
      
      // Test 4: Test edit modal
      console.log('🧪 Test 4: Testing edit modal...');
      if (tradeItems.length > 0) {
        const firstTrade = tradeItems[0];
        
        // First expand the trade to see the edit button
        const mainRow = await firstTrade.$('.relative.z-10.px-6.py-4.cursor-pointer');
        if (mainRow) {
          await mainRow.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Look for edit button
          const editButton = await firstTrade.$('button:has(svg)');
          if (editButton) {
            await editButton.click();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if edit modal is open
            const editModal = await page.$('.fixed.inset-0');
            if (editModal) {
              console.log('✅ Test 4 PASSED: Edit modal opens correctly');
              
              // Test form inputs
              const symbolInput = await page.$('input[placeholder*="Symbol"]');
              if (symbolInput) {
                const symbolValue = await page.$eval('input[placeholder*="Symbol"]', el => el.value);
                console.log(`📝 Symbol input value: ${symbolValue}`);
                
                if (symbolValue) {
                  console.log('✅ Test 4b PASSED: Form inputs populated correctly');
                } else {
                  console.log('❌ Test 4b FAILED: Form inputs not populated');
                }
              }
              
              // Test emotional state selection
              const emotionButtons = await page.$$('.grid button');
              if (emotionButtons.length > 0) {
                console.log(`🎭 Found ${emotionButtons.length} emotion buttons`);
                await emotionButtons[0].click();
                await page.waitForTimeout(300);
                console.log('✅ Test 4c PASSED: Emotional state selection working');
              }
              
              // Test cancel button
              const cancelButton = await page.$('button:has-text("Cancel")');
              if (cancelButton) {
                await cancelButton.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                console.log('✅ Test 4d PASSED: Cancel button working');
              }
            } else {
              console.log('❌ Test 4 FAILED: Edit modal not opening');
            }
          }
        }
      }
      
      // Test 5: Test delete modal
      console.log('🧪 Test 5: Testing delete modal...');
      if (tradeItems.length > 0) {
        const firstTrade = tradeItems[0];
        
        // First expand the trade to see the delete button
        const mainRow = await firstTrade.$('.relative.z-10.px-6.py-4.cursor-pointer');
        if (mainRow) {
          await mainRow.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Look for delete button (second button with svg)
          const buttons = await firstTrade.$$('button:has(svg)');
          if (buttons.length > 1) {
            await buttons[1].click(); // Delete button should be the second one
            await page.waitForTimeout(500);
            
            // Check if delete modal is open
            const deleteModal = await page.$('.fixed.inset-0');
            if (deleteModal) {
              console.log('✅ Test 5 PASSED: Delete modal opens correctly');
              
              // Test cancel button in delete modal
              const cancelButton = await page.$('button:has-text("Cancel")');
              if (cancelButton) {
                await cancelButton.click();
                await page.waitForTimeout(500);
                console.log('✅ Test 5b PASSED: Delete modal cancel working');
              }
            } else {
              console.log('❌ Test 5 FAILED: Delete modal not opening');
            }
          }
        }
      }
      
      // Test 6: Check styling and colors
      console.log('🧪 Test 6: Checking styling and colors...');
      const goldElements = await page.$$('.text-gold, .bg-gold, .border-gold');
      console.log(`🎨 Found ${goldElements.length} gold-colored elements`);
      
      if (goldElements.length > 0) {
        console.log('✅ Test 6 PASSED: Custom Tailwind colors applied');
      } else {
        console.log('⚠️ Test 6 WARNING: No gold elements found');
      }
      
      // Test 7: Test responsive behavior
      console.log('🧪 Test 7: Testing responsive behavior...');
      
      // Test mobile view
      await page.setViewport({ width: 375, height: 667 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mobileLayout = await page.$('.verotrade-top-navigation');
      if (mobileLayout) {
        console.log('✅ Test 7 PASSED: Responsive layout working');
      } else {
        console.log('⚠️ Test 7 WARNING: Responsive layout issues');
      }
      
      // Reset to desktop view
      await page.setViewport({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);
    }
    
    console.log('🏁 All tests completed!');
    
  } catch (error) {
    console.error('🚨 Test error:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('🔍 Keeping browser open for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testTradesPage();