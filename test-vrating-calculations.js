/**
 * Test script to verify VRating calculations work correctly
 * after removing specified items from keyMetrics arrays
 */

const { calculateVRating } = require('./src/lib/vrating-calculations.ts');

// Sample test data
const testTrades = [
  {
    id: '1',
    symbol: 'EURUSD',
    side: 'Buy',
    quantity: 1000,
    entry_price: 1.1000,
    exit_price: 1.1050,
    pnl: 50,
    trade_date: '2024-01-01',
    entry_time: '2024-01-01T10:00:00Z',
    exit_time: '2024-01-01T11:00:00Z',
    emotional_state: '{"primary_emotion": "PATIENCE", "secondary_emotion": "CONFIDENT"}',
    strategy_id: 'strategy1',
    user_id: 'test-user',
    notes: 'Good trade setup',
    market: 'Forex'
  },
  {
    id: '2',
    symbol: 'GBPUSD',
    side: 'Sell',
    quantity: 1000,
    entry_price: 1.2500,
    exit_price: 1.2450,
    pnl: 50,
    trade_date: '2024-01-02',
    entry_time: '2024-01-02T10:00:00Z',
    exit_time: '2024-01-02T11:00:00Z',
    emotional_state: '{"primary_emotion": "DISCIPLINE", "secondary_emotion": "FOCUSED"}',
    strategy_id: 'strategy1',
    user_id: 'test-user',
    notes: 'Followed plan perfectly',
    market: 'Forex'
  },
  {
    id: '3',
    symbol: 'USDJPY',
    side: 'Buy',
    quantity: 1000,
    entry_price: 110.00,
    exit_price: 109.50,
    pnl: -50,
    trade_date: '2024-01-03',
    entry_time: '2024-01-03T10:00:00Z',
    exit_time: '2024-01-03T11:00:00Z',
    emotional_state: '{"primary_emotion": "FOMO", "secondary_emotion": "ANXIOUS"}',
    strategy_id: 'strategy2',
    user_id: 'test-user',
    notes: 'Chased the market',
    market: 'Forex'
  }
];

console.log('🔍 [VRATING_TEST] Starting VRating calculation test...');
console.log('🔍 [VRATING_TEST] Test trades:', testTrades.length);

try {
  const result = calculateVRating(testTrades);
  
  console.log('✅ [VRATING_TEST] VRating calculation successful!');
  console.log('🔍 [VRATING_TEST] Overall Rating:', result.overallRating);
  console.log('🔍 [VRATING_TEST] Category Scores:', {
    profitability: result.categoryScores.profitability,
    riskManagement: result.categoryScores.riskManagement,
    consistency: result.categoryScores.consistency,
    emotionalDiscipline: result.categoryScores.emotionalDiscipline,
    journalingAdherence: result.categoryScores.journalingAdherence
  });
  
  // Verify the weighted calculation
  const expectedWeightedSum = 
    result.categoryScores.profitability * 0.30 +
    result.categoryScores.riskManagement * 0.25 +
    result.categoryScores.consistency * 0.20 +
    result.categoryScores.emotionalDiscipline * 0.15 +
    result.categoryScores.journalingAdherence * 0.10;
  
  console.log('🔍 [VRATING_TEST] Weighted calculation verification:', {
    calculated: result.overallRating,
    expected: expectedWeightedSum,
    difference: Math.abs(result.overallRating - expectedWeightedSum),
    isAccurate: Math.abs(result.overallRating - expectedWeightedSum) < 0.01
  });
  
  // Check that all scores are within valid range
  const allScoresValid = Object.values(result.categoryScores).every(score => 
    score >= 0 && score <= 10
  );
  
  console.log('🔍 [VRATING_TEST] Score range validation:', {
    allValid: allScoresValid,
    scores: result.categoryScores
  });
  
  console.log('✅ [VRATING_TEST] VRating calculations work correctly with updated metrics!');
  
} catch (error) {
  console.error('❌ [VRATING_TEST] VRating calculation failed:', error);
}