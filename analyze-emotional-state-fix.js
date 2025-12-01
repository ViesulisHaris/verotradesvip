// This script analyzes the code to verify the emotional state fix
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing emotional state fix implementation...');

// Read the confluence page implementation
const confluencePagePath = path.join(__dirname, 'src/app/confluence/page.tsx');
const confluencePageContent = fs.readFileSync(confluencePagePath, 'utf8');

// Read the dashboard page implementation
const dashboardPagePath = path.join(__dirname, 'src/app/dashboard/page.tsx');
const dashboardPageContent = fs.readFileSync(dashboardPagePath, 'utf8');

// Extract the emotional state processing logic from confluence page
const confluenceEmotionLogicMatch = confluencePageContent.match(/\/\/ Memoized emotional trend data for visualization[^}]+}/s);
const confluenceEmotionLogic = confluenceEmotionLogicMatch ? confluenceEmotionLogicMatch[0] : '';

// Extract the emotional state processing logic from dashboard page
const dashboardEmotionLogicMatch = dashboardPageContent.match(/function getEmotionData[^}]+}/s);
const dashboardEmotionLogic = dashboardEmotionLogicMatch ? dashboardEmotionLogicMatch[0] : '';

// Check if the fix is implemented
const hasActiveFiltersCheck = confluencePageContent.includes('const hasActiveFilters = !!(');
const dataSourceLogic = confluencePageContent.includes('let dataToProcess = hasActiveFilters ? filteredTrades : trades;');
const safeguardLogic = confluencePageContent.includes('if (!hasActiveFilters && filteredTrades.length !== trades.length)');
const debugLogging = confluencePageContent.includes('[CONFLUENCE EMOTION DEBUG]');

console.log('\n📊 Fix Implementation Analysis:');
console.log('=====================================');
console.log(`✅ hasActiveFilters check: ${hasActiveFiltersCheck ? 'IMPLEMENTED' : 'NOT FOUND'}`);
console.log(`✅ Data source logic: ${dataSourceLogic ? 'IMPLEMENTED' : 'NOT FOUND'}`);
console.log(`✅ Safeguard logic: ${safeguardLogic ? 'IMPLEMENTED' : 'NOT FOUND'}`);
console.log(`✅ Debug logging: ${debugLogging ? 'IMPLEMENTED' : 'NOT FOUND'}`);

// Compare the core emotion processing logic
console.log('\n🔍 Logic Comparison:');
console.log('=====================================');

// Extract key parts of the emotion processing functions
const confluenceEmotionProcessing = extractEmotionProcessingLogic(confluenceEmotionLogic);
const dashboardEmotionProcessing = extractEmotionProcessingLogic(dashboardEmotionLogic);

// Compare the logic
const logicComparison = compareEmotionLogic(confluenceEmotionProcessing, dashboardEmotionProcessing);
console.log(`Core logic consistency: ${logicComparison ? '✅ CONSISTENT' : '❌ INCONSISTENT'}`);

// Check for specific fix implementation
console.log('\n🔧 Fix Verification:');
console.log('=====================================');

// Check 1: hasActiveFilters implementation
const hasActiveFiltersImplementation = confluencePageContent.includes(`
  const hasActiveFilters = !!(
    filters.market ||
    filters.symbol ||
    filters.strategy ||
    filters.side ||
    filters.startDate ||
    filters.endDate ||
    (filters.emotionSearch && filters.emotionSearch.length > 0)
  );
`);

// Check 2: Data source selection logic
const dataSourceSelection = confluencePageContent.includes(`
  // Use appropriate data source based on whether filters are active
  let dataToProcess = hasActiveFilters ? filteredTrades : trades;
`);

// Check 3: Safeguard implementation
const safeguardImplementation = confluencePageContent.includes(`
  // Add safeguard to ensure consistency with dashboard when no filters are active
  if (!hasActiveFilters && filteredTrades.length !== trades.length) {
    console.warn('🔍 [EMOTION DEBUG] Data inconsistency detected - forcing use of trades for consistency with dashboard');
    dataToProcess = trades;
  }
`);

// Check 4: Debug logging
const debugLoggingImplementation = confluencePageContent.includes(`
  console.log('🔍 [CONFLUENCE EMOTION DEBUG] Has active filters:', hasActiveFilters);
  console.log('🔍 [CONFLUENCE EMOTION DEBUG] Using data source:', hasActiveFilters ? 'filteredTrades' : 'all trades');
  console.log('🔍 [CONFLUENCE EMOTION DEBUG] Total trades available:', trades.length);
  console.log('🔍 [CONFLUENCE EMOTION DEBUG] Filtered trades count:', filteredTrades.length);
`);

console.log(`hasActiveFilters implementation: ${hasActiveFiltersImplementation ? '✅ IMPLEMENTED' : '❌ MISSING'}`);
console.log(`Data source selection: ${dataSourceSelection ? '✅ IMPLEMENTED' : '❌ MISSING'}`);
console.log(`Safeguard implementation: ${safeguardImplementation ? '✅ IMPLEMENTED' : '❌ MISSING'}`);
console.log(`Debug logging: ${debugLoggingImplementation ? '✅ IMPLEMENTED' : '❌ MISSING'}`);

// Create a summary report
const analysisReport = {
  timestamp: new Date().toISOString(),
  fixImplementation: {
    hasActiveFiltersCheck: hasActiveFiltersImplementation,
    dataSourceLogic: dataSourceSelection,
    safeguardLogic: safeguardImplementation,
    debugLogging: debugLoggingImplementation
  },
  logicConsistency: logicComparison,
  overallAssessment: (
    hasActiveFiltersImplementation && 
    dataSourceSelection && 
    safeguardImplementation && 
    debugLoggingImplementation && 
    logicComparison
  ) ? '✅ FIX PROPERLY IMPLEMENTED' : '❌ FIX INCOMPLETE'
}
};

// Save the analysis report
const reportPath = path.join(__dirname, 'emotional-state-fix-analysis.json');
fs.writeFileSync(reportPath, JSON.stringify(analysisReport, null, 2));
console.log(`\n📄 Analysis report saved to: ${reportPath}`);

// Print the final assessment
console.log('\n🎯 Final Assessment:');
console.log('=====================================');
console.log(analysisReport.overallAssessment);

if (analysisReport.overallAssessment === '✅ FIX PROPERLY IMPLEMENTED') {
  console.log('\n✅ The emotional state analysis fix has been successfully implemented with:');
  console.log('  - Proper detection of active filters');
  console.log('  - Correct data source selection based on filter state');
  console.log('  - Safeguard to ensure consistency with dashboard when no filters are active');
  console.log('  - Debug logging to track data source usage');
  console.log('  - Consistent core emotion processing logic with dashboard');
} else {
  console.log('\n❌ The emotional state analysis fix is incomplete. Missing components:');
  if (!hasActiveFiltersImplementation) console.log('  - hasActiveFilters check implementation');
  if (!dataSourceSelection) console.log('  - Data source selection logic');
  if (!safeguardImplementation) console.log('  - Safeguard logic for consistency');
  if (!debugLoggingImplementation) console.log('  - Debug logging implementation');
  if (!logicComparison) console.log('  - Consistent core emotion processing logic');
}

function extractEmotionProcessingLogic(logicString) {
  // Extract key parts of the emotion processing logic
  const validEmotionsMatch = logicString.match(/const validEmotions = \[([^\]]+)\]/);
  const emotionDataProcessingMatch = logicString.match(/emotionData\[emotion\][^}]+}/);
  
  return {
    validEmotions: validEmotionsMatch ? validEmotionsMatch[1] : '',
    processing: emotionDataProcessingMatch ? emotionDataProcessingMatch[0] : ''
  };
}

function compareEmotionLogic(confluenceLogic, dashboardLogic) {
  // Compare the core logic components
  const confluenceValidEmotions = confluenceLogic.validEmotions.replace(/\s+/g, '');
  const dashboardValidEmotions = dashboardLogic.validEmotions.replace(/\s+/g, '');
  
  // Extract the key processing steps
  const confluenceProcessing = confluenceLogic.processing.replace(/\s+/g, '');
  const dashboardProcessing = dashboardLogic.processing.replace(/\s+/g, '');
  
  // Check if the core logic is the same
  return confluenceValidEmotions === dashboardValidEmotions && 
         confluenceProcessing.includes('buyCount') && 
         confluenceProcessing.includes('sellCount') &&
         dashboardProcessing.includes('buyCount') && 
         dashboardProcessing.includes('sellCount');
}