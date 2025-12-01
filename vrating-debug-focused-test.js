// Focused VRating Debug Test
// Target: Identify exact calculation issues in risk management and weighted average

const { calculateVRating, calculateVRatingCategoryScores } = require('./src/lib/vrating-calculations.ts');

// Test data for focused debugging
const lowRiskTrades = [
  // Low risk trades: <5% drawdown, <5% large losses, consistent sizing, longer duration
  { id: 1, entry_price: 100, exit_price: 105, quantity: 10, pnl: 50, entry_time: '2025-01-01T09:00:00Z', exit_time: '2025-01-01T15:00:00Z', strategy_id: 'low-risk', emotional_state: 'Confident', notes: 'Good setup', strategy: 'Low Risk Strategy' },
  { id: 2, entry_price: 105, exit_price: 103, quantity: 10, pnl: -20, entry_time: '2025-01-02T09:00:00Z', exit_time: '2025-01-02T15:00:00Z', strategy_id: 'low-risk', emotional_state: 'Patient', notes: 'Small loss', strategy: 'Low Risk Strategy' },
  { id: 3, entry_price: 103, exit_price: 108, quantity: 10, pnl: 50, entry_time: '2025-01-03T09:00:00Z', exit_time: '2025-01-03T15:00:00Z', strategy_id: 'low-risk', emotional_state: 'Focused', notes: 'Good execution', strategy: 'Low Risk Strategy' },
  { id: 4, entry_price: 108, exit_price: 106, quantity: 10, pnl: -20, entry_time: '2025-01-04T09:00:00Z', exit_time: '2025-01-04T15:00:00Z', strategy_id: 'low-risk', emotional_state: 'Calm', notes: 'Managed risk', strategy: 'Low Risk Strategy' },
  { id: 5, entry_price: 106, exit_price: 112, quantity: 10, pnl: 60, entry_time: '2025-01-05T09:00:00Z', exit_time: '2025-01-05T15:00:00Z', strategy_id: 'low-risk', emotional_state: 'Confident', notes: 'Strong trend', strategy: 'Low Risk Strategy' }
];

const highPerformerTrades = [
  // High performer: >50% P&L, >70% win rate
  { id: 1, entry_price: 100, exit_price: 110, quantity: 10, pnl: 100, entry_time: '2025-01-01T09:00:00Z', exit_time: '2025-01-01T10:30:00Z', strategy_id: 'high-perf', emotional_state: 'Confident', notes: 'Great setup', strategy: 'High Performer Strategy' },
  { id: 2, entry_price: 110, exit_price: 115, quantity: 10, pnl: 50, entry_time: '2025-01-02T09:00:00Z', exit_time: '2025-01-02T10:00:00Z', strategy_id: 'high-perf', emotional_state: 'Focused', notes: 'Good entry', strategy: 'High Performer Strategy' },
  { id: 3, entry_price: 115, exit_price: 108, quantity: 10, pnl: -70, entry_time: '2025-01-03T09:00:00Z', exit_time: '2025-01-03T10:30:00Z', strategy_id: 'high-perf', emotional_state: 'Calm', notes: 'Small loss', strategy: 'High Performer Strategy' },
  { id: 4, entry_price: 108, exit_price: 118, quantity: 10, pnl: 100, entry_time: '2025-01-04T09:00:00Z', exit_time: '2025-01-04T11:00:00Z', strategy_id: 'high-perf', emotional_state: 'Excited', notes: 'Big winner', strategy: 'High Performer Strategy' },
  { id: 5, entry_price: 118, exit_price: 125, quantity: 10, pnl: 70, entry_time: '2025-01-05T09:00:00Z', exit_time: '2025-01-05T10:15:00Z', strategy_id: 'high-perf', emotional_state: 'Confident', notes: 'Strong finish', strategy: 'High Performer Strategy' }
];

console.log('🔍 FOCUSED VRATING DEBUG TEST');
console.log('=====================================\n');

// Test 1: Low Risk Scenario - Focus on Risk Management Calculation
console.log('🧪 TEST 1: LOW RISK SCENARIO');
console.log('Expected: Risk Management 8.0-10.0, Overall 6.0-10.0');
console.log('Description: <5% drawdown, <5% large losses, consistent sizing, long duration\n');

const lowRiskResult = calculateVRating(lowRiskTrades);
console.log('📊 RESULTS:');
console.log(`   Overall Rating: ${lowRiskResult.overallRating}`);
console.log(`   Risk Management: ${lowRiskResult.categoryScores.riskManagement}`);
console.log(`   Consistency: ${lowRiskResult.categoryScores.consistency}`);
console.log(`   Profitability: ${lowRiskResult.categoryScores.profitability}`);
console.log(`   Emotional Discipline: ${lowRiskResult.categoryScores.emotionalDiscipline}`);
console.log(`   Journaling Adherence: ${lowRiskResult.categoryScores.journalingAdherence}`);

console.log('\n🔍 DETAILED ANALYSIS:');
console.log(`   Risk Management Score: ${lowRiskResult.categoryScores.riskManagement} (Expected: 8.0-10.0)`);
console.log(`   Status: ${lowRiskResult.categoryScores.riskManagement >= 8.0 && lowRiskResult.categoryScores.riskManagement <= 10.0 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Overall Score: ${lowRiskResult.overallRating} (Expected: 6.0-10.0)`);
console.log(`   Status: ${lowRiskResult.overallRating >= 6.0 && lowRiskResult.overallRating <= 10.0 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 2: High Performer Scenario - Focus on Weighted Average Calculation
console.log('🧪 TEST 2: HIGH PERFORMER SCENARIO');
console.log('Expected: Profitability 9.0-10.0, Overall 7.0-10.0');
console.log('Description: >50% P&L, >70% win rate\n');

const highPerfResult = calculateVRating(highPerformerTrades);
console.log('📊 RESULTS:');
console.log(`   Overall Rating: ${highPerfResult.overallRating}`);
console.log(`   Profitability: ${highPerfResult.categoryScores.profitability}`);
console.log(`   Risk Management: ${highPerfResult.categoryScores.riskManagement}`);
console.log(`   Consistency: ${highPerfResult.categoryScores.consistency}`);
console.log(`   Emotional Discipline: ${highPerfResult.categoryScores.emotionalDiscipline}`);
console.log(`   Journaling Adherence: ${highPerfResult.categoryScores.journalingAdherence}`);

console.log('\n🔍 WEIGHTED AVERAGE ANALYSIS:');
const weights = { profitability: 0.3, riskManagement: 0.25, consistency: 0.2, emotionalDiscipline: 0.15, journalingAdherence: 0.1 };
const weightedCalculation = 
  highPerfResult.categoryScores.profitability * weights.profitability +
  highPerfResult.categoryScores.riskManagement * weights.riskManagement +
  highPerfResult.categoryScores.consistency * weights.consistency +
  highPerfResult.categoryScores.emotionalDiscipline * weights.emotionalDiscipline +
  highPerfResult.categoryScores.journalingAdherence * weights.journalingAdherence;

console.log(`   Profitability: ${highPerfResult.categoryScores.profitability} × ${weights.profitability} = ${highPerfResult.categoryScores.profitability * weights.profitability}`);
console.log(`   Risk Management: ${highPerfResult.categoryScores.riskManagement} × ${weights.riskManagement} = ${highPerfResult.categoryScores.riskManagement * weights.riskManagement}`);
console.log(`   Consistency: ${highPerfResult.categoryScores.consistency} × ${weights.consistency} = ${highPerfResult.categoryScores.consistency * weights.consistency}`);
console.log(`   Emotional Discipline: ${highPerfResult.categoryScores.emotionalDiscipline} × ${weights.emotionalDiscipline} = ${highPerfResult.categoryScores.emotionalDiscipline * weights.emotionalDiscipline}`);
console.log(`   Journaling Adherence: ${highPerfResult.categoryScores.journalingAdherence} × ${weights.journalingAdherence} = ${highPerfResult.categoryScores.journalingAdherence * weights.journalingAdherence}`);
console.log(`   ──────────────────────────────────────────────`);
console.log(`   Calculated Weighted Sum: ${weightedCalculation}`);
console.log(`   Actual Overall Rating: ${highPerfResult.overallRating}`);
console.log(`   Match: ${Math.abs(weightedCalculation - highPerfResult.overallRating) < 0.01 ? '✅ YES' : '❌ NO'}`);

console.log('\n🔍 PROFITABILITY SCORE ANALYSIS:');
console.log(`   Profitability Score: ${highPerfResult.categoryScores.profitability} (Expected: 9.0-10.0)`);
console.log(`   Status: ${highPerfResult.categoryScores.profitability >= 9.0 && highPerfResult.categoryScores.profitability <= 10.0 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Overall Score: ${highPerfResult.overallRating} (Expected: 7.0-10.0)`);
console.log(`   Status: ${highPerfResult.overallRating >= 7.0 && highPerfResult.overallRating <= 10.0 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 3: Manual Calculation Verification
console.log('🧪 TEST 3: MANUAL CALCULATION VERIFICATION');
console.log('Testing if the weighted average formula is working correctly\n');

// Test with known values
const testScores = {
  profitability: 9.9,
  riskManagement: 2.5,
  consistency: 2.0,
  emotionalDiscipline: 10.0,
  journalingAdherence: 10.0
};

const manualWeighted = 
  testScores.profitability * weights.profitability +
  testScores.riskManagement * weights.riskManagement +
  testScores.consistency * weights.consistency +
  testScores.emotionalDiscipline * weights.emotionalDiscipline +
  testScores.journalingAdherence * weights.journalingAdherence;

console.log('📊 MANUAL CALCULATION:');
console.log(`   Test Scores: ${JSON.stringify(testScores)}`);
console.log(`   Manual Weighted: ${manualWeighted.toFixed(2)}`);
console.log(`   Expected Range: 5.0-7.0 (due to low risk/consistency scores)`);
console.log(`   Status: ${manualWeighted >= 5.0 && manualWeighted <= 7.0 ? '✅ WITHIN EXPECTED RANGE' : '❌ OUTSIDE EXPECTED RANGE'}`);

console.log('\n🔍 ISSUE ANALYSIS:');
console.log('   If profitability is 9.9 but other scores are low (2.0-2.5),');
console.log('   the weighted average will be pulled down significantly.');
console.log('   This explains why high performers get lower overall ratings.');
console.log('   The issue may be in the individual category scoring logic.');

console.log('\n🎯 ROOT CAUSE HYPOTHESIS:');
console.log('   1. Risk Management scoring bands are not working correctly');
console.log('   2. Consistency scoring may be too harsh for small datasets');
console.log('   3. The weighted average is mathematically correct but');
console.log('      individual category scores are the problem');

console.log('\n' + '='.repeat(50));
console.log('🏁 FOCUSED DEBUG TEST COMPLETE');
console.log('='.repeat(50));