/**
 * Sidebar Diagnostic Logging Script
 * Adds comprehensive logging to validate root causes of sidebar issues
 */

// Add diagnostic logging to the browser console
const diagnosticScript = `
(function() {
  console.group('🔍 SIDEBAR DIAGNOSTIC LOGS');
  
  // 1. CSS Classes and Styling Diagnostics
  console.group('📋 CSS Classes & Styling');
  
  const toggleButton = document.querySelector('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
  const sidebar = document.querySelector('.sidebar-overlay, aside');
  
  if (toggleButton) {
    const toggleStyles = window.getComputedStyle(toggleButton);
    const toggleRect = toggleButton.getBoundingClientRect();
    
    console.log('Toggle Button CSS Classes:', toggleButton.className);
    console.log('Toggle Button Computed Styles:', {
      zIndex: toggleStyles.zIndex,
      position: toggleStyles.position,
      display: toggleStyles.display,
      visibility: toggleStyles.visibility,
      opacity: toggleStyles.opacity,
      width: toggleStyles.width,
      height: toggleStyles.height,
      minWidth: toggleStyles.minWidth,
      maxWidth: toggleStyles.maxWidth,
      minHeight: toggleStyles.minHeight,
      maxHeight: toggleStyles.maxHeight
    });
    console.log('Toggle Button Bounding Rect:', {
      width: toggleRect.width,
      height: toggleRect.height,
      top: toggleRect.top,
      left: toggleRect.left,
      right: toggleRect.right,
      bottom: toggleRect.bottom
    });
  }
  
  if (sidebar) {
    const sidebarStyles = window.getComputedStyle(sidebar);
    
    console.log('Sidebar CSS Classes:', sidebar.className);
    console.log('Sidebar Computed Styles:', {
      zIndex: sidebarStyles.zIndex,
      position: sidebarStyles.position,
      transform: sidebarStyles.transform,
      backdropFilter: sidebarStyles.backdropFilter,
      background: sidebarStyles.background,
      boxShadow: sidebarStyles.boxShadow,
      border: sidebarStyles.border,
      width: sidebarStyles.width,
      height: sidebarStyles.height
    });
  }
  
  // 2. Active State Diagnostics
  console.group('🎯 Active State Diagnostics');
  
  const activeMenuItem = document.querySelector('.sidebar-menu-item.active, a.active, .active');
  if (activeMenuItem) {
    const activeStyles = window.getComputedStyle(activeMenuItem);
    console.log('Active Menu Item CSS Classes:', activeMenuItem.className);
    console.log('Active Menu Item Styles:', {
      backgroundColor: activeStyles.backgroundColor,
      backgroundImage: activeStyles.backgroundImage,
      border: activeStyles.border,
      boxShadow: activeStyles.boxShadow
    });
  } else {
    console.warn('No active menu item found');
  }
  
  // 3. Event Handler Diagnostics
  console.group('⚡ Event Handler Diagnostics');
  
  if (toggleButton) {
    // Check for event listeners
    const eventListeners = toggleButton.onclick ? 'onclick attached' : 'no onclick';
    const hasClickListener = toggleButton.hasAttribute('data-click-listener');
    
    console.log('Toggle Button Event Handlers:', {
      onclick: toggleButton.onclick !== null,
      onclickType: typeof toggleButton.onclick,
      eventListeners: eventListeners,
      hasClickListener: hasClickListener,
      attributes: Array.from(toggleButton.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      }))
    });
  }
  
  // 4. State Management Diagnostics
  console.group('🔄 State Management Diagnostics');
  
  // Check for React state indicators
  const reactRoot = document.querySelector('#__next');
  const sidebarComponents = document.querySelectorAll('[class*="sidebar"]');
  
  console.log('React Root:', !!reactRoot);
  console.log('Sidebar Components Found:', sidebarComponents.length);
  console.log('Sidebar Component Classes:', Array.from(sidebarComponents).map(el => el.className));
  
  // 5. Z-Index Conflict Analysis
  console.group('🏗️ Z-Index Conflict Analysis');
  
  const allElements = document.querySelectorAll('*');
  const zIndexMap = new Map();
  const conflicts = [];
  
  allElements.forEach(element => {
    const style = window.getComputedStyle(element);
    const zIndex = parseInt(style.zIndex);
    
    if (zIndex && zIndex > 10) {
      if (zIndexMap.has(zIndex)) {
        conflicts.push({
          zIndex,
          elements: [
            {
              tagName: zIndexMap.get(zIndex).tagName,
              className: zIndexMap.get(zIndex).className,
              id: zIndexMap.get(zIndex).id
            },
            {
              tagName: element.tagName,
              className: element.className,
              id: element.id
            }
          ]
        });
      } else {
        zIndexMap.set(zIndex, element);
      }
    }
  });
  
  console.log('High Z-Index Elements:', Array.from(zIndexMap.entries()).map(([zIndex, element]) => ({
    zIndex,
    tagName: element.tagName,
    className: element.className,
    id: element.id
  })));
  
  if (conflicts.length > 0) {
    console.warn('Z-Index Conflicts Found:', conflicts);
  } else {
    console.log('No Z-Index conflicts detected');
  }
  
  // 6. CSS Loading Diagnostics
  console.group('🎨 CSS Loading Diagnostics');
  
  // Check if Tailwind CSS is loaded
  const tailwindTest = document.createElement('div');
  tailwindTest.className = 'hidden';
  document.body.appendChild(tailwindTest);
  const tailwindLoaded = window.getComputedStyle(tailwindTest).display === 'none';
  document.body.removeChild(tailwindTest);
  
  console.log('Tailwind CSS Loaded:', tailwindLoaded);
  
  // Check for custom CSS files
  const styleSheets = Array.from(document.styleSheets);
  const customStyles = styleSheets.filter(sheet => 
    sheet.href && (sheet.href.includes('sidebar') || sheet.href.includes('globals'))
  );
  
  console.log('Custom Style Sheets:', customStyles.map(sheet => ({
    href: sheet.href,
    rules: sheet.cssRules?.length || 0
  })));
  
  // 7. Animation Diagnostics
  console.group('🎬 Animation Diagnostics');
  
  if (sidebar) {
    const animationStyles = window.getComputedStyle(sidebar);
    console.log('Sidebar Animation Styles:', {
      transition: animationStyles.transition,
      transitionDuration: animationStyles.transitionDuration,
      transitionTimingFunction: animationStyles.transitionTimingFunction,
      transform: animationStyles.transform
    });
  }
  
  // 8. Element Positioning Diagnostics
  console.group('📍 Element Positioning Diagnostics');
  
  if (toggleButton && sidebar) {
    const toggleRect = toggleButton.getBoundingClientRect();
    const sidebarRect = sidebar.getBoundingClientRect();
    
    // Check element overlap
    const elementsAtToggle = document.elementsFromPoint(
      toggleRect.left + toggleRect.width / 2,
      toggleRect.top + toggleRect.height / 2
    );
    
    console.log('Element Positioning:', {
      toggleButtonRect: {
        x: toggleRect.left,
        y: toggleRect.top,
        width: toggleRect.width,
        height: toggleRect.height
      },
      sidebarRect: {
        x: sidebarRect.left,
        y: sidebarRect.top,
        width: sidebarRect.width,
        height: sidebarRect.height
      },
      elementsAtToggle: elementsAtToggle.map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id
      })),
      isToggleTopmost: elementsAtToggle[0] === toggleButton || toggleButton.contains(elementsAtToggle[0])
    });
  }
  
  console.groupEnd();
  console.log('🏁 DIAGNOSTIC COMPLETE');
})();

// Inject the diagnostic script
console.log(diagnosticScript);
`;

// Save diagnostic script to a file for manual injection
const fs = require('fs');
fs.writeFileSync(__dirname + '/sidebar-diagnostic-script.js', diagnosticScript);

console.log('📄 Diagnostic script saved to: sidebar-diagnostic-script.js');
console.log('');
console.log('🔧 TO USE DIAGNOSTIC LOGS:');
console.log('1. Open browser developer tools');
console.log('2. Navigate to the dashboard');
console.log('3. Paste the diagnostic script into the console');
console.log('4. Review the output to identify root causes');
console.log('');
console.log('📋 Expected Issues to Look For:');
console.log('- Toggle button z-index should be 9999 (currently 50)');
console.log('- Toggle button size should be 40x40px (currently 42x1080px)');
console.log('- Sidebar z-index should be 9999 (currently 50)');
console.log('- Glass morphism effects should be applied');
console.log('- Active state styling should be present');
console.log('- Event handlers should be properly attached');