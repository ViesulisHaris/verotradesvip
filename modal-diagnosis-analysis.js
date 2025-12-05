/**
 * Modal Functionality Diagnosis Analysis
 * 
 * This script analyzes the current modal implementation and identifies potential issues
 * based on code analysis and common modal functionality problems.
 * 
 * Run this in the browser console on the /trades page
 */

(function() {
  'use strict';
  
  console.log('🔍 Starting Modal Functionality Diagnosis Analysis...');
  console.log('=====================================');
  
  const diagnosis = {
    pageLoad: { status: 'unknown', issues: [], recommendations: [] },
    modalComponents: { status: 'unknown', issues: [], recommendations: [] },
    dataFlow: { status: 'unknown', issues: [], recommendations: [] },
    responsiveDesign: { status: 'unknown', issues: [], recommendations: [] },
    emotionalState: { status: 'unknown', issues: [], recommendations: [] },
    errorHandling: { status: 'unknown', issues: [], recommendations: [] }
  };
  
  // 1. Page Loading Analysis
  console.log('\n📄 1. PAGE LOADING ANALYSIS');
  console.log('---------------------------');
  
  try {
    // Check if we're on trades page
    const isTradesPage = window.location.pathname.includes('/trades');
    if (!isTradesPage) {
      diagnosis.pageLoad.issues.push('Not on trades page');
      diagnosis.pageLoad.recommendations.push('Navigate to /trades page first');
      console.log('❌ Not on trades page');
    } else {
      console.log('✅ On trades page');
    }
    
    // Check for essential page elements
    const requiredElements = {
      'Trade cards': '.scroll-item, [class*="TorchCard"]',
      'Page title': 'h1',
      'Stats grid': '.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4',
      'Filter bar': '[class*="FilterBar"], [class*="filter"]',
      'Sort controls': '[class*="SortControls"], [class*="sort"]'
    };
    
    let elementsFound = 0;
    let totalElements = Object.keys(requiredElements).length;
    
    for (const [name, selector] of Object.entries(requiredElements)) {
      const element = document.querySelector(selector);
      if (element) {
        elementsFound++;
        console.log(`✅ Found ${name}`);
      } else {
        diagnosis.pageLoad.issues.push(`Missing ${name}`);
        console.log(`❌ Missing ${name} (${selector})`);
      }
    }
    
    if (elementsFound === totalElements) {
      diagnosis.pageLoad.status = 'pass';
      console.log('✅ All required page elements found');
    } else {
      diagnosis.pageLoad.status = 'fail';
      diagnosis.pageLoad.recommendations.push('Check page component imports and rendering');
    }
    
    // Check for trade data
    const tradeCards = document.querySelectorAll('[class*="TorchCard"], .scroll-item');
    if (tradeCards.length === 0) {
      diagnosis.pageLoad.issues.push('No trade cards found');
      diagnosis.pageLoad.recommendations.push('Check authentication and data fetching');
      console.log('⚠️ No trade cards found - may be expected if no trades exist');
    } else {
      console.log(`✅ Found ${tradeCards.length} trade cards`);
    }
    
  } catch (error) {
    diagnosis.pageLoad.status = 'error';
    diagnosis.pageLoad.issues.push(`Analysis error: ${error.message}`);
    console.log(`❌ Page loading analysis error: ${error.message}`);
  }
  
  // 2. Modal Components Analysis
  console.log('\n🪟 2. MODAL COMPONENTS ANALYSIS');
  console.log('------------------------------');
  
  try {
    // Check for modal buttons in trade cards
    const tradeCards = document.querySelectorAll('[class*="TorchCard"], .scroll-item');
    let cardsWithEditButtons = 0;
    let cardsWithDeleteButtons = 0;
    
    tradeCards.forEach((card, index) => {
      const editButton = card.querySelector('button[onClick*="handleEditTrade"], button:has([class*="Edit"])');
      const deleteButton = card.querySelector('button[onClick*="handleDeleteTrade"], button:has([class*="Trash"])');
      
      if (editButton) cardsWithEditButtons++;
      if (deleteButton) cardsWithDeleteButtons++;
      
      if (index === 0 && (!editButton || !deleteButton)) {
        diagnosis.modalComponents.issues.push('First trade card missing edit/delete buttons');
        console.log('❌ First trade card missing modal buttons');
      }
    });
    
    console.log(`✅ Edit buttons: ${cardsWithEditButtons}/${tradeCards.length}`);
    console.log(`✅ Delete buttons: ${cardsWithDeleteButtons}/${tradeCards.length}`);
    
    // Check for modal components in DOM (they might be dynamically created)
    const modalSelectors = [
      '[role="dialog"]',
      '.modal-backdrop',
      '[class*="Modal"]',
      '[aria-modal="true"]'
    ];
    
    let modalsFound = 0;
    modalSelectors.forEach(selector => {
      const modals = document.querySelectorAll(selector);
      if (modals.length > 0) {
        modalsFound += modals.length;
        console.log(`✅ Found ${modals.length} modal(s) with selector: ${selector}`);
      }
    });
    
    if (modalsFound === 0) {
      console.log('ℹ️ No modals currently visible (expected - they appear on demand)');
    }
    
    // Check for modal component scripts
    const scripts = Array.from(document.querySelectorAll('script'));
    const hasModalComponents = scripts.some(script => 
      script.textContent && (
        script.textContent.includes('EditTradeModal') ||
        script.textContent.includes('DeleteTradeModal') ||
        script.textContent.includes('Modal')
      )
    );
    
    if (hasModalComponents) {
      console.log('✅ Modal component scripts found');
      diagnosis.modalComponents.status = 'pass';
    } else {
      diagnosis.modalComponents.issues.push('Modal component scripts not found');
      diagnosis.modalComponents.recommendations.push('Check modal component imports');
      console.log('❌ Modal component scripts not found');
    }
    
  } catch (error) {
    diagnosis.modalComponents.status = 'error';
    diagnosis.modalComponents.issues.push(`Analysis error: ${error.message}`);
    console.log(`❌ Modal components analysis error: ${error.message}`);
  }
  
  // 3. Data Flow Analysis
  console.log('\n📊 3. DATA FLOW ANALYSIS');
  console.log('------------------------');
  
  try {
    // Check for trade data structure
    const firstTradeCard = document.querySelector('[class*="TorchCard"], .scroll-item');
    if (firstTradeCard) {
      // Look for data attributes or React props
      const dataAttributes = firstTradeCard.attributes;
      let tradeDataFound = false;
      
      for (let i = 0; i < dataAttributes.length; i++) {
        const attr = dataAttributes[i];
        if (attr.name.includes('data-') || attr.name.includes('trade')) {
          tradeDataFound = true;
          console.log(`✅ Found data attribute: ${attr.name}=${attr.value}`);
        }
      }
      
      if (!tradeDataFound) {
        console.log('ℹ️ No obvious data attributes found (React handles this internally)');
      }
      
      // Check for trade display elements
      const tradeElements = {
        'Symbol': firstTradeCard.querySelector('[class*="symbol"], [class*="Symbol"]'),
        'Price': firstTradeCard.querySelector('[class*="price"], [class*="Price"]'),
        'P&L': firstTradeCard.querySelector('[class*="pnl"], [class*="PnL"]'),
        'Date': firstTradeCard.querySelector('[class*="date"], [class*="Date"]'),
        'Quantity': firstTradeCard.querySelector('[class*="quantity"], [class*="Quantity"]')
      };
      
      let tradeElementsFound = 0;
      for (const [name, element] of Object.entries(tradeElements)) {
        if (element) {
          tradeElementsFound++;
          console.log(`✅ Found ${name} element`);
        } else {
          console.log(`❌ Missing ${name} element`);
        }
      }
      
      if (tradeElementsFound >= 3) {
        diagnosis.dataFlow.status = 'pass';
        console.log('✅ Trade data structure looks adequate');
      } else {
        diagnosis.dataFlow.issues.push('Insufficient trade data elements');
        diagnosis.dataFlow.recommendations.push('Check trade data rendering');
      }
    }
    
    // Check for emotional state handling
    const emotionElements = document.querySelectorAll('[class*="emotion"], [class*="Emotion"]');
    if (emotionElements.length > 0) {
      console.log(`✅ Found ${emotionElements.length} emotion-related elements`);
    } else {
      console.log('ℹ️ No emotion elements found in current view');
    }
    
  } catch (error) {
    diagnosis.dataFlow.status = 'error';
    diagnosis.dataFlow.issues.push(`Analysis error: ${error.message}`);
    console.log(`❌ Data flow analysis error: ${error.message}`);
  }
  
  // 4. Responsive Design Analysis
  console.log('\n📱 4. RESPONSIVE DESIGN ANALYSIS');
  console.log('--------------------------------');
  
  try {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    console.log(`📏 Current viewport: ${viewport.width}x${viewport.height}`);
    
    // Check for responsive CSS classes
    const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"], [class*="xl:"]');
    console.log(`✅ Found ${responsiveElements.length} elements with responsive classes`);
    
    // Check for responsive grid layouts
    const gridElements = document.querySelectorAll('[class*="grid-cols"]');
    console.log(`✅ Found ${gridElements.length} elements with responsive grid classes`);
    
    // Check viewport-specific recommendations
    if (viewport.width <= 768) {
      console.log('📱 Mobile viewport detected');
      diagnosis.responsiveDesign.recommendations.push('Test modal behavior on mobile devices');
    } else if (viewport.width <= 1024) {
      console.log('📱 Tablet viewport detected');
      diagnosis.responsiveDesign.recommendations.push('Test modal behavior on tablet devices');
    } else {
      console.log('🖥️ Desktop viewport detected');
    }
    
    // Check for modal-specific responsive styles
    const modalResponsiveStyles = [
      'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl',
      'sm:max-w', 'md:max-w', 'lg:max-w', 'xl:max-w'
    ];
    
    let hasModalResponsiveStyles = false;
    modalResponsiveStyles.forEach(style => {
      if (document.body.innerHTML.includes(style)) {
        hasModalResponsiveStyles = true;
      }
    });
    
    if (hasModalResponsiveStyles) {
      console.log('✅ Modal responsive styles found');
      diagnosis.responsiveDesign.status = 'pass';
    } else {
      console.log('⚠️ Modal responsive styles not obvious in current DOM');
      diagnosis.responsiveDesign.issues.push('Modal responsive styles may be missing');
      diagnosis.responsiveDesign.recommendations.push('Verify modal responsive CSS classes');
    }
    
  } catch (error) {
    diagnosis.responsiveDesign.status = 'error';
    diagnosis.responsiveDesign.issues.push(`Analysis error: ${error.message}`);
    console.log(`❌ Responsive design analysis error: ${error.message}`);
  }
  
  // 5. Emotional State Analysis
  console.log('\n😊 5. EMOTIONAL STATE ANALYSIS');
  console.log('-----------------------------');
  
  try {
    // Check for emotional state constants
    const scripts = Array.from(document.querySelectorAll('script'));
    const hasEmotionConstants = scripts.some(script => 
      script.textContent && (
        script.textContent.includes('ALL_EMOTIONS') ||
        script.textContent.includes('FOMO') ||
        script.textContent.includes('PATIENCE') ||
        script.textContent.includes('CONFIDENT')
      )
    );
    
    if (hasEmotionConstants) {
      console.log('✅ Emotional state constants found');
    } else {
      console.log('ℹ️ Emotional state constants not found in scripts');
    }
    
    // Check for emotional state input components
    const emotionInputs = document.querySelectorAll('[class*="EmotionalStateInput"], [class*="emotion"]');
    console.log(`✅ Found ${emotionInputs.length} emotional state input components`);
    
    // Check for emotion buttons
    const emotionButtons = document.querySelectorAll('button[class*="emotion"], button:has([class*="emotion"])');
    console.log(`✅ Found ${emotionButtons.length} emotion buttons`);
    
    // Check for emotion conversion logic
    const hasEmotionConversion = scripts.some(script => 
      script.textContent && (
        script.textContent.includes('emotional_state') &&
        (script.textContent.includes('split') || script.textContent.includes('join'))
      )
    );
    
    if (hasEmotionConversion) {
      console.log('✅ Emotional state conversion logic found');
      diagnosis.emotionalState.status = 'pass';
    } else {
      console.log('⚠️ Emotional state conversion logic not obvious');
      diagnosis.emotionalState.issues.push('Emotional state conversion may be missing');
      diagnosis.emotionalState.recommendations.push('Check string/array conversion logic');
    }
    
  } catch (error) {
    diagnosis.emotionalState.status = 'error';
    diagnosis.emotionalState.issues.push(`Analysis error: ${error.message}`);
    console.log(`❌ Emotional state analysis error: ${error.message}`);
  }
  
  // 6. Error Handling Analysis
  console.log('\n⚠️ 6. ERROR HANDLING ANALYSIS');
  console.log('---------------------------');
  
  try {
    // Check for error boundary components
    const scripts = Array.from(document.querySelectorAll('script'));
    const hasErrorBoundaries = scripts.some(script => 
      script.textContent && (
        script.textContent.includes('ErrorBoundary') ||
        script.textContent.includes('catch') ||
        script.textContent.includes('try')
      )
    );
    
    if (hasErrorBoundaries) {
      console.log('✅ Error handling patterns found');
    } else {
      console.log('⚠️ Error handling patterns not obvious');
    }
    
    // Check for validation logic
    const hasValidation = scripts.some(script => 
      script.textContent && (
        script.textContent.includes('validate') ||
        script.textContent.includes('required') ||
        script.textContent.includes('error')
      )
    );
    
    if (hasValidation) {
      console.log('✅ Form validation logic found');
    } else {
      console.log('⚠️ Form validation logic not obvious');
      diagnosis.errorHandling.issues.push('Form validation may be missing');
      diagnosis.errorHandling.recommendations.push('Check form validation implementation');
    }
    
    // Check for loading states
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"], [disabled]');
    console.log(`✅ Found ${loadingElements.length} loading state elements`);
    
    // Check for error display elements
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], [class*="text-red"]');
    console.log(`✅ Found ${errorElements.length} error display elements`);
    
    if (errorElements.length > 0 || loadingElements.length > 0) {
      diagnosis.errorHandling.status = 'pass';
    } else {
      diagnosis.errorHandling.issues.push('Error and loading state elements may be missing');
    }
    
  } catch (error) {
    diagnosis.errorHandling.status = 'error';
    diagnosis.errorHandling.issues.push(`Analysis error: ${error.message}`);
    console.log(`❌ Error handling analysis error: ${error.message}`);
  }
  
  // Generate Comprehensive Report
  console.log('\n📋 COMPREHENSIVE DIAGNOSIS REPORT');
  console.log('==================================');
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalErrors = 0;
  
  for (const [category, results] of Object.entries(diagnosis)) {
    const status = results.status;
    const issues = results.issues;
    const recommendations = results.recommendations;
    
    if (status === 'pass') {
      totalPassed++;
      console.log(`✅ ${category.toUpperCase()}: PASSED`);
    } else if (status === 'fail') {
      totalFailed++;
      console.log(`❌ ${category.toUpperCase()}: FAILED`);
    } else if (status === 'error') {
      totalErrors++;
      console.log(`🔥 ${category.toUpperCase()}: ERROR`);
    } else {
      console.log(`ℹ️ ${category.toUpperCase()}: UNKNOWN`);
    }
    
    // Show issues
    if (issues.length > 0) {
      console.log(`   Issues: ${issues.length}`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    // Show recommendations
    if (recommendations.length > 0) {
      console.log(`   Recommendations: ${recommendations.length}`);
      recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
  }
  
  const overallStatus = totalPassed > totalFailed ? 'PASS' : 'FAIL';
  const totalCategories = totalPassed + totalFailed + totalErrors;
  const passRate = ((totalPassed / totalCategories) * 100).toFixed(1);
  
  console.log('\n==================================');
  console.log(`🎯 OVERALL STATUS: ${overallStatus}`);
  console.log(`📊 Pass Rate: ${passRate}% (${totalPassed}/${totalCategories})`);
  console.log('==================================');
  
  // Specific Modal Functionality Recommendations
  console.log('\n🔧 SPECIFIC MODAL RECOMMENDATIONS');
  console.log('==================================');
  
  if (diagnosis.modalComponents.issues.length > 0) {
    console.log('\n🪟 MODAL COMPONENTS:');
    console.log('1. Ensure EditTradeModal and DeleteTradeModal are properly imported');
    console.log('2. Check that modal buttons have correct onClick handlers');
    console.log('3. Verify modal components are rendered conditionally');
  }
  
  if (diagnosis.dataFlow.issues.length > 0) {
    console.log('\n📊 DATA FLOW:');
    console.log('1. Check trade data structure and format');
    console.log('2. Verify emotional state conversion (string ↔ array)');
    console.log('3. Ensure form fields are properly bound to trade data');
  }
  
  if (diagnosis.responsiveDesign.issues.length > 0) {
    console.log('\n📱 RESPONSIVE DESIGN:');
    console.log('1. Check modal responsive CSS classes');
    console.log('2. Test modals on different viewport sizes');
    console.log('3. Ensure modal sizing adapts to screen size');
  }
  
  if (diagnosis.emotionalState.issues.length > 0) {
    console.log('\n😊 EMOTIONAL STATE:');
    console.log('1. Verify ALL_EMOTIONS constant is defined');
    console.log('2. Check EmotionalStateInput component integration');
    console.log('3. Test emotion selection/deselection functionality');
  }
  
  if (diagnosis.errorHandling.issues.length > 0) {
    console.log('\n⚠️ ERROR HANDLING:');
    console.log('1. Implement proper form validation');
    console.log('2. Add loading state indicators');
    console.log('3. Ensure error messages are displayed to users');
  }
  
  // Test Execution Instructions
  console.log('\n🚀 NEXT STEPS');
  console.log('===============');
  console.log('1. Fix any identified issues');
  console.log('2. Run the comprehensive test script: modal-functionality-comprehensive-test.js');
  console.log('3. Use the visual test runner: modal-test-runner.html');
  console.log('4. Test modal functionality manually on different devices');
  
  // Return diagnosis for programmatic access
  return {
    diagnosis,
    summary: {
      totalPassed,
      totalFailed,
      totalErrors,
      overallStatus,
      passRate
    }
  };
})();