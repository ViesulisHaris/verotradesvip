// This script adds debugging logs to track emotional state data flow
const fs = require('fs');
const path = require('path');

// Add debugging to dashboard page
const dashboardPagePath = path.join(__dirname, 'src/app/dashboard/page.tsx');
const dashboardContent = fs.readFileSync(dashboardPagePath, 'utf8');

// Add enhanced debugging to dashboard emotion processing
const enhancedDashboardContent = dashboardContent.replace(
  /const emotionData = useMemo\(\(\) => \{[\s\S]*?console\.log\('🔍 \[DASHBOARD EMOTION DEBUG\] Processing emotion data'\);[\s\S]*?console\.log\('🔍 \[DASHBOARD EMOTION DEBUG\] Total trades being processed:', trades\.length\);[\s\S]*?const result = getEmotionData\(trades\);[\s\S]*?console\.log\('🔍 \[DASHBOARD EMOTION DEBUG\] Emotion data result:', result\);[\s\S]*?return result;/,
  `const emotionData = useMemo(() => {
    console.log('🔍 [DASHBOARD EMOTION DEBUG] Processing emotion data');
    console.log('🔍 [DASHBOARD EMOTION DEBUG] Total trades being processed:', trades.length);
    console.log('🔍 [DASHBOARD EMOTION DEBUG] Trades sample:', trades.slice(0, 3).map(t => ({ id: t.id, emotional_state: t.emotional_state, side: t.side })));
    const result = getEmotionData(trades);
    console.log('🔍 [DASHBOARD EMOTION DEBUG] Emotion data result:', result);
    console.log('🔍 [DASHBOARD EMOTION DEBUG] Emotion data result JSON:', JSON.stringify(result, null, 2));
    return result;
  }, [trades]);`
);

// Add enhanced debugging to confluence page
const confluencePagePath = path.join(__dirname, 'src/app/confluence/page.tsx');
const confluenceContent = fs.readFileSync(confluencePagePath, 'utf8');

// Add enhanced debugging to confluence emotion processing
const enhancedConfluenceContent = confluenceContent
  // Enhanced debugging for hasActiveFilters
  .replace(
    /const hasActiveFilters = !!(\s*\n\s*filters\.market\s*\|\|\s*filters\.symbol\s*\|\|\s*filters\.strategy\s*\|\|\s*filters\.side\s*\|\|\s*filters\.startDate\s*\|\|\s*filters\.endDate\s*\|\|\s*\n\s*\(filters\.emotionSearch\s*&&\s*filters\.emotionSearch\.length\s*>\s*0\)\);/,
    `const hasActiveFilters = !!(
      filters.market ||
      filters.symbol ||
      filters.strategy ||
      filters.side ||
      filters.startDate ||
      filters.endDate ||
      (filters.emotionSearch && filters.emotionSearch.length > 0)
    );
    
    console.log('🔍 [CONFLUENCE FILTER DEBUG] hasActiveFilters calculation:', {
      filters: filters,
      hasActiveFilters: hasActiveFilters,
      individualChecks: {
        market: !!filters.market,
        symbol: !!filters.symbol,
        strategy: !!filters.strategy,
        side: !!filters.side,
        startDate: !!filters.startDate,
        endDate: !!filters.endDate,
        emotionSearch: !!(filters.emotionSearch && filters.emotionSearch.length > 0)
      }
    });`
  )
  // Enhanced debugging for emotionalTrendData data source
  .replace(
    /const emotionalTrendData = useMemo\(\(\) => \{[\s\S]*?console\.log\('🔍 \[CONFLUENCE EMOTION DEBUG\] Has active filters:', hasActiveFilters\);[\s\S]*?console\.log\('🔍 \[CONFLUENCE EMOTION DEBUG\] Using data source:', hasActiveFilters \? 'filteredTrades' : 'all trades'\);[\s\S]*?try \{[\s\S]*?const dataToProcess = hasActiveFilters \? filteredTrades : trades;/,
    `const emotionalTrendData = useMemo(() => {
    console.log('🔍 [CONFLUENCE EMOTION DEBUG] Has active filters:', hasActiveFilters);
    console.log('🔍 [CONFLUENCE EMOTION DEBUG] Using data source:', hasActiveFilters ? 'filteredTrades' : 'all trades');
    console.log('🔍 [CONFLUENCE EMOTION DEBUG] Total trades available:', trades.length);
    console.log('🔍 [CONFLUENCE EMOTION DEBUG] Filtered trades count:', filteredTrades.length);
    try {
      const dataToProcess = hasActiveFilters ? filteredTrades : trades;
      console.log('🔍 [CONFLUENCE EMOTION DEBUG] Data source chosen:', hasActiveFilters ? 'filteredTrades' : 'trades');
      console.log('🔍 [CONFLUENCE EMOTION DEBUG] Data to process count:', dataToProcess.length);
      console.log('🔍 [CONFLUENCE EMOTION DEBUG] Data to process sample:', dataToProcess.slice(0, 3).map(t => ({ id: t.id, emotional_state: t.emotional_state, side: t.side })));`
  )
  // Enhanced debugging for emotionalTrendData result
  .replace(
    /console\.log\('🔍 \[CONFLUENCE EMOTION DEBUG\] Processing emotion data'\);[\s\S]*?console\.log\('🔍 \[CONFLUENCE EMOTION DEBUG\] Number of trades being processed:', dataToProcess\.length\);[\s\S]*?[\s\S]*?return emotionEntries\.map\(\[^\]]+\)\.filter\(item => item && typeof item === 'object'\);/,
    `console.log('🔍 [CONFLUENCE EMOTION DEBUG] Processing emotion data');
      console.log('🔍 [CONFLUENCE EMOTION DEBUG] Number of trades being processed:', dataToProcess.length);
      
      const emotionEntries = Object.entries(emotionData);
      console.log('🔍 [CONFLUENCE EMOTION DEBUG] Raw emotion entries:', emotionEntries);
      
      const result = emotionEntries.map(([emotion, counts]) => {`
  )
  // Add final result logging
  .replace(
    /}\)\.filter\(item => item && typeof item === 'object'\);[\s\S]*?\}, \[filteredTrades, trades, hasActiveFilters, filters\]\);/,
    `}).filter(item => item && typeof item === 'object');
      
      console.log('🔍 [CONFLUENCE EMOTION DEBUG] Final emotion data result:', result);
      console.log('🔍 [CONFLUENCE EMOTION DEBUG] Final emotion data JSON:', JSON.stringify(result, null, 2));
    }, [filteredTrades, trades, hasActiveFilters, filters]);`
  );

// Write enhanced dashboard content
fs.writeFileSync(dashboardPagePath, enhancedDashboardContent);
console.log('✅ Enhanced dashboard page with debugging logs');

// Write enhanced confluence content
fs.writeFileSync(confluencePagePath, enhancedConfluenceContent);
console.log('✅ Enhanced confluence page with debugging logs');

console.log('\n🔧 Debugging enhancements added to both pages');
console.log('📝 Now you can manually test by:');
console.log('1. Start the development server');
console.log('2. Navigate to http://localhost:3000/dashboard');
console.log('3. Check console for DASHBOARD EMOTION DEBUG logs');
console.log('4. Navigate to http://localhost:3000/confluence');
console.log('5. Check console for CONFLUENCE EMOTION DEBUG logs');
console.log('6. Compare the emotion data output between both pages');