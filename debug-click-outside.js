// Debug script to test the "click outside to close" functionality
// This script should be run in the browser console to test the implementation

console.log('🔧 Starting debug click outside functionality test...');

// Test 1: Check if we can find the sidebar and toggle button
function testBasicElements() {
  console.log('🧪 Test 1: Checking basic elements...');
  
  const sidebar = document.querySelector('aside');
  const toggleButton = document.querySelector('button[aria-label*="sidebar"]');
  
  console.log('Sidebar found:', !!sidebar);
  console.log('Toggle button found:', !!toggleButton);
  
  if (sidebar) {
    console.log('Sidebar classes:', sidebar.className);
    console.log('Sidebar width:', sidebar.offsetWidth);
    console.log('Sidebar position:', sidebar.getBoundingClientRect());
  }
  
  if (toggleButton) {
    console.log('Toggle button classes:', toggleButton.className);
    console.log('Toggle button position:', toggleButton.getBoundingClientRect());
  }
  
  return sidebar && toggleButton;
}

// Test 2: Check current state
function testCurrentState() {
  console.log('🧪 Test 2: Checking current state...');
  
  const sidebar = document.querySelector('aside');
  if (sidebar) {
    const isCollapsed = sidebar.classList.contains('w-16');
    const isExpanded = sidebar.classList.contains('w-64');
    const isHidden = sidebar.classList.contains('translate-x-[-100%]');
    
    console.log('Current state - Collapsed:', isCollapsed, 'Expanded:', isExpanded, 'Hidden:', isHidden);
    
    return {
      isCollapsed,
      isExpanded,
      isHidden
    };
  }
  
  return null;
}

// Test 3: Test toggle functionality
function testToggle() {
  console.log('🧪 Test 3: Testing toggle functionality...');
  
  const toggleButton = document.querySelector('button[aria-label*="sidebar"]');
  if (!toggleButton) {
    console.log('❌ Toggle button not found');
    return false;
  }
  
  console.log('Clicking toggle button...');
  toggleButton.click();
  
  setTimeout(() => {
    const state = testCurrentState();
    console.log('State after toggle:', state);
  }, 500);
  
  return true;
}

// Test 4: Test click outside
function testClickOutside() {
  console.log('🧪 Test 4: Testing click outside...');
  
  // First open the sidebar
  const toggleButton = document.querySelector('button[aria-label*="sidebar"]');
  if (!toggleButton) {
    console.log('❌ Toggle button not found');
    return false;
  }
  
  toggleButton.click();
  
  setTimeout(() => {
    const sidebar = document.querySelector('aside');
    if (!sidebar) {
      console.log('❌ Sidebar not found');
      return;
    }
    
    const isExpanded = sidebar.classList.contains('w-64');
    console.log('Sidebar expanded:', isExpanded);
    
    if (isExpanded) {
      // Try clicking outside the sidebar
      const mainContent = document.querySelector('main');
      if (mainContent) {
        console.log('Clicking on main content area...');
        const clickEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        mainContent.dispatchEvent(clickEvent);
        
        setTimeout(() => {
          const state = testCurrentState();
          console.log('State after click outside:', state);
        }, 500);
      } else {
        console.log('❌ Main content area not found');
      }
    } else {
      console.log('❌ Sidebar did not expand after toggle');
    }
  }, 500);
  
  return true;
}

// Test 5: Check event listeners
function testEventListeners() {
  console.log('🧪 Test 5: Checking event listeners...');
  
  const sidebar = document.querySelector('aside');
  if (sidebar) {
    console.log('Sidebar element:', sidebar);
    console.log('Sidebar parent:', sidebar.parentElement);
    console.log('Sidebar ref in layout:', document.querySelector('[data-testid="sidebar-ref"]'));
  }
  
  // Check if click outside listener is attached
  console.log('Document mousedown listeners:', 
    getEventListeners ? getEventListeners(document).mousedown : 'Not available in this browser');
  
  return true;
}

// Run all tests
function runAllDebugTests() {
  console.log('🚀 Running all debug tests...');
  
  setTimeout(() => testBasicElements(), 100);
  setTimeout(() => testCurrentState(), 300);
  setTimeout(() => testToggle(), 500);
  setTimeout(() => testClickOutside(), 2000);
  setTimeout(() => testEventListeners(), 3500);
  
  console.log('📋 Debug tests initiated. Check the console for results.');
}

// Run the tests
runAllDebugTests();