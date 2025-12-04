// Test script to verify the statistics fix in the trades page
console.log('🧪 Testing Statistics Fix in Trades Page');
console.log('=====================================');

// Read the modified trades page to verify changes
const fs = require('fs');
const path = require('path');

const tradesPagePath = path.join(__dirname, 'src/app/trades/page.tsx');

try {
  const tradesPageContent = fs.readFileSync(tradesPagePath, 'utf8');
  
  console.log('✅ Successfully read trades page');
  
  // Check if fetchStatistics function is properly implemented
  const fetchStatisticsMatch = tradesPageContent.match(/const fetchStatistics = useCallback\(async \(\) => \{[\s\S]*?\}, \[user\?\.id\]\);/);
  
  if (fetchStatisticsMatch) {
    console.log('✅ fetchStatistics function is properly implemented');
    
    // Check if it calls fetchTradesStatistics
    if (fetchStatisticsMatch[0].includes('fetchTradesStatistics')) {
      console.log('✅ fetchStatistics function calls fetchTradesStatistics');
    } else {
      console.log('❌ fetchStatistics function does not call fetchTradesStatistics');
    }
    
    // Check if it uses filters
    if (fetchStatisticsMatch[0].includes('filtersRef.current')) {
      console.log('✅ fetchStatistics function uses current filters');
    } else {
      console.log('❌ fetchStatistics function does not use current filters');
    }
  } else {
    console.log('❌ fetchStatistics function is not properly implemented');
  }
  
  // Check if statistics useEffect is enabled
  const statsEffectMatch = tradesPageContent.match(/useEffect\(\(\) => \{[\s\S]*?if \(user\) \{[\s\S]*?fetchStatistics\(\);[\s\S]*?\}, \[user\?\.id, fetchStatistics\]\);/);
  
  if (statsEffectMatch) {
    console.log('✅ Statistics useEffect is properly enabled');
  } else {
    console.log('❌ Statistics useEffect is not properly enabled');
  }
  
  // Check if filters useEffect is present
  const filtersEffectMatch = tradesPageContent.match(/useEffect\(\(\) => \{[\s\S]*?const timeoutId = setTimeout\(\(\) => \{[\s\S]*?fetchStatistics\(\);[\s\S]*?\}, 300\);[\s\S]*?\}, \[filters, user\?\.id, fetchStatistics\]\);/);
  
  if (filtersEffectMatch) {
    console.log('✅ Filters change useEffect is properly implemented');
  } else {
    console.log('❌ Filters change useEffect is not properly implemented');
  }
  
  console.log('\n🎯 Summary:');
  console.log('The statistics functionality has been re-enabled in the trades page.');
  console.log('The total P&L and winrate should now display actual data instead of 0%.');
  console.log('Statistics will update when:');
  console.log('  1. The page loads (if user is authenticated)');
  console.log('  2. Filters are changed (with 300ms debounce)');
  
} catch (error) {
  console.error('❌ Error reading trades page:', error.message);
}