// Manual Notification System Test
// Run this script in the browser console on the test-notifications page

console.log('🔍 Starting Manual Notification System Test');
console.log('==========================================');

// Test 1: Success Notification
console.log('\n🟢 Test 1: Success Notification');
const successBtn = Array.from(document.querySelectorAll('button')).find(btn => 
  btn.textContent.includes('Test Success Notification')
);
if (successBtn) {
  successBtn.click();
  setTimeout(() => {
    const toast = document.querySelector('.toast-wrapper');
    if (toast) {
      console.log('✅ Success toast appears');
      const toastText = toast.textContent;
      if (toastText.includes('Trade Logged Successfully!') && toastText.includes('AAPL')) {
        console.log('✅ Success toast contains correct trade details');
      } else {
        console.log('❌ Success toast missing details:', toastText);
      }
    } else {
      console.log('❌ Success toast not found');
    }
  }, 500);
} else {
  console.log('❌ Success button not found');
}

// Test 2: Error Notification (after 2 seconds)
setTimeout(() => {
  console.log('\n🔴 Test 2: Error Notification');
  const errorBtn = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('Test Error Notification')
  );
  if (errorBtn) {
    errorBtn.click();
    setTimeout(() => {
      const toasts = document.querySelectorAll('.toast-wrapper');
      if (toasts.length > 0) {
        console.log('✅ Error toast appears');
      } else {
        console.log('❌ Error toast not found');
      }
    }, 500);
  }
}, 2000);

// Test 3: Multiple Notifications (after 4 seconds)
setTimeout(() => {
  console.log('\n🔄 Test 3: Multiple Notifications');
  const multiBtn = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('Test Multiple Notifications')
  );
  if (multiBtn) {
    const initialCount = document.querySelectorAll('.toast-wrapper').length;
    multiBtn.click();
    
    setTimeout(() => {
      const finalCount = document.querySelectorAll('.toast-wrapper').length;
      if (finalCount > initialCount) {
        console.log(`✅ Multiple toasts work (${finalCount} toasts total)`);
      } else {
        console.log('❌ Multiple toasts not working');
      }
    }, 2000);
  }
}, 4000);

// Test 4: Manual Close (after 7 seconds)
setTimeout(() => {
  console.log('\n❌ Test 4: Manual Close');
  const closeBtn = document.querySelector('button[aria-label="Close alert"]');
  if (closeBtn) {
    const initialCount = document.querySelectorAll('.toast-wrapper').length;
    closeBtn.click();
    
    setTimeout(() => {
      const finalCount = document.querySelectorAll('.toast-wrapper').length;
      if (finalCount < initialCount) {
        console.log('✅ Manual close works');
      } else {
        console.log('❌ Manual close not working');
      }
    }, 500);
  } else {
    console.log('❌ Close button not found');
  }
}, 7000);

// Test 5: Toast Container Position (after 9 seconds)
setTimeout(() => {
  console.log('\n📍 Test 5: Toast Container Position');
  const container = document.querySelector('.toast-container');
  if (container) {
    const styles = window.getComputedStyle(container);
    const position = styles.position;
    const top = styles.top;
    const right = styles.right;
    const zIndex = styles.zIndex;
    
    console.log('Container styles:', { position, top, right, zIndex });
    
    if (position === 'fixed' && parseInt(zIndex) > 1000) {
      console.log('✅ Toast container positioned correctly');
    } else {
      console.log('❌ Toast container positioning issue');
    }
  } else {
    console.log('❌ Toast container not found');
  }
}, 9000);

// Test 6: Toast Animation (after 11 seconds)
setTimeout(() => {
  console.log('\n✨ Test 6: Toast Animation');
  const successBtn = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('Test Success Notification')
  );
  if (successBtn) {
    successBtn.click();
    
    // Check for animation classes
    setTimeout(() => {
      const toast = document.querySelector('.toast-wrapper');
      if (toast) {
        const hasEnterClass = toast.classList.contains('toast-enter');
        console.log('Toast animation classes:', Array.from(toast.classList));
        
        if (hasEnterClass || toast.style.animation) {
          console.log('✅ Toast animation working');
        } else {
          console.log('⚠️ Toast animation unclear');
        }
      }
    }, 100);
  }
}, 11000);

console.log('\n🎯 Manual test initiated. Check console for results.');
console.log('⏱️ Tests will run automatically over the next 13 seconds.');