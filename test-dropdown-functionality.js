// Test script to verify dropdown functionality and responsiveness
// Run this in the browser console on the log-trade page

console.log('🧪 Testing Dropdown Functionality');

// Test 1: Check if FEAR option is present in emotional state dropdown
function testFearOption() {
  console.log('🔍 Test 1: Checking for FEAR option in emotional state dropdown...');
  
  // Open emotional state dropdown
  const emotionButton = document.querySelector('button[onclick*="setIsEmotionOpen"]');
  if (emotionButton) {
    emotionButton.click();
    
    setTimeout(() => {
      const emotionOptions = document.querySelectorAll('[class*="overflow-y-auto"] button');
      const fearOption = Array.from(emotionOptions).find(btn => btn.textContent.trim() === 'FEAR');
      
      if (fearOption) {
        console.log('✅ FEAR option found in emotional state dropdown');
      } else {
        console.log('❌ FEAR option NOT found in emotional state dropdown');
      }
      
      // Close dropdown
      emotionButton.click();
    }, 100);
  } else {
    console.log('❌ Could not find emotional state dropdown button');
  }
}

// Test 2: Check scrollbar styling
function testScrollbarStyling() {
  console.log('🔍 Test 2: Checking scrollbar styling...');
  
  const emotionButton = document.querySelector('button[onclick*="setIsEmotionOpen"]');
  if (emotionButton) {
    emotionButton.click();
    
    setTimeout(() => {
      const dropdown = document.querySelector('[class*="overflow-y-auto"]');
      if (dropdown) {
        const computedStyle = window.getComputedStyle(dropdown);
        const scrollbarWidth = computedStyle.scrollbarWidth;
        
        // Check if scrollbar classes are applied
        const hasScrollbarClasses = dropdown.classList.contains('scrollbar-thin') && 
                                 dropdown.classList.contains('scrollbar-thumb-dusty-gold/20') &&
                                 dropdown.classList.contains('scrollbar-track-transparent');
        
        if (hasScrollbarClasses) {
          console.log('✅ Scrollbar styling classes applied correctly');
        } else {
          console.log('❌ Scrollbar styling classes NOT applied correctly');
          console.log('Classes found:', dropdown.className);
        }
        
        // Test scroll functionality if content overflows
        if (dropdown.scrollHeight > dropdown.clientHeight) {
          console.log('✅ Dropdown has scrollable content');
        } else {
          console.log('ℹ️ Dropdown content fits without scrolling');
        }
      }
      
      // Close dropdown
      emotionButton.click();
    }, 100);
  }
}

// Test 3: Responsive behavior at different screen sizes
function testResponsiveBehavior() {
  console.log('🔍 Test 3: Testing responsive behavior...');
  
  const originalWidth = window.innerWidth;
  const testSizes = [1200, 768, 480]; // Desktop, Tablet, Mobile
  
  testSizes.forEach(width => {
    console.log(`📱 Testing at ${width}px width...`);
    
    // Set viewport width (this is a simulation - in real testing use browser dev tools)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width
    });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    // Check if dropdown is still functional
    const emotionButton = document.querySelector('button[onclick*="setIsEmotionOpen"]');
    if (emotionButton) {
      emotionButton.click();
      
      setTimeout(() => {
        const dropdown = document.querySelector('[class*="overflow-y-auto"]');
        if (dropdown) {
          const dropdownRect = dropdown.getBoundingClientRect();
          
          // Check if dropdown is within viewport
          if (dropdownRect.left >= 0 && dropdownRect.right <= window.innerWidth) {
            console.log(`✅ Dropdown positioned correctly at ${width}px`);
          } else {
            console.log(`❌ Dropdown positioning issue at ${width}px`);
          }
        }
        
        // Close dropdown
        emotionButton.click();
      }, 100);
    }
  });
  
  // Restore original width
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: originalWidth
  });
  window.dispatchEvent(new Event('resize'));
}

// Test 4: Test dropdown functionality
function testDropdownFunctionality() {
  console.log('🔍 Test 4: Testing dropdown functionality...');
  
  const emotionButton = document.querySelector('button[onclick*="setIsEmotionOpen"]');
  if (emotionButton) {
    // Test opening dropdown
    emotionButton.click();
    
    setTimeout(() => {
      const dropdown = document.querySelector('[class*="overflow-y-auto"]');
      const isOpen = dropdown && dropdown.style.display !== 'none';
      
      if (isOpen) {
        console.log('✅ Emotional state dropdown opens correctly');
        
        // Test selecting an option
        const firstOption = dropdown.querySelector('button');
        if (firstOption) {
          const optionText = firstOption.textContent.trim();
          firstOption.click();
          
          setTimeout(() => {
            const selectedText = emotionButton.querySelector('span').textContent;
            if (selectedText === optionText) {
              console.log('✅ Option selection works correctly');
            } else {
              console.log('❌ Option selection not working');
            }
          }, 100);
        }
      } else {
        console.log('❌ Emotional state dropdown not opening');
      }
    }, 100);
  }
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting dropdown functionality tests...');
  
  setTimeout(testFearOption, 200);
  setTimeout(testScrollbarStyling, 400);
  setTimeout(testDropdownFunctionality, 600);
  setTimeout(testResponsiveBehavior, 800);
  
  setTimeout(() => {
    console.log('🏁 All dropdown tests completed');
  }, 1500);
}

// Auto-run tests
if (typeof window !== 'undefined') {
  runAllTests();
} else {
  console.log('❌ This script must be run in a browser environment');
}