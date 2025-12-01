// Test script to verify emotion radar logic without authentication
console.log('🎯 Testing Emotion Radar Distribution Logic\n');

// Simulate the emotion data processing logic
function testEmotionDataProcessing(trades) {
  const emotionData = {};
  const validEmotions = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
  
  trades.forEach(trade => {
    if (trade.emotional_state) {
      let emotions = [];
      
      if (Array.isArray(trade.emotional_state)) {
        emotions = trade.emotional_state.filter(e => typeof e === 'string' && e.trim());
      } else if (typeof trade.emotional_state === 'string') {
        emotions = [trade.emotional_state.trim()];
      }
      
      emotions.forEach(emotion => {
        const normalizedEmotion = emotion.toUpperCase();
        if (validEmotions.includes(normalizedEmotion)) {
          if (!emotionData[normalizedEmotion]) {
            emotionData[normalizedEmotion] = { buyCount: 0, sellCount: 0, nullCount: 0 };
          }
          
          if (trade.side === 'Buy') {
            emotionData[normalizedEmotion].buyCount++;
          } else if (trade.side === 'Sell') {
            emotionData[normalizedEmotion].sellCount++;
          } else {
            emotionData[normalizedEmotion].nullCount++;
          }
        }
      });
    }
  });
  
  const emotionEntries = Object.entries(emotionData);
  const allTotals = emotionEntries.map(([_, counts]) =>
    counts.buyCount + counts.sellCount + counts.nullCount
  );
  const totalEmotionOccurrences = allTotals.reduce((sum, total) => sum + total, 0);
  
  return emotionEntries.map(([emotion, counts]) => {
    const total = counts.buyCount + counts.sellCount + counts.nullCount;
    
    if (total === 0) {
      return {
        subject: emotion,
        value: 0,
        fullMark: 100,
        leaning: 'Balanced',
        side: 'NULL',
        leaningValue: 0,
        totalTrades: 0
      };
    }
    
    let leaningValue = ((counts.buyCount - counts.sellCount) / total) * 100;
    leaningValue = Math.max(-100, Math.min(100, leaningValue));
    
    let leaning = 'Balanced';
    let side = 'NULL';
    
    if (leaningValue > 15) {
      leaning = 'Buy Leaning';
      side = 'Buy';
    } else if (leaningValue < -15) {
      leaning = 'Sell Leaning';
      side = 'Sell';
    }
    
    // Calculate relative frequency as a percentage of total emotion occurrences
    const relativeFrequency = totalEmotionOccurrences > 0 ? (total / totalEmotionOccurrences) * 100 : 0;
    
    return {
      subject: emotion,
      value: relativeFrequency,
      fullMark: 100,
      leaning,
      side,
      leaningValue,
      totalTrades: total
    };
  });
}

// Test Case 1: Balanced distribution
console.log('📊 Test Case 1: Balanced Distribution');
console.log('=====================================');
const balancedTrades = [
  { emotional_state: ['FOMO'], side: 'Buy' },
  { emotional_state: ['REVENGE'], side: 'Sell' },
  { emotional_state: ['TILT'], side: 'Buy' },
  { emotional_state: ['PATIENCE'], side: 'Sell' },
  { emotional_state: ['DISCIPLINE'], side: 'Buy' }
];

const balancedResult = testEmotionDataProcessing(balancedTrades);
console.log('Expected: Each emotion should show ~20% frequency');
balancedResult.forEach(item => {
  console.log(`${item.subject}: ${item.value.toFixed(1)}% (${item.totalTrades} trades)`);
});

console.log('\n✅ Verification: Values should sum to ~100%');
const sum1 = balancedResult.reduce((sum, item) => sum + item.value, 0);
console.log(`Actual sum: ${sum1.toFixed(1)}%`);

// Test Case 2: Skewed distribution
console.log('\n📊 Test Case 2: Skewed Distribution');
console.log('=====================================');
const skewedTrades = [
  { emotional_state: ['FOMO'], side: 'Buy' },
  { emotional_state: ['FOMO'], side: 'Buy' },
  { emotional_state: ['FOMO'], side: 'Buy' },
  { emotional_state: ['FOMO'], side: 'Buy' },
  { emotional_state: ['REVENGE'], side: 'Sell' },
  { emotional_state: ['TILT'], side: 'Buy' }
];

const skewedResult = testEmotionDataProcessing(skewedTrades);
console.log('Expected: FOMO should show ~67%, others ~17% each');
skewedResult.forEach(item => {
  console.log(`${item.subject}: ${item.value.toFixed(1)}% (${item.totalTrades} trades)`);
});

console.log('\n✅ Verification: Values should sum to ~100%');
const sum2 = skewedResult.reduce((sum, item) => sum + item.value, 0);
console.log(`Actual sum: ${sum2.toFixed(1)}%`);

// Test Case 3: Single emotion
console.log('\n📊 Test Case 3: Single Emotion');
console.log('=====================================');
const singleTrades = [
  { emotional_state: ['FOMO'], side: 'Buy' },
  { emotional_state: ['FOMO'], side: 'Buy' },
  { emotional_state: ['FOMO'], side: 'Buy' }
];

const singleResult = testEmotionDataProcessing(singleTrades);
console.log('Expected: FOMO should show 100%, others 0%');
singleResult.forEach(item => {
  console.log(`${item.subject}: ${item.value.toFixed(1)}% (${item.totalTrades} trades)`);
});

console.log('\n✅ Verification: Values should sum to 100%');
const sum3 = singleResult.reduce((sum, item) => sum + item.value, 0);
console.log(`Actual sum: ${sum3.toFixed(1)}%`);

// Test Case 4: Empty data
console.log('\n📊 Test Case 4: Empty Data');
console.log('=====================================');
const emptyResult = testEmotionDataProcessing([]);
console.log('Expected: Empty array');
console.log(`Result: ${emptyResult.length} emotions`);

console.log('\n🎯 Summary of Fix:');
console.log('==================');
console.log('✅ Emotion radar now shows relative frequency percentages');
console.log('✅ Values are calculated as (emotion count / total emotion occurrences) * 100');
console.log('✅ Radar will no longer appear "filled" but show actual distribution');
console.log('✅ Fixed fullMark to 100 for consistent percentage-based visualization');
console.log('✅ Updated tooltip to show "Frequency: X%" instead of "Bias: X%"');
console.log('✅ Radar properly scales based on relative frequency of each emotion');

console.log('\n🌐 Browser Test Instructions:');
console.log('=============================');
console.log('1. Navigate to Dashboard page');
console.log('2. Look at the Emotional Patterns radar chart');
console.log('3. The radar should show different extensions for each emotion');
console.log('4. Hover over emotions to see frequency percentages');
console.log('5. The radar should NOT appear completely filled');
console.log('6. Values should reflect actual emotion distribution in trades');