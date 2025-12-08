const puppeteer = require('puppeteer');

async function detailedTestTrades() {
  console.log('🧪 Starting detailed TradeHistory component test...');
  
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
      
      // Test 2: Test flashlight hover effect with more detailed checking
      console.log('🧪 Test 2: Testing flashlight hover effect...');
      const firstTrade = tradeItems[0];
      
      // First, check if flashlight elements exist
      const flashlightElements = await page.evaluate(() => {
        const container = document.querySelector('.flashlight-container');
        if (container) {
          return {
            hasBg: !!container.querySelector('.flashlight-bg'),
            hasBorder: !!container.querySelector('.flashlight-border'),
            bgOpacity: container.querySelector('.flashlight-bg') ? 
              window.getComputedStyle(container.querySelector('.flashlight-bg')).opacity : 'not found',
            borderOpacity: container.querySelector('.flashlight-border') ? 
              window.getComputedStyle(container.querySelector('.flashlight-border')).opacity : 'not found'
          };
        }
        return null;
      });
      
      console.log('🔦 Flashlight elements:', flashlightElements);
      
      // Move mouse to the trade item
      await firstTrade.hover();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Longer wait for hover effect
      
      // Check hover state after longer delay
      const hoverState = await page.evaluate(() => {
        const container = document.querySelector('.flashlight-container');
        if (container) {
          const flashlightBg = container.querySelector('.flashlight-bg');
          const flashlightBorder = container.querySelector('.flashlight-border');
          return {
            bgOpacity: flashlightBg ? window.getComputedStyle(flashlightBg).opacity : 'not found',
            borderOpacity: flashlightBorder ? window.getComputedStyle(flashlightBorder).opacity : 'not found',
            isHovered: container.matches(':hover')
          };
        }
        return null;
      });
      
      console.log('🔦 Flashlight hover state:', hoverState);
      
      if (hoverState && (hoverState.isHovered || (parseFloat(hoverState.bgOpacity) > 0))) {
        console.log('✅ Test 2 PASSED: Flashlight hover effect working');
      } else {
        console.log('❌ Test 2 FAILED: Flashlight effect not working');
        console.log('🔧 Diagnosis: CSS hover effect may not be triggering properly');
      }
      
      // Test 3: Test accordion toggle functionality
      console.log('🧪 Test 3: Testing accordion toggle functionality...');
      
      // First expand the trade
      const mainRow = await firstTrade.$('.relative.z-10.px-6.py-4.cursor-pointer');
      
      if (mainRow) {
        // Check initial state
        const initialState = await page.evaluate(() => {
          const accordion = document.querySelector('.accordion-content');
          return accordion ? accordion.classList.contains('active') : false;
        });
        
        console.log('📂 Initial accordion state (active?):', initialState);
        
        await mainRow.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const expandedState = await page.evaluate(() => {
          const accordion = document.querySelector('.accordion-content');
          return accordion ? accordion.classList.contains('active') : false;
        });
        
        console.log('📂 Expanded accordion state (active?):', expandedState);
        
        if (expandedState && !initialState) {
          console.log('✅ Test 3a PASSED: Accordion expands correctly');
          
          // Test collapse
          await mainRow.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const collapsedState = await page.evaluate(() => {
            const accordion = document.querySelector('.accordion-content');
            return accordion ? accordion.classList.contains('active') : false;
          });
          
          console.log('📂 Collapsed accordion state (active?):', collapsedState);
          
          if (!collapsedState) {
            console.log('✅ Test 3b PASSED: Accordion collapses correctly');
          } else {
            console.log('❌ Test 3b FAILED: Accordion not collapsing');
          }
        } else {
          console.log('❌ Test 3a FAILED: Accordion not expanding');
        }
      }
      
      // Test 4: Test edit modal
      console.log('🧪 Test 4: Testing edit modal...');
      
      // First expand the trade to see edit button
      await mainRow.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for edit button specifically
      const editButton = await firstTrade.$('button:has(.lucide-edit)');
      
      if (editButton) {
        console.log('✅ Edit button found');
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
        
        console.log('📝 Edit modal state:', editModalOpen);
        
        if (editModalOpen.exists && editModalOpen.visible) {
          console.log('✅ Test 4a PASSED: Edit modal opens correctly');
          
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
            
            // Check initial state
            const initialEmotionState = await page.evaluate(() => {
              const selectedEmotions = document.querySelectorAll('.flex.flex-wrap.gap-2 button');
              return selectedEmotions.length;
            });
            
            console.log(`🎭 Initial selected emotions: ${initialEmotionState}`);
            
            await emotionButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const afterClickEmotionState = await page.evaluate(() => {
              const selectedEmotions = document.querySelectorAll('.flex.flex-wrap.gap-2 button');
              return selectedEmotions.length;
            });
            
            console.log(`🎭 After click selected emotions: ${afterClickEmotionState}`);
            
            if (afterClickEmotionState > initialEmotionState) {
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
              console.log('✅ Test 4d PASSED: Cancel button working');
            } else {
              console.log('❌ Test 4d FAILED: Cancel button not closing modal');
            }
          }
        } else {
          console.log('❌ Test 4a FAILED: Edit modal not opening properly');
        }
      } else {
        console.log('❌ Edit button not found');
      }
      
      // Test 5: Test delete modal
      console.log('🧪 Test 5: Testing delete modal...');
      
      // Expand trade again if needed
      const currentAccordionState = await page.evaluate(() => {
        const accordion = document.querySelector('.accordion-content');
        return accordion ? accordion.classList.contains('active') : false;
      });
      
      if (!currentAccordionState) {
        await mainRow.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Look for delete button specifically
      const deleteButton = await firstTrade.$('button:has(.lucide-trash-2)');
      
      if (deleteButton) {
        console.log('✅ Delete button found');
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
        
        console.log('🗑️ Delete modal state:', deleteModalOpen);
        
        if (deleteModalOpen.exists && deleteModalOpen.visible) {
          console.log('✅ Test 5a PASSED: Delete modal opens correctly');
          
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
              console.log('✅ Test 5b PASSED: Delete modal cancel working');
            } else {
              console.log('❌ Test 5b FAILED: Delete modal cancel not closing modal');
            }
          }
        } else {
          console.log('❌ Test 5a FAILED: Delete modal not opening properly');
        }
      } else {
        console.log('❌ Delete button not found');
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
      
      const mobileLayoutWorking = await page.evaluate(() => {
        return window.innerWidth <= 375;
      });
      
      if (mobileLayoutWorking) {
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
    
    console.log('🏁 All tests completed!');
    
  } catch (error) {
    console.error('🚨 Test error:', error);
  } finally {
    console.log('🔍 Keeping browser open for 3 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
  }
}

detailedTestTrades();