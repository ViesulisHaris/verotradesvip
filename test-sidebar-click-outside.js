// Test script to verify the "click outside to close" functionality for the sidebar
// This script should be run in the browser console to test the implementation

console.log('🔧 Starting sidebar "click outside to close" functionality test...');

// Test 1: Check if sidebar is initially closed on desktop
function testInitialState() {
  console.log('🧪 Test 1: Checking initial sidebar state...');
  
  // Check if the sidebar is closed (collapsed) initially
  const sidebar = document.querySelector('aside');
  if (sidebar) {
    const isCollapsed = sidebar.classList.contains('w-16');
    const isHidden = sidebar.classList.contains('translate-x-[-100%]');
    
    console.log(`Sidebar initial state - Collapsed: ${isCollapsed}, Hidden: ${isHidden}`);
    
    if (isCollapsed && !isHidden) {
      console.log('✅ Test 1 PASSED: Sidebar is initially collapsed but visible');
      return true;
    } else {
      console.log('❌ Test 1 FAILED: Sidebar is not in the expected initial state');
      return false;
    }
  } else {
    console.log('❌ Test 1 FAILED: Could not find sidebar element');
    return false;
  }
}

// Test 2: Test toggle button functionality
function testToggleFunction() {
  console.log('🧪 Test 2: Testing toggle button functionality...');
  
  // Find the toggle button (should be visible on desktop)
  const toggleButton = document.querySelector('button[aria-label*="sidebar"]');
  if (!toggleButton) {
    console.log('❌ Test 2 FAILED: Could not find toggle button');
    return false;
  }
  
  // Click the toggle button to open the sidebar
  toggleButton.click();
  
  // Wait a moment for the animation to complete
  setTimeout(() => {
    const sidebar = document.querySelector('aside');
    const isCollapsed = sidebar.classList.contains('w-16');
    const isExpanded = sidebar.classList.contains('w-64');
    
    console.log(`After opening - Collapsed: ${isCollapsed}, Expanded: ${isExpanded}`);
    
    if (isExpanded && !isCollapsed) {
      console.log('✅ Test 2 PASSED: Toggle button opens the sidebar correctly');
      
      // Now test closing the sidebar
      const closeButton = document.querySelector('button[aria-label*="sidebar"]');
      if (closeButton) {
        closeButton.click();
        
        setTimeout(() => {
          const isCollapsedAfterClose = sidebar.classList.contains('w-16');
          const isExpandedAfterClose = sidebar.classList.contains('w-64');
          
          console.log(`After closing - Collapsed: ${isCollapsedAfterClose}, Expanded: ${isExpandedAfterClose}`);
          
          if (isCollapsedAfterClose && !isExpandedAfterClose) {
            console.log('✅ Test 2 PASSED: Toggle button closes the sidebar correctly');
            return true;
          } else {
            console.log('❌ Test 2 FAILED: Toggle button did not close the sidebar correctly');
            return false;
          }
        }, 300);
      } else {
        console.log('❌ Test 2 FAILED: Could not find close button after opening');
        return false;
      }
    } else {
      console.log('❌ Test 2 FAILED: Toggle button did not open the sidebar correctly');
      return false;
    }
  }, 300);
}

// Test 3: Test click outside to close functionality
function testClickOutsideToClose() {
  console.log('🧪 Test 3: Testing click outside to close functionality...');
  
  // First, open the sidebar using the toggle button
  const toggleButton = document.querySelector('button[aria-label*="sidebar"]');
  if (!toggleButton) {
    console.log('❌ Test 3 FAILED: Could not find toggle button');
    return false;
  }
  
  toggleButton.click();
  
  // Wait for the sidebar to open
  setTimeout(() => {
    const sidebar = document.querySelector('aside');
    const isExpanded = sidebar.classList.contains('w-64');
    
    if (isExpanded) {
      console.log('✅ Sidebar opened successfully for click outside test');
      
      // Create a mock click event outside the sidebar
      const mainContent = document.querySelector('main');
      if (mainContent) {
        // Create and dispatch a click event on the main content area
        const clickEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        mainContent.dispatchEvent(clickEvent);
        
        // Wait for the sidebar to close
        setTimeout(() => {
          const isCollapsedAfterClick = sidebar.classList.contains('w-16');
          const isExpandedAfterClick = sidebar.classList.contains('w-64');
          
          console.log(`After clicking outside - Collapsed: ${isCollapsedAfterClick}, Expanded: ${isExpandedAfterClick}`);
          
          if (isCollapsedAfterClick && !isExpandedAfterClick) {
            console.log('✅ Test 3 PASSED: Click outside closes the sidebar correctly');
            return true;
          } else {
            console.log('❌ Test 3 FAILED: Click outside did not close the sidebar');
            return false;
          }
        }, 300);
      } else {
        console.log('❌ Test 3 FAILED: Could not find main content area');
        return false;
      }
    } else {
      console.log('❌ Test 3 FAILED: Sidebar did not open for click outside test');
      return false;
    }
  }, 300);
}

// Test 4: Test that clicking inside the sidebar does not close it
function testClickInsideDoesNotClose() {
  console.log('🧪 Test 4: Testing that clicking inside the sidebar does not close it...');
  
  // First, open the sidebar using the toggle button
  const toggleButton = document.querySelector('button[aria-label*="sidebar"]');
  if (!toggleButton) {
    console.log('❌ Test 4 FAILED: Could not find toggle button');
    return false;
  }
  
  toggleButton.click();
  
  // Wait for the sidebar to open
  setTimeout(() => {
    const sidebar = document.querySelector('aside');
    const isExpanded = sidebar.classList.contains('w-64');
    
    if (isExpanded) {
      console.log('✅ Sidebar opened successfully for click inside test');
      
      // Create a mock click event inside the sidebar
      const sidebarContent = sidebar.querySelector('nav');
      if (sidebarContent) {
        // Create and dispatch a click event on the sidebar content
        const clickEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        sidebarContent.dispatchEvent(clickEvent);
        
        // Wait a moment to check if the sidebar remains open
        setTimeout(() => {
          const isCollapsedAfterClick = sidebar.classList.contains('w-16');
          const isExpandedAfterClick = sidebar.classList.contains('w-64');
          
          console.log(`After clicking inside - Collapsed: ${isCollapsedAfterClick}, Expanded: ${isExpandedAfterClick}`);
          
          if (!isCollapsedAfterClick && isExpandedAfterClick) {
            console.log('✅ Test 4 PASSED: Clicking inside the sidebar does not close it');
            return true;
          } else {
            console.log('❌ Test 4 FAILED: Clicking inside the sidebar closed it');
            return false;
          }
        }, 300);
      } else {
        console.log('❌ Test 4 FAILED: Could not find sidebar content area');
        return false;
      }
    } else {
      console.log('❌ Test 4 FAILED: Sidebar did not open for click inside test');
      return false;
    }
  }, 300);
}

// Run all tests
function runAllTests() {
  console.log('🚀 Running all sidebar tests...');
  
  // Run tests in sequence with delays
  setTimeout(() => testInitialState(), 500);
  setTimeout(() => testToggleFunction(), 1500);
  setTimeout(() => testClickOutsideToClose(), 3000);
  setTimeout(() => testClickInsideDoesNotClose(), 5000);
  
  console.log('📋 Tests initiated. Check the console for results.');
}

// Run the tests
runAllTests();