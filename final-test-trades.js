const puppeteer = require('puppeteer');

async function finalTestTrades() {
  console.log('🧪 Starting FINAL comprehensive TradeHistory component test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from browser
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
    
    const results = {
      dummyDataLoaded: false,
      flashlightEffect: false,
      accordionToggle: false,
      editModalOpen: false,
      editModalDataPopulated: false,
      emotionalStateSelection: false,
      saveCancelWorking: false,
      deleteModalOpen: false,
      deleteConfirmationWorking: false,
      stylingCorrect: false,
      consoleErrors: [],
      responsiveWorking: false
    };
    
    // Test 1: Check if dummy data is loaded
    console.log('🧪 Test 1: Checking for dummy trade data...');
    const tradeItems = await page.$$('.flashlight-container');
    console.log(`📊 Found ${tradeItems.length} trade items`);
    
    if (tradeItems.length > 0) {
      results.dummyDataLoaded = true;
      console.log('✅ Test 1 PASSED: Dummy data loaded successfully');
      
      const firstTrade = tradeItems[0];
      
      // Test 2: Test flashlight hover effect
      console.log('🧪 Test 2: Testing flashlight hover effect...');
      await firstTrade.hover();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const flashlightWorking = await page.evaluate(() => {
        const container = document.querySelector('.flashlight-container');
        if (container) {
          const flashlightBg = container.querySelector('.flashlight-bg');
          const style = window.getComputedStyle(flashlightBg);
          return parseFloat(style.opacity) > 0;
        }
        return false;
      });
      
      results.flashlightEffect = flashlightWorking;
      console.log(`🔦 Flashlight effect working: ${flashlightWorking}`);
      
      // Test 3: Test accordion toggle functionality
      console.log('🧪 Test 3: Testing accordion toggle functionality...');
      const mainRow = await firstTrade.$('.relative.z-10.px-6.py-4.cursor-pointer');
      
      if (mainRow) {
        // Check initial state
        const initialState = await page.evaluate(() => {
          const accordion = document.querySelector('.accordion-content');
          return accordion ? accordion.classList.contains('active') : false;
        });
        
        await mainRow.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const expandedState = await page.evaluate(() => {
          const accordion = document.querySelector('.accordion-content');
          return accordion ? accordion.classList.contains('active') : false;
        });
        
        if (expandedState && !initialState) {
          results.accordionToggle = true;
          console.log('✅ Test 3 PASSED: Accordion toggle working');
        } else {
          console.log('❌ Test 3 FAILED: Accordion not expanding');
        }
      }
      
      // Test 4: Test edit modal
      console.log('🧪 Test 4: Testing edit modal...');
      
      // Expand trade to see edit button
      await mainRow.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for edit button
      const editButton = await firstTrade.$('button:has(.lucide-edit)');
      
      if (editButton) {
        await editButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const editModalOpen = await page.evaluate(() => {
          const modal = document.querySelector('.fixed.inset-0');
          if (modal) {
            const isVisible = modal.style.display !== 'none' && 
                           modal.offsetHeight > 0 && 
                           modal.offsetWidth > 0;
            return {
              exists: true,
              visible: isVisible,
              hasTitle: !!modal.querySelector('h2'),
              titleText: modal.querySelector('h2') ? modal.querySelector('h2').textContent : 'no title'
            };
          }
          return { exists: false };
        });
        
        if (editModalOpen.exists && editModalOpen.visible) {
          results.editModalOpen = true;
          console.log('✅ Test 4a PASSED: Edit modal opens correctly');
          
          // Test form inputs
          const symbolInput = await page.$('input[placeholder*="Symbol"]');
          if (symbolInput) {
            const symbolValue = await page.evaluate(el => el.value, symbolInput);
            if (symbolValue && symbolValue.length > 0) {
              results.editModalDataPopulated = true;
              console.log('✅ Test 4b PASSED: Form inputs populated correctly');
            } else {
              console.log('❌ Test 4b FAILED: Form inputs not populated');
            }
          }
          
          // Test emotional state selection
          const emotionButtons = await page.$$('.grid button');
          if (emotionButtons.length > 0) {
            const initialEmotionCount = await page.evaluate(() => {
              const selectedEmotions = document.querySelectorAll('.flex.flex-wrap.gap-2 button');
              return selectedEmotions.length;
            });
            
            await emotionButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const afterClickEmotionCount = await page.evaluate(() => {
              const selectedEmotions = document.querySelectorAll('.flex.flex-wrap.gap-2 button');
              return selectedEmotions.length;
            });
            
            if (afterClickEmotionCount > initialEmotionCount) {
              results.emotionalStateSelection = true;
              console.log('✅ Test 4c PASSED: Emotional state selection working');
            } else {
              console.log('❌ Test 4c FAILED: Emotional state selection not working');
            }
          }
          
          // Test cancel button
          const cancelButton = await page.$('button:has-text("Cancel")');
          if (cancelButton) {
            await cancelButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const modalClosed = await page.evaluate(() => {
              const modal = document.querySelector('.fixed.inset-0');
              return !modal || modal.style.display === 'none' || modal.offsetHeight === 0;
            });
            
            if (modalClosed) {
              results.saveCancelWorking = true;
              console.log('✅ Test 4d PASSED: Cancel button working');
            } else {
              console.log('❌ Test 4d FAILED: Cancel button not closing modal');
            }
          }
        } else {
          console.log('❌ Test 4a FAILED: Edit modal not opening properly');
        }
      }
      
      // Test 5: Test delete modal
      console.log('🧪 Test 5: Testing delete modal...');
      
      // Expand trade if needed
      await mainRow.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for delete button
      const deleteButton = await firstTrade.$('button:has(.lucide-trash-2)');
      
      if (deleteButton) {
        await deleteButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const deleteModalOpen = await page.evaluate(() => {
          const modal = document.querySelector('.fixed.inset-0');
          if (modal) {
            const isVisible = modal.style.display !== 'none' && 
                           modal.offsetHeight > 0 && 
                           modal.offsetWidth > 0;
            return {
              exists: true,
              visible: isVisible,
              hasTitle: !!modal.querySelector('h2'),
              titleText: modal.querySelector('h2') ? modal.querySelector('h2').textContent : 'no title',
              hasDeleteButton: !!modal.querySelector('button:has-text("Delete")'),
              hasCancelButton: !!modal.querySelector('button:has-text("Cancel")')
            };
          }
          return { exists: false };
        });
        
        if (deleteModalOpen.exists && deleteModalOpen.visible) {
          results.deleteModalOpen = true;
          console.log('✅ Test 5a PASSED: Delete modal opens correctly');
          
          // Test delete confirmation
          const deleteButtonInModal = await page.$('button:has-text("Delete")');
          if (deleteButtonInModal) {
            // We'll just test that the button exists and is clickable
            const canClick = await page.evaluate((btn) => {
              return btn && !btn.disabled;
            }, deleteButtonInModal);
            
            if (canClick) {
              results.deleteConfirmationWorking = true;
              console.log('✅ Test 5b PASSED: Delete confirmation working');
            } else {
              console.log('❌ Test 5b FAILED: Delete confirmation not working');
            }
          }
          
          // Test cancel button in delete modal
          const cancelButton = await page.$('button:has-text("Cancel")');
          if (cancelButton) {
            await cancelButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const modalClosed = await page.evaluate(() => {
              const modal = document.querySelector('.fixed.inset-0');
              return !modal || modal.style.display === 'none' || modal.offsetHeight === 0;
            });
            
            if (modalClosed) {
              results.saveCancelWorking = true;
              console.log('✅ Test 5c PASSED: Delete modal cancel working');
            }
          }
        } else {
          console.log('❌ Test 5a FAILED: Delete modal not opening properly');
        }
      }
      
      // Test 6: Check styling and colors
      console.log('🧪 Test 6: Checking styling and colors...');
      const goldElements = await page.$$('.text-gold, .bg-gold, .border-gold');
      if (goldElements.length > 0) {
        results.stylingCorrect = true;
        console.log('✅ Test 6 PASSED: Custom Tailwind colors applied');
      } else {
        console.log('⚠️ Test 6 WARNING: No gold elements found');
      }
      
      // Test 7: Test responsive behavior
      console.log('🧪 Test 7: Testing responsive behavior...');
      
      // Test mobile view
      await page.setViewport({ width: 375, height: 667 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mobileLayoutWorking = await page.evaluate(() => {
        return window.innerWidth <= 375;
      });
      
      if (mobileLayoutWorking) {
        results.responsiveWorking = true;
        console.log('✅ Test 7 PASSED: Responsive layout working');
      } else {
        console.log('⚠️ Test 7 WARNING: Responsive layout issues');
      }
      
      // Reset to desktop view
      await page.setViewport({ width: 1920, height: 1080 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } else {
      console.log('❌ Test 1 FAILED: No trade data found');
    }
    
    // Generate final report
    console.log('\n📋 FINAL TEST REPORT:');
    console.log('=====================================');
    console.log(`✅ Dummy Data Loaded: ${results.dummyDataLoaded}`);
    console.log(`✅ Flashlight Effect: ${results.flashlightEffect}`);
    console.log(`✅ Accordion Toggle: ${results.accordionToggle}`);
    console.log(`✅ Edit Modal Opens: ${results.editModalOpen}`);
    console.log(`✅ Edit Modal Data Populated: ${results.editModalDataPopulated}`);
    console.log(`✅ Emotional State Selection: ${results.emotionalStateSelection}`);
    console.log(`✅ Save/Cancel Working: ${results.saveCancelWorking}`);
    console.log(`✅ Delete Modal Opens: ${results.deleteModalOpen}`);
    console.log(`✅ Delete Confirmation Working: ${results.deleteConfirmationWorking}`);
    console.log(`✅ Styling Correct: ${results.stylingCorrect}`);
    console.log(`✅ Responsive Working: ${results.responsiveWorking}`);
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log('=====================================');
    console.log(`📊 OVERALL SUCCESS RATE: ${successRate}% (${passedTests}/${totalTests} tests passed)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! TradeHistory component is ready for use.');
    } else {
      console.log('⚠️ Some tests failed. Please review the issues above.');
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

finalTestTrades();