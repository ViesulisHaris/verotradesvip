/**
 * Test VRating System with Emotional Discipline Fixes
 * 
 * This script tests the complete VRating calculation system
 * to ensure emotional discipline improvements work correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🧪 TESTING VRATING SYSTEM WITH EMOTIONAL DISCIPLINE FIXES');
console.log('===================================================');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test user credentials
const TEST_USER_EMAIL = 'testuser@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let authSupabase = null;
let currentUserId = null;

// Authentication function
async function authenticate() {
  console.log('\n🔐 Authenticating user...');
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      throw authError;
    }
    
    if (!authData.session) {
      throw new Error('No session obtained after authentication');
    }
    
    // Create authenticated client
    authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });
    
    currentUserId = authData.session.user.id;
    console.log(`✅ Authenticated user ID: ${currentUserId}`);
    
    return authData.session;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

// Test VRating calculation with actual trades
async function testVRatingWithEmotionalFixes() {
  console.log('\n📊 Testing VRating Calculation with Emotional Discipline Fixes...');
  
  try {
    // Get all trades for VRating calculation
    const { data: allTrades, error: tradesError } = await authSupabase
      .from('trades')
      .select('*')
      .eq('user_id', currentUserId)
      .order('trade_date', { ascending: false });
    
    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError.message);
      return;
    }
    
    if (!allTrades || allTrades.length === 0) {
      console.log('⚠️ No trades found for VRating testing');
      return;
    }
    
    console.log(`📈 Testing VRating with ${allTrades.length} trades...`);
    
    // Import VRating calculation functions from the actual implementation
    const { calculateVRating } = require('./src/lib/vrating-calculations');
    
    // Convert trades to VRating format
    const vRatingTrades = allTrades.map(trade => ({
      ...trade,
      emotional_state: trade.emotional_state // Keep original format for testing
    }));
    
    console.log('\n🔍 Sample Trade Data for VRating:');
    console.log('===================================');
    
    const sampleTrades = vRatingTrades.slice(0, 3);
    sampleTrades.forEach((trade, index) => {
      console.log(`\nTrade ${index + 1}:`);
      console.log(`  Symbol: ${trade.symbol}`);
      console.log(`  P&L: $${trade.pnl || 0}`);
      console.log(`  Emotional State: ${trade.emotional_state}`);
      console.log(`  Trade Date: ${trade.trade_date}`);
    });
    
    // Calculate VRating with enhanced emotional discipline
    console.log('\n🎯 Calculating VRating with Enhanced Emotional Discipline...');
    console.log('========================================================');
    
    const startTime = performance.now();
    const vRatingResult = calculateVRating(vRatingTrades);
    const endTime = performance.now();
    
    console.log(`\n⏱️ VRating calculation completed in ${(endTime - startTime).toFixed(2)}ms`);
    
    // Display VRating results
    console.log('\n📊 VRating Results:');
    console.log('==================');
    console.log(`Overall VRating: ${vRatingResult.overallRating.toFixed(2)}/10`);
    console.log(`Trade Count: ${vRatingResult.tradeCount}`);
    
    console.log('\n📈 Category Scores:');
    console.log('==================');
    console.log(`Profitability: ${vRatingResult.categoryScores.profitability.toFixed(2)}/10 (30% weight)`);
    console.log(`Risk Management: ${vRatingResult.categoryScores.riskManagement.toFixed(2)}/10 (25% weight)`);
    console.log(`Consistency: ${vRatingResult.categoryScores.consistency.toFixed(2)}/10 (20% weight)`);
    console.log(`Emotional Discipline: ${vRatingResult.categoryScores.emotionalDiscipline.toFixed(2)}/10 (15% weight)`);
    console.log(`Journaling Adherence: ${vRatingResult.categoryScores.journalingAdherence.toFixed(2)}/10 (10% weight)`);
    
    // Calculate weighted contribution
    const profitabilityContribution = vRatingResult.categoryScores.profitability * 0.30;
    const riskManagementContribution = vRatingResult.categoryScores.riskManagement * 0.25;
    const consistencyContribution = vRatingResult.categoryScores.consistency * 0.20;
    const emotionalDisciplineContribution = vRatingResult.categoryScores.emotionalDiscipline * 0.15;
    const journalingAdherenceContribution = vRatingResult.categoryScores.journalingAdherence * 0.10;
    
    console.log('\n🎯 Weighted Contributions:');
    console.log('=======================');
    console.log(`Profitability: ${profitabilityContribution.toFixed(2)} (30%)`);
    console.log(`Risk Management: ${riskManagementContribution.toFixed(2)} (25%)`);
    console.log(`Consistency: ${consistencyContribution.toFixed(2)} (20%)`);
    console.log(`Emotional Discipline: ${emotionalDisciplineContribution.toFixed(2)} (15%)`);
    console.log(`Journaling Adherence: ${journalingAdherenceContribution.toFixed(2)} (10%)`);
    
    const calculatedWeightedSum = (
      profitabilityContribution +
      riskManagementContribution +
      consistencyContribution +
      emotionalDisciplineContribution +
      journalingAdherenceContribution
    );
    
    console.log(`\n📊 Weighted Sum Check:`);
    console.log('======================');
    console.log(`Calculated Weighted Sum: ${calculatedWeightedSum.toFixed(2)}`);
    console.log(`Reported Overall Rating: ${vRatingResult.overallRating.toFixed(2)}`);
    console.log(`Difference: ${Math.abs(calculatedWeightedSum - vRatingResult.overallRating).toFixed(2)}`);
    
    // Analyze emotional discipline improvement
    console.log('\n🎉 Emotional Discipline Analysis:');
    console.log('==================================');
    console.log(`Emotional Discipline Score: ${vRatingResult.categoryScores.emotionalDiscipline.toFixed(2)}/10`);
    
    // Get emotional discipline metrics for detailed analysis
    const metrics = vRatingResult.metrics.emotionalDiscipline;
    console.log(`Positive Emotion Percentage: ${metrics.positiveEmotionPercentage.toFixed(1)}%`);
    console.log(`Negative Impact Percentage: ${metrics.negativeImpactPercentage.toFixed(1)}%`);
    console.log(`Positive Emotion Win Correlation: ${metrics.positiveEmotionWinCorrelation.toFixed(1)}%`);
    console.log(`Emotion Logging Completeness: ${metrics.emotionLoggingCompleteness.toFixed(1)}%`);
    
    // Determine if emotional discipline score is reasonable
    const isEmotionalScoreReasonable = vRatingResult.categoryScores.emotionalDiscipline >= 6.0;
    const isOverallVRatingReasonable = vRatingResult.overallRating >= 7.0;
    
    console.log('\n🎯 Reasonableness Check:');
    console.log('=========================');
    console.log(`Emotional Discipline Score Reasonable: ${isEmotionalScoreReasonable ? '✅ YES' : '❌ NO'} (≥6.0)`);
    console.log(`Overall VRating Reasonable: ${isOverallVRatingReasonable ? '✅ YES' : '❌ NO'} (≥7.0)`);
    
    // Calculate basic trading metrics
    const totalPnL = allTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = allTrades.filter(trade => trade.pnl > 0);
    const winRate = (winningTrades.length / allTrades.length) * 100;
    
    console.log('\n📈 Trading Performance Context:');
    console.log('===============================');
    console.log(`Total P&L: $${totalPnL.toFixed(2)}`);
    console.log(`Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`Account Status: ${totalPnL > 0 ? 'PROFITABLE' : 'NOT PROFITABLE'}`);
    
    // Final assessment
    console.log('\n🏁 FINAL ASSESSMENT:');
    console.log('====================');
    
    if (isEmotionalScoreReasonable && isOverallVRatingReasonable && totalPnL > 0) {
      console.log('🎉 SUCCESS: Emotional discipline fixes are working correctly!');
      console.log('✅ Profitable account now gets reasonable emotional discipline score');
      console.log('✅ Overall VRating reflects good trading performance');
      console.log('✅ Enhanced scoring system is functioning as intended');
    } else if (isEmotionalScoreReasonable) {
      console.log('⚠️ PARTIAL SUCCESS: Emotional discipline improved, but overall VRating could be better');
      console.log('📊 Check other category scores for potential issues');
    } else {
      console.log('❌ ISSUES DETECTED: Emotional discipline score still too low');
      console.log('🔍 May need further adjustments to scoring algorithm');
    }
    
    return {
      totalTrades: allTrades.length,
      totalPnL,
      winRate,
      overallVRating: vRatingResult.overallRating,
      emotionalDisciplineScore: vRatingResult.categoryScores.emotionalDiscipline,
      isEmotionalScoreReasonable,
      isOverallVRatingReasonable,
      categoryScores: vRatingResult.categoryScores,
      metrics,
      calculationTime: endTime - startTime
    };
    
  } catch (error) {
    console.error('❌ Error testing VRating with emotional fixes:', error.message);
    return null;
  }
}

// Main test function
async function main() {
  try {
    console.log('🚀 Starting VRating System Test with Emotional Discipline Fixes...\n');
    
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Test VRating calculation
    const testResults = await testVRatingWithEmotionalFixes();
    
    if (testResults) {
      console.log('\n📋 VRATING TEST RESULTS SUMMARY');
      console.log('================================');
      
      console.log('\n🎯 KEY RESULTS:');
      console.log(`- Total Trades: ${testResults.totalTrades}`);
      console.log(`- Account P&L: $${testResults.totalPnL.toFixed(2)}`);
      console.log(`- Win Rate: ${testResults.winRate.toFixed(1)}%`);
      console.log(`- Overall VRating: ${testResults.overallVRating.toFixed(2)}/10`);
      console.log(`- Emotional Discipline: ${testResults.emotionalDisciplineScore.toFixed(2)}/10`);
      console.log(`- Calculation Time: ${testResults.calculationTime.toFixed(2)}ms`);
      
      console.log('\n🎉 SUCCESS CRITERIA:');
      console.log('=====================');
      console.log(`Emotional Discipline ≥6.0: ${testResults.isEmotionalScoreReasonable ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Overall VRating ≥7.0: ${testResults.isOverallVRatingReasonable ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Profitable Account: ${testResults.totalPnL > 0 ? '✅ YES' : '❌ NO'}`);
      
      const allCriteriaMet = testResults.isEmotionalScoreReasonable && 
                           testResults.isOverallVRatingReasonable && 
                           testResults.totalPnL > 0;
      
      if (allCriteriaMet) {
        console.log('\n🎉 OVERALL SUCCESS: All criteria met!');
        console.log('The emotional discipline scoring fixes are working correctly.');
        console.log('Profitable traders now receive realistic emotional discipline scores.');
        console.log('The VRating system properly balances all categories.');
      } else {
        console.log('\n⚠️ PARTIAL SUCCESS: Some criteria not met.');
        console.log('Further investigation may be needed for optimal results.');
      }
    }
    
    console.log('\n✅ VRating System Test with Emotional Discipline Fixes Complete');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR during VRating test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Execute test
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main, testVRatingWithEmotionalFixes };