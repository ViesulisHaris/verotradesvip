const puppeteer = require('puppeteer');

async function testModalFunctionality() {
  console.log('🔍 Starting Modal Functionality Test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from page
    page.on('console', msg => {
      console.log('🌐 Browser Console:', msg.text());
    });
    
    // Test 1: Test Modal Debug Page
    console.log('📋 Test 1: Testing Modal Debug Page');
    await page.goto('http://localhost:3000/test-modal-debug');
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check if debug page loads
    const debugTitle = await page.$eval('h1', el => el.textContent);
    console.log('✅ Debug page title:', debugTitle);
    
    // Test Edit Modal on Debug Page
    console.log('🔧 Testing Edit Modal on Debug Page...');
    const editButton = await page.$('button');
    if (editButton) {
      const buttonText = await page.evaluate(el => el.textContent, editButton);
      if (buttonText && buttonText.includes('Edit Trade')) {
        console.log('✅ Edit button found');
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // Check if modal appears by looking for the modal content
        const editModalVisible = await page.$eval('.fixed.inset-0.bg-black\\/60', el => {
          return window.getComputedStyle(el).display !== 'none' && 
                 window.getComputedStyle(el).visibility !== 'hidden';
        });
        
        if (editModalVisible) {
          console.log('✅ Edit modal is visible on debug page');
        } else {
          console.log('❌ Edit modal is NOT visible on debug page');
        }
        
        // Close modal
        const closeButton = await page.$('button:has-text("Cancel")');
        if (closeButton) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      } else {
        console.log('❌ Edit button not found on debug page');
      }
    }
    
    // Test Delete Modal on Debug Page
    console.log('🗑️ Testing Delete Modal on Debug Page...');
    const deleteButton = await page.$('button');
    if (deleteButton) {
      const buttonText = await page.evaluate(el => el.textContent, deleteButton);
      if (buttonText && buttonText.includes('Delete Trade')) {
        console.log('✅ Delete button found');
        await deleteButton.click();
        await page.waitForTimeout(1000);
        
        // Check if modal appears
        const deleteModalVisible = await page.$eval('.fixed.inset-0.bg-black\\/60', el => {
          return window.getComputedStyle(el).display !== 'none' && 
                 window.getComputedStyle(el).visibility !== 'hidden';
        });
        
        if (deleteModalVisible) {
          console.log('✅ Delete modal is visible on debug page');
        } else {
          console.log('❌ Delete modal is NOT visible on debug page');
        }
        
        // Close modal
        const cancelButton = await page.$('button:has-text("Cancel")');
        if (cancelButton) {
          await cancelButton.click();
          await page.waitForTimeout(500);
        }
      } else {
        console.log('❌ Delete button not found on debug page');
      }
    }
    
    // Test 2: Test Actual Trades Page (if accessible)
    console.log('\n📋 Test 2: Testing Actual Trades Page');
    try {
      await page.goto('http://localhost:3000/trades');
      await page.waitForTimeout(3000); // Wait for page to load
      
      // Check if we need to login
      const loginRequired = await page.$('text=Login');
      if (loginRequired) {
        console.log('🔐 Login required for trades page - skipping modal test');
      } else {
        // Look for trade items
        const tradeItems = await page.$$('.flashlight-container');
        console.log(`📊 Found ${tradeItems.length} trade items`);
        
        if (tradeItems.length > 0) {
          // Expand first trade to show action buttons
          const firstTrade = tradeItems[0];
          await firstTrade.click();
          await page.waitForTimeout(500);
          
          // Look for edit and delete buttons in expanded trade
          const editBtn = await page.$('button svg.lucide-edit');
          const deleteBtn = await page.$('button svg.lucide-trash-2');
          
          if (editBtn && deleteBtn) {
            console.log('✅ Edit and Delete buttons found in trade item');
            
            // Test edit button
            console.log('🔧 Testing Edit Modal on Trades Page...');
            await editBtn.click();
            await page.waitForTimeout(1000);
            
            const editModalVisible = await page.$eval('.fixed.inset-0.bg-black\\/60', el => {
              return window.getComputedStyle(el).display !== 'none' && 
                     window.getComputedStyle(el).visibility !== 'hidden';
            });
            
            if (editModalVisible) {
              console.log('✅ Edit modal is visible on trades page');
            } else {
              console.log('❌ Edit modal is NOT visible on trades page');
            }
            
            // Close modal if open
            const closeBtn = await page.$('button:has(.lucide-x-circle)');
            if (closeBtn) {
              await closeBtn.click();
              await page.waitForTimeout(500);
            }
            
          } else {
            console.log('❌ Edit and Delete buttons not found in trade item');
          }
        } else {
          console.log('📭 No trade items found on trades page');
        }
      }
    } catch (error) {
      console.log('❌ Error accessing trades page:', error.message);
    }
    
    // Test 3: Check z-index issues
    console.log('\n📋 Test 3: Checking Z-index Issues');
    await page.goto('http://localhost:3000/test-modal-debug');
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'modal-debug-test.png', fullPage: true });
    console.log('📸 Screenshot saved as modal-debug-test.png');
    
    // Check z-index values in CSS
    const zIndexValues = await page.evaluate(() => {
      const modalBackdrop = document.querySelector('.fixed.inset-0.bg-black\\/60');
      const modalContent = document.querySelector('.bg-surface.rounded-xl');
      
      return {
        modalBackdropZIndex: modalBackdrop ? window.getComputedStyle(modalBackdrop).zIndex : 'not found',
        modalContentZIndex: modalContent ? window.getComputedStyle(modalContent).zIndex : 'not found',
        modalBackdropDisplay: modalBackdrop ? window.getComputedStyle(modalBackdrop).display : 'not found',
        modalBackdropVisibility: modalBackdrop ? window.getComputedStyle(modalBackdrop).visibility : 'not found'
      };
    });
    
    console.log('🔍 Z-index Analysis:', zIndexValues);
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n🏁 Modal Functionality Test Complete');
}

// Run test
testModalFunctionality().catch(console.error);