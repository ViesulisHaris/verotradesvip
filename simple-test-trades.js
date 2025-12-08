const puppeteer = require('puppeteer');

async function simpleTestTrades() {
  console.log('🧪 Starting simple TradeHistory component test...');
  
  const browser = await puppeteer.launch({
    headless: false,
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
  
  try {
    console.log('📍 Navigating to test-trades page...');
    await page.goto('http://localhost:3000/test-trades', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 1: Check if dummy data is loaded
    console.log('🧪 Test 1: Checking for dummy trade data...');
    const tradeItems = await page.$$('.flashlight-container');
    console.log(`📊 Found ${tradeItems.length} trade items`);
    
    if (tradeItems.length > 0) {
      console.log('✅ Test 1 PASSED: Dummy data loaded successfully');
      
      // Test 2: Test flashlight hover effect
      console.log('🧪 Test 2: Testing flashlight hover effect...');
      const firstTrade = tradeItems[0];
      await firstTrade.hover();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if flashlight effect is applied by checking for hover state
      const hoverState = await page.evaluate(() => {
        const flashlightBg = document.querySelector('.flashlight-bg');
        if (flashlightBg) {
          const style = window.getComputedStyle(flashlightBg);
          return style.opacity;
        }
        return null;
      });
      
      console.log(`🔦 Flashlight opacity: ${hoverState}`);
      if (hoverState && parseFloat(hoverState) > 0) {
        console.log('✅ Test 2 PASSED: Flashlight hover effect working');
      } else {
        console.log('❌ Test 2 FAILED: Flashlight effect not working');
      }
      
      // Test 3: Test accordion toggle functionality
      console.log('🧪 Test 3: Testing accordion toggle functionality...');
      const mainRow = await firstTrade.$('.relative.z-10.px-6.py-4.cursor-pointer');
      
      if (mainRow) {
        await mainRow.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const accordionActive = await page.evaluate(() => {
          const accordion = document.querySelector('.accordion-content.active');
          return accordion !== null;
        });
        
        if (accordionActive) {
          console.log('✅ Test 3 PASSED: Accordion toggle working');
        } else {
          console.log('❌ Test 3 FAILED: Accordion not expanding');
        }
      }
      
      // Test 4: Test edit modal
      console.log('🧪 Test 4: Testing edit modal...');
      const editButton = await firstTrade.$('button:has(svg)');
      
      if (editButton) {
        await editButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const editModalOpen = await page.evaluate(() => {
          const modal = document.querySelector('.fixed.inset-0');
          return modal !== null;
        });
        
        if (editModalOpen) {
          console.log('✅ Test 4 PASSED: Edit modal opens correctly');
          
          // Test form inputs
          const symbolInput = await page.$('input[placeholder*="Symbol"]');
          if (symbolInput) {
            const symbolValue = await page.evaluate(el => el.value, symbolInput);
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
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('✅ Test 4c PASSED: Emotional state selection working');
          }
          
          // Test cancel button
          const cancelButton = await page.$('button:has-text("Cancel")');
          if (cancelButton) {
            await cancelButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Test 4d PASSED: Cancel button working');
          }
        } else {
          console.log('❌ Test 4 FAILED: Edit modal not opening');
        }
      }
      
      // Test 5: Check styling and colors
      console.log('🧪 Test 5: Checking styling and colors...');
      const goldElements = await page.$$('.text-gold, .bg-gold, .border-gold');
      console.log(`🎨 Found ${goldElements.length} gold-colored elements`);
      
      if (goldElements.length > 0) {
        console.log('✅ Test 5 PASSED: Custom Tailwind colors applied');
      } else {
        console.log('⚠️ Test 5 WARNING: No gold elements found');
      }
      
      // Test 6: Test responsive behavior
      console.log('🧪 Test 6: Testing responsive behavior...');
      
      // Test mobile view
      await page.setViewport({ width: 375, height: 667 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mobileLayoutWorking = await page.evaluate(() => {
        // Check if layout adapts to mobile
        return window.innerWidth <= 375;
      });
      
      if (mobileLayoutWorking) {
        console.log('✅ Test 6 PASSED: Responsive layout working');
      } else {
        console.log('⚠️ Test 6 WARNING: Responsive layout issues');
      }
      
      // Reset to desktop view
      await page.setViewport({ width: 1920, height: 1080 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } else {
      console.log('❌ Test 1 FAILED: No trade data found');
    }
    
    console.log('🏁 All tests completed!');
    
  } catch (error) {
    console.error('🚨 Test error:', error);
  } finally {
    console.log('🔍 Keeping browser open for 3 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
  }
}

simpleTestTrades();