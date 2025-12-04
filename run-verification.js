// Simple script to run the comprehensive filter verification
// Copy and paste this into the browser console on the trades page

console.log('🚀 Starting Filter Verification...');

// First, load the comprehensive verification script
const script = document.createElement('script');
script.src = './comprehensive-filter-verification.js';
script.onload = function() {
  console.log('✅ Verification script loaded');
  
  // Check if we're on the trades page
  if (!window.location.pathname.includes('/trades')) {
    console.error('❌ Please navigate to the trades page first (/trades)');
    return;
  }
  
  // Wait a moment for the page to stabilize
  setTimeout(() => {
    console.log('🔍 Running comprehensive verification...');
    window.runComprehensiveVerification();
  }, 2000);
};

script.onerror = function() {
  console.error('❌ Failed to load verification script');
  
  // Fallback: run basic verification inline
  console.log('🔄 Running basic verification fallback...');
  
  const elements = {
    symbolInput: document.querySelector('input[placeholder="Search symbol..."]'),
    marketSelect: document.querySelector('select'),
    dateFromInput: document.querySelector('input[type="date"]:first-of-type'),
    dateToInput: document.querySelector('input[type="date"]:last-of-type'),
    clearButton: Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Clear')),
    statsBoxes: document.querySelectorAll('.metric-value')
  };
  
  console.log('📋 Found elements:', {
    symbol: !!elements.symbolInput,
    market: !!elements.marketSelect,
    dateFrom: !!elements.dateFromInput,
    dateTo: !!elements.dateToInput,
    clear: !!elements.clearButton,
    stats: elements.statsBoxes.length
  });
  
  if (!elements.symbolInput || !elements.marketSelect) {
    console.error('❌ Filter elements not found - make sure you\'re on the trades page');
    return;
  }
  
  // Basic symbol filter test
  console.log('🧪 Testing symbol filter...');
  const initialCount = document.querySelectorAll('.dashboard-card.overflow-hidden').length;
  
  elements.symbolInput.value = 'AAPL';
  elements.symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  setTimeout(() => {
    const filteredCount = document.querySelectorAll('.dashboard-card.overflow-hidden').length;
    console.log(`📊 Symbol filter test: ${initialCount} → ${filteredCount} trades`);
    
    // Basic market filter test
    console.log('🧪 Testing market filter...');
    elements.marketSelect.value = 'stock';
    elements.marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
    
    setTimeout(() => {
      const marketFilteredCount = document.querySelectorAll('.dashboard-card.overflow-hidden').length;
      console.log(`📊 Market filter test: ${filteredCount} → ${marketFilteredCount} trades`);
      
      // Check statistics
      console.log('📊 Statistics boxes:', elements.statsBoxes.length);
      elements.statsBoxes.forEach((box, index) => {
        console.log(`   Stat ${index + 1}: ${box.textContent.trim()}`);
      });
      
      console.log('✅ Basic verification complete');
    }, 500);
  }, 500);
};

document.head.appendChild(script);