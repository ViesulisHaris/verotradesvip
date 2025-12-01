// Test script to verify the emotional radar fix is working in the actual application
console.log('🧪 Testing Emotional Radar Fix Verification...\n');

// Test the memoized processEmotionData function directly
async function testMemoizedEmotionData() {
  try {
    // Import the memoized function
    const { memoizedTradeProcessing, memoCache } = await import('./src/lib/memoization.js');
    
    // Clear cache to ensure fresh calculation
    memoCache.clear();
    console.log('🧹 Cache cleared');
    
    // Test Case 1: Similar emotion distributions
    console.log('📊 Test Case 1: Similar Emotion Distributions');
    console.log('===============================================');
    
    const similarTrades = [
      { id: '1', emotional_state: ['FOMO'], side: 'Buy' },
      { id: '2', emotional_state: ['REVENGE'], side: 'Sell' },
      { id: '3', emotional_state: ['TILT'], side: 'Buy' },
      { id: '4', emotional_state: ['PATIENCE'], side: 'Sell' },
      { id: '5', emotional_state: ['CONFIDENT'], side: 'Buy' },
      { id: '6', emotional_state: ['FOMO'], side: 'Sell' },
      { id: '7', emotional_state: ['REVENGE'], side: 'Buy' },
      { id: '8', emotional_state: ['TILT'], side: 'Sell' },
      { id: '9', emotional_state: ['PATIENCE'], side: 'Buy' },
      { id: '10', emotional_state: ['CONFIDENT'], side: 'Sell' },
    ];
    
    const similarResult = memoizedTradeProcessing(similarTrades, 'emotion_data');
    
    console.log('📈 Similar Emotions Result:');
    const values1 = similarResult.map(item => item.value);
    const uniqueValues1 = [...new Set(values1)];
    const hasVariation1 = uniqueValues1.length > 1;
    
    console.log(`  Value range: ${Math.min(...values1).toFixed(1)} - ${Math.max(...values1).toFixed(1)}`);
    console.log(`  Unique values: ${uniqueValues1.length}`);
    console.log(`  Has variation: ${hasVariation1 ? 'YES ✅' : 'NO ❌'}`);
    
    similarResult.forEach(item => {
      console.log(`    ${item.subject}: ${item.value.toFixed(1)} (${item.leaning}, ${item.totalTrades} trades)`);
    });
    
    // Test Case 2: Varied emotion distributions
    console.log('\n📊 Test Case 2: Varied Emotion Distributions');
    console.log('==============================================');
    
    const variedTrades = [
      { id: '1', emotional_state: ['FOMO'], side: 'Buy' },
      { id: '2', emotional_state: ['FOMO'], side: 'Buy' },
      { id: '3', emotional_state: ['FOMO'], side: 'Buy' },
      { id: '4', emotional_state: ['REVENGE'], side: 'Sell' },
      { id: '5', emotional_state: ['TILT'], side: 'Buy' },
      { id: '6', emotional_state: ['PATIENCE'], side: 'Sell' },
      { id: '7', emotional_state: ['CONFIDENT'], side: 'Buy' },
      { id: '8', emotional_state: ['CONFIDENT'], side: 'Buy' },
      { id: '9', emotional_state: ['CONFIDENT'], side: 'Buy' },
    ];
    
    const variedResult = memoizedTradeProcessing(variedTrades, 'emotion_data');
    
    console.log('📈 Varied Emotions Result:');
    const values2 = variedResult.map(item => item.value);
    const uniqueValues2 = [...new Set(values2)];
    const hasVariation2 = uniqueValues2.length > 1;
    
    console.log(`  Value range: ${Math.min(...values2).toFixed(1)} - ${Math.max(...values2).toFixed(1)}`);
    console.log(`  Unique values: ${uniqueValues2.length}`);
    console.log(`  Has variation: ${hasVariation2 ? 'YES ✅' : 'NO ❌'}`);
    
    variedResult.forEach(item => {
      console.log(`    ${item.subject}: ${item.value.toFixed(1)} (${item.leaning}, ${item.totalTrades} trades)`);
    });
    
    // Summary
    console.log('\n🎯 Test Summary:');
    console.log('=================');
    console.log(`✅ Test 1 (Similar emotions): ${hasVariation1 ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`✅ Test 2 (Varied emotions): ${hasVariation2 ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    if (hasVariation1 && hasVariation2) {
      console.log('\n🎉 ALL TESTS PASSED! Emotional radar fix is working correctly.');
      console.log('📊 The radar now shows variation even with similar emotion distributions.');
      return true;
    } else {
      console.log('\n⚠️ Some tests failed. Please review the implementation.');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing memoized emotion data:', error);
    return false;
  }
}

// Run the test
testMemoizedEmotionData().then(success => {
  if (success) {
    console.log('\n🔧 Next steps:');
    console.log('1. Clear browser cache and localStorage');
    console.log('2. Refresh the dashboard page');
    console.log('3. The emotional radar should now show variation');
  } else {
    console.log('\n🔧 Fix needed:');
    console.log('1. Check the memoization.ts file');
    console.log('2. Verify the processEmotionData function has the enhanced logic');
    console.log('3. Clear cache and test again');
  }
});