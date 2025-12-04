/**
 * TRADES TABLE INVISIBILITY DIAGNOSTIC TEST
 * 
 * This script diagnoses why trades table elements are in the DOM but invisible to users.
 * It checks for CSS styling issues that might be causing the invisibility.
 */

console.log('=== TRADES TABLE INVISIBILITY DIAGNOSIS ===');

// Wait for page to load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    runDiagnosis();
  }, 2000); // Give time for dynamic content to load
});

function runDiagnosis() {
  console.log('Starting trades table invisibility diagnosis...');
  
  // 1. Check if trades elements exist in DOM
  const tradesContainer = document.querySelector('.space-y-3.mt-4.min-h-\\[200px\\]');
  const tradeRows = document.querySelectorAll('.flashlight-container.rounded-lg.overflow-hidden.scroll-item');
  
  console.log('=== DOM EXISTENCE CHECK ===');
  console.log('Trades container found:', !!tradesContainer);
  console.log('Number of trade rows found:', tradeRows.length);
  
  if (tradeRows.length === 0) {
    console.warn('No trade rows found in DOM. This might be a data loading issue, not styling.');
    return;
  }
  
  // 2. Check visibility and display properties
  console.log('\n=== VISIBILITY & DISPLAY PROPERTIES ===');
  tradeRows.forEach((row, index) => {
    if (index < 3) { // Only check first 3 rows to avoid spam
      const styles = window.getComputedStyle(row);
      console.log(`Row ${index + 1}:`, {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
        position: styles.position,
        overflow: styles.overflow,
        height: styles.height,
        width: styles.width,
        maxHeight: styles.maxHeight,
        minHeight: styles.minHeight
      });
    }
  });
  
  // 3. Check for color contrast issues
  console.log('\n=== COLOR CONTRAST ANALYSIS ===');
  const textElements = document.querySelectorAll('.flashlight-container .text-white, .flashlight-container .text-gray-300, .flashlight-container .text-gray-400');
  
  textElements.forEach((element, index) => {
    if (index < 5) { // Only check first 5 text elements
      const styles = window.getComputedStyle(element);
      const backgroundColor = window.getComputedStyle(element.parentElement).backgroundColor;
      const color = styles.color;
      
      console.log(`Text element ${index + 1}:`, {
        color: color,
        backgroundColor: backgroundColor,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily
      });
    }
  });
  
  // 4. Check CSS custom properties
  console.log('\n=== CSS CUSTOM PROPERTIES ===');
  const rootStyles = getComputedStyle(document.documentElement);
  const customProps = [
    '--background',
    '--surface',
    '--surfaceHighlight',
    '--gold',
    '--verotrade-text-primary',
    '--verotrade-text-secondary',
    '--profit',
    '--loss'
  ];
  
  customProps.forEach(prop => {
    console.log(`${prop}:`, rootStyles.getPropertyValue(prop));
  });
  
  // 5. Check for z-index stacking issues
  console.log('\n=== Z-INDEX STACKING CONTEXT ===');
  const parentContainer = document.querySelector('.scroll-item');
  if (parentContainer) {
    const parentStyles = window.getComputedStyle(parentContainer);
    console.log('Parent container z-index:', parentStyles.zIndex);
    console.log('Parent container position:', parentStyles.position);
  }
  
  // 6. Check for animation issues
  console.log('\n=== ANIMATION STATE ===');
  tradeRows.forEach((row, index) => {
    if (index < 3) {
      const hasScrollItemClass = row.classList.contains('scroll-item');
      const hasVisibleClass = row.classList.contains('visible');
      const styles = window.getComputedStyle(row);
      
      console.log(`Row ${index + 1} animation:`, {
        hasScrollItemClass,
        hasVisibleClass,
        animationName: styles.animationName,
        animationPlayState: styles.animationPlayState,
        transform: styles.transform,
        filter: styles.filter
      });
    }
  });
  
  // 7. Check for flashlight effect interference
  console.log('\n=== FLASHLIGHT EFFECT CHECK ===');
  const flashlightBgs = document.querySelectorAll('.flashlight-bg');
  const flashlightBorders = document.querySelectorAll('.flashlight-border');
  
  console.log('Flashlight backgrounds found:', flashlightBgs.length);
  console.log('Flashlight borders found:', flashlightBorders.length);
  
  if (flashlightBgs.length > 0) {
    const bgStyles = window.getComputedStyle(flashlightBgs[0]);
    console.log('Flashlight bg styles:', {
      position: bgStyles.position,
      inset: bgStyles.inset,
      opacity: bgStyles.opacity,
      zIndex: bgStyles.zIndex,
      background: bgStyles.background
    });
  }
  
  // 8. Check for accordion content issues
  console.log('\n=== ACCORDION CONTENT CHECK ===');
  const accordionContents = document.querySelectorAll('.accordion-content');
  
  accordionContents.forEach((content, index) => {
    if (index < 3) {
      const styles = window.getComputedStyle(content);
      console.log(`Accordion ${index + 1}:`, {
        maxHeight: styles.maxHeight,
        overflow: styles.overflow,
        opacity: styles.opacity,
        display: styles.display,
        height: styles.height
      });
    }
  });
  
  // 9. Test potential fixes
  console.log('\n=== TESTING POTENTIAL FIXES ===');
  
  // Test 1: Force visibility
  if (tradeRows.length > 0) {
    const testRow = tradeRows[0];
    console.log('Testing force visibility on first row...');
    
    // Save original styles
    const originalStyles = {
      opacity: testRow.style.opacity,
      visibility: testRow.style.visibility,
      display: testRow.style.display,
      zIndex: testRow.style.zIndex
    };
    
    // Apply test styles
    testRow.style.opacity = '1';
    testRow.style.visibility = 'visible';
    testRow.style.display = 'block';
    testRow.style.zIndex = '999';
    
    setTimeout(() => {
      const isVisibleNow = isElementVisible(testRow);
      console.log('Row visibility after forced styles:', isVisibleNow);
      
      // Restore original styles
      Object.assign(testRow.style, originalStyles);
    }, 1000);
  }
  
  // 10. Generate diagnosis report
  console.log('\n=== DIAGNOSIS SUMMARY ===');
  
  const issues = [];
  const recommendations = [];
  
  // Check for common issues
  if (tradeRows.length > 0) {
    const firstRow = tradeRows[0];
    const styles = window.getComputedStyle(firstRow);
    
    if (styles.opacity === '0') {
      issues.push('Elements have opacity: 0');
      recommendations.push('Check for opacity animations or CSS rules setting opacity to 0');
    }
    
    if (styles.visibility === 'hidden') {
      issues.push('Elements have visibility: hidden');
      recommendations.push('Check for CSS rules setting visibility to hidden');
    }
    
    if (styles.display === 'none') {
      issues.push('Elements have display: none');
      recommendations.push('Check for CSS rules setting display to none');
    }
    
    if (parseInt(styles.zIndex) < 0) {
      issues.push('Elements have negative z-index');
      recommendations.push('Check z-index stacking context');
    }
    
    // Check for animation issues
    if (!firstRow.classList.contains('visible') && firstRow.classList.contains('scroll-item')) {
      issues.push('Scroll items don\'t have "visible" class');
      recommendations.push('Ensure scroll-item elements get the "visible" class after animation');
    }
    
    // Check for flashlight effect issues
    const flashlightBg = firstRow.querySelector('.flashlight-bg');
    if (flashlightBg) {
      const bgStyles = window.getComputedStyle(flashlightBg);
      if (bgStyles.position === 'absolute' && parseInt(bgStyles.zIndex) > 10) {
        issues.push('Flashlight effect might be covering content');
        recommendations.push('Check z-index of flashlight effect elements');
      }
    }
  }
  
  console.log('Issues identified:', issues);
  console.log('Recommendations:', recommendations);
  
  // Final assessment
  console.log('\n=== FINAL ASSESSMENT ===');
  if (issues.length === 0) {
    console.log('No obvious styling issues detected. The problem might be:');
    console.log('1. Animation timing - elements might be hidden during animation');
    console.log('2. Dynamic content loading - elements might not have content yet');
    console.log('3. JavaScript errors preventing proper initialization');
  } else {
    console.log('Primary issues detected:', issues.join(', '));
  }
}

function isElementVisible(element) {
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    styles.opacity !== '0' &&
    styles.visibility !== 'hidden' &&
    styles.display !== 'none'
  );
}

// Export for manual testing
window.diagnoseTradesInvisibility = runDiagnosis;
console.log('Diagnostic function loaded. Run diagnoseTradesInvisibility() in console to start diagnosis.');