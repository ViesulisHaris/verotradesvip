// Test Trade Logging Notification System
// This script will test the notification system by simulating trade logging

console.log('🔍 Testing Trade Logging Notification System');
console.log('==========================================');

// Wait for page to load
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Test function to fill and submit trade form
async function testTradeLoggingNotification() {
  try {
    // Check if we're on the log-trade page
    if (!window.location.pathname.includes('log-trade')) {
      console.log('❌ Not on log-trade page. Please navigate to /log-trade first.');
      return;
    }
    
    console.log('📍 On log-trade page, starting test...');
    
    // Wait for form to be available
    const form = await waitForElement('form');
    console.log('✅ Form found');
    
    // Fill in the trade form with test data
    console.log('📝 Filling in trade form...');
    
    // Select market type (stock)
    const stockButton = document.querySelector('button[type="button"]:has-text("stock")') || 
                      Array.from(document.querySelectorAll('button')).find(btn => 
                        btn.textContent.toLowerCase().includes('stock'));
    if (stockButton) {
      stockButton.click();
      console.log('✅ Market type selected: stock');
    }
    
    // Fill symbol
    const symbolInput = document.querySelector('input[placeholder="e.g., AAPL, BTCUSD"]');
    if (symbolInput) {
      symbolInput.value = 'AAPL';
      symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Symbol filled: AAPL');
    }
    
    // Fill quantity
    const quantityInput = document.querySelector('input[placeholder="0.00"]');
    if (quantityInput) {
      quantityInput.value = '100';
      quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Quantity filled: 100');
    }
    
    // Fill PnL
    const pnlInput = document.querySelector('input[name="pnl"]') ||
                     Array.from(document.querySelectorAll('input')).find(input => 
                       input.placeholder && input.placeholder.includes('0.00') && 
                       input !== quantityInput);
    if (pnlInput) {
      pnlInput.value = '150.50';
      pnlInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ PnL filled: 150.50');
    }
    
    // Get initial toast count
    const initialToastCount = document.querySelectorAll('.toast-wrapper').length;
    console.log(`🔢 Initial toast count: ${initialToastCount}`);
    
    // Submit the form
    console.log('📤 Submitting trade form...');
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.click();
      console.log('✅ Form submitted');
    } else {
      console.log('❌ Submit button not found');
      return;
    }
    
    // Wait for toast to appear
    setTimeout(() => {
      const finalToastCount = document.querySelectorAll('.toast-wrapper').length;
      console.log(`🔢 Final toast count: ${finalToastCount}`);
      
      if (finalToastCount > initialToastCount) {
        console.log('✅ New toast appeared after form submission');
        
        // Check toast content
        const toast = document.querySelector('.toast-wrapper');
        if (toast) {
          const toastText = toast.textContent;
          console.log('📄 Toast content:', toastText);
          
          if (toastText.includes('Trade Logged Successfully!')) {
            console.log('✅ Success message displayed');
          } else {
            console.log('❌ Unexpected success message');
          }
          
          if (toastText.includes('AAPL')) {
            console.log('✅ Trade symbol included in notification');
          } else {
            console.log('❌ Trade symbol missing from notification');
          }
          
          if (toastText.includes('100')) {
            console.log('✅ Trade quantity included in notification');
          } else {
            console.log('❌ Trade quantity missing from notification');
          }
          
          if (toastText.includes('150.50') || toastText.includes('$150.50')) {
            console.log('✅ Trade PnL included in notification');
          } else {
            console.log('❌ Trade PnL missing from notification');
          }
        }
        
        // Test toast positioning
        const container = document.querySelector('.toast-container');
        if (container) {
          const styles = window.getComputedStyle(container);
          console.log('📍 Toast container position:', {
            position: styles.position,
            top: styles.top,
            right: styles.right,
            zIndex: styles.zIndex
          });
          
          if (styles.position === 'fixed' && parseInt(styles.zIndex) > 1000) {
            console.log('✅ Toast container positioned correctly');
          } else {
            console.log('❌ Toast container positioning issue');
          }
        }
        
        // Test manual close
        setTimeout(() => {
          const closeButton = document.querySelector('button[aria-label="Close alert"]');
          if (closeButton) {
            closeButton.click();
            setTimeout(() => {
              const afterCloseCount = document.querySelectorAll('.toast-wrapper').length;
              if (afterCloseCount < finalToastCount) {
                console.log('✅ Manual close works');
              } else {
                console.log('❌ Manual close not working');
              }
            }, 500);
          }
        }, 2000);
        
      } else {
        console.log('❌ No toast appeared after form submission');
        
        // Check for error messages
        const errorElements = document.querySelectorAll('[role="alert"], .error, .text-loss');
        if (errorElements.length > 0) {
          console.log('🔍 Found error elements:', errorElements.length);
          errorElements.forEach((el, i) => {
            console.log(`  Error ${i + 1}:`, el.textContent);
          });
        }
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-execute if on log-trade page
if (window.location.pathname.includes('log-trade')) {
  // Wait a bit for page to fully load
  setTimeout(testTradeLoggingNotification, 1000);
} else {
  console.log('❌ Please run this script on the /log-trade page');
}

// Also provide a manual trigger
window.testTradeNotification = testTradeLoggingNotification;
console.log('💡 You can also run: testTradeNotification()');