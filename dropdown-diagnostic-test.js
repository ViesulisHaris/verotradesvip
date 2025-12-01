// Automated Dropdown Diagnostic Test
// This script will run in the browser console to test dropdown visibility issues

console.log('🔍 Starting Dropdown Diagnostic Test...');

// Wait for page to load
setTimeout(() => {
  // Test 1: Find all dropdown elements
  const dropdowns = document.querySelectorAll('.dropdown-enhanced');
  console.log('🔍 Test 1 - Dropdown Elements Found:', {
    count: dropdowns.length,
    elements: Array.from(dropdowns).map((el, index) => ({
      index,
      tagName: el.tagName,
      className: el.className,
      id: el.id,
      value: el.value
    }))
  });

  // Test 2: Check computed styles for each dropdown
  dropdowns.forEach((dropdown, index) => {
    const styles = window.getComputedStyle(dropdown);
    console.log(`🔍 Test 2 - Dropdown ${index} Container Styles:`, {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      backdropFilter: styles.backdropFilter,
      zIndex: styles.zIndex,
      position: styles.position,
      border: styles.border,
      borderRadius: styles.borderRadius,
      padding: styles.padding,
      fontSize: styles.fontSize
    });
  });

  // Test 3: Check option elements styling
  const allOptions = document.querySelectorAll('.dropdown-enhanced option');
  console.log('🔍 Test 3 - Option Elements Found:', {
    count: allOptions.length,
    elements: Array.from(allOptions).map((option, index) => {
      const styles = window.getComputedStyle(option);
      return {
        index,
        value: option.value,
        text: option.textContent,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        visibility: styles.visibility,
        display: styles.display,
        padding: styles.padding,
        fontSize: styles.fontSize,
        contrast: styles.backgroundColor === styles.color ? 'POOR' : 'GOOD'
      };
    })
  });

  // Test 4: Browser support for option styling
  const testOption = document.createElement('option');
  testOption.style.backgroundColor = 'red';
  testOption.style.color = 'blue';
  testOption.style.padding = '20px';
  testOption.textContent = 'Test Option';
  document.body.appendChild(testOption);
  
  const computedTest = window.getComputedStyle(testOption);
  const browserSupport = {
    originalBg: 'red',
    computedBg: computedTest.backgroundColor,
    originalColor: 'blue',
    computedColor: computedTest.color,
    originalPadding: '20px',
    computedPadding: computedTest.padding,
    bgApplied: computedTest.backgroundColor.includes('red') || computedTest.backgroundColor.includes('255, 0, 0'),
    colorApplied: computedTest.color.includes('blue') || computedTest.color.includes('0, 0, 255'),
    paddingApplied: computedTest.padding !== '0px'
  };
  
  console.log('🔍 Test 4 - Browser Option Styling Support:', browserSupport);
  document.body.removeChild(testOption);

  // Test 5: Simulate dropdown focus and check visibility
  if (dropdowns.length > 0) {
    const firstDropdown = dropdowns[0];
    firstDropdown.focus();
    
    setTimeout(() => {
      const options = firstDropdown.options;
      const optionData = Array.from(options).map((option, index) => {
        const styles = window.getComputedStyle(option);
        return {
          index,
          text: option.textContent,
          value: option.value,
          visible: styles.visibility !== 'hidden',
          displayed: styles.display !== 'none',
          bgColor: styles.backgroundColor,
          textColor: styles.color,
          contrast: styles.backgroundColor === styles.color ? 'POOR' : 'GOOD',
          hasCustomBg: styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent',
          hasCustomColor: styles.color !== 'rgba(0, 0, 0, 0)' && styles.color !== 'transparent'
        };
      });
      
      console.log('🔍 Test 5 - Dropdown Options Visibility Test:', optionData);
      
      // Test 6: Check if dropdown is actually functional
      const originalValue = firstDropdown.value;
      firstDropdown.value = options[1]?.value || '';
      const changed = firstDropdown.value !== originalValue;
      console.log('🔍 Test 6 - Dropdown Functionality Test:', {
        originalValue,
        newValue: firstDropdown.value,
        canChangeValue: changed,
        optionCount: options.length
      });
      
      // Test 7: Final diagnosis
      const diagnosis = {
        issueFound: false,
        probableCause: '',
        recommendedFix: ''
      };
      
      // Check for common issues
      const poorContrastOptions = optionData.filter(opt => opt.contrast === 'POOR');
      const invisibleOptions = optionData.filter(opt => !opt.visible || !opt.displayed);
      const noCustomStyling = !browserSupport.bgApplied && !browserSupport.colorApplied;
      
      if (poorContrastOptions.length > 0) {
        diagnosis.issueFound = true;
        diagnosis.probableCause = 'Poor color contrast (white text on white background)';
        diagnosis.recommendedFix = 'Implement custom dropdown component or use browser-compatible colors';
      }
      
      if (invisibleOptions.length > 0) {
        diagnosis.issueFound = true;
        diagnosis.probableCause += diagnosis.probableCause ? ' / ' : '';
        diagnosis.probableCause += 'Options are hidden or not displayed';
        diagnosis.recommendedFix = 'Check CSS display and visibility properties';
      }
      
      if (noCustomStyling) {
        diagnosis.issueFound = true;
        diagnosis.probableCause += diagnosis.probableCause ? ' / ' : '';
        diagnosis.probableCause += 'Browser does not support option element styling';
        diagnosis.recommendedFix = 'Replace native select with custom dropdown component';
      }
      
      if (!diagnosis.issueFound) {
        diagnosis.probableCause = 'No obvious styling issues detected';
        diagnosis.recommendedFix = 'Check for JavaScript conflicts or z-index issues';
      }
      
      console.log('🔍 Test 7 - Final Diagnosis:', diagnosis);
      console.log('🔍 Dropdown Diagnostic Test Complete!');
      
    }, 100);
  }
}, 1000);