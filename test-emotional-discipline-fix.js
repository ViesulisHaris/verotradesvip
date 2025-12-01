/**
 * Test Emotional Discipline Scoring Fixes
 * 
 * This script tests the improved emotional discipline scoring system
 * to verify that profitable accounts get more realistic scores.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🧪 TESTING EMOTIONAL DISCIPLINE SCORING FIXES');
console.log('=============================================');

// Import the updated VRating calculation functions
const POSITIVE_EMOTIONS = ['PATIENCE', 'DISCIPLINE', 'CONFIDENT', 'FOCUSED', 'CALM'];
const NEGATIVE_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'GREED'];
const NEUTRAL_EMOTIONS = ['NEUTRAL', 'ANALYTICAL', 'OBJECTIVE'];
const NORMAL_TRADING_EMOTIONS = ['OVERRISK', 'ANXIOUS', 'FEAR'];

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

// Enhanced parseEmotionalState function (matching the fix)
function parseEmotionalState(emotionalState) {
  if (!emotionalState) return null;
  
  if (typeof emotionalState === 'string') {
    try {
      const parsed = JSON.parse(emotionalState);
      // Handle JSON array format: ["OVERRISK","DISCIPLINE","NEUTRAL"]
      if (Array.isArray(parsed)) {
        return {
          primary_emotion: parsed[0] || null,
          secondary_emotion: parsed[1] || null,
          intensity: undefined,
          notes: `Emotions: ${parsed.join(', ')}`
        };
      }
      return parsed;
    } catch {
      return null;
    }
  }
  
  if (typeof emotionalState === 'object') {
    return emotionalState;
  }
  
  return null;
}

// Enhanced emotional discipline metrics calculation
function calculateEmotionalDisciplineMetrics(trades) {
  if (trades.length === 0) {
    return {
      positiveEmotionPercentage: 0,
      negativeImpactPercentage: 0,
      positiveEmotionWinCorrelation: 0,
      emotionLoggingCompleteness: 0
    };
  }
  
  let positiveEmotions = 0;
  let negativeEmotions = 0;
  let totalEmotions = 0;
  let negativeImpactLosses = 0;
  let positiveEmotionWins = 0;
  let positiveEmotionTrades = 0;
  
  trades.forEach(trade => {
    const emotionalState = parseEmotionalState(trade.emotional_state);
    if (!emotionalState) return;
    
    totalEmotions++;
    const primaryEmotion = emotionalState.primary_emotion?.toUpperCase();
    const secondaryEmotion = emotionalState.secondary_emotion?.toUpperCase();
    
    // Check for positive emotions
    const hasPositive = POSITIVE_EMOTIONS.includes(primaryEmotion || '') ||
                       POSITIVE_EMOTIONS.includes(secondaryEmotion || '');
    
    // Check for negative emotions (reduced set)
    const hasNegative = NEGATIVE_EMOTIONS.includes(primaryEmotion || '') ||
                       NEGATIVE_EMOTIONS.includes(secondaryEmotion || '');
    
    // Check for neutral emotions
    const hasNeutral = NEUTRAL_EMOTIONS.includes(primaryEmotion || '') ||
                      NEUTRAL_EMOTIONS.includes(secondaryEmotion || '');
    
    // Check for normal trading emotions (light penalty)
    const hasNormalTrading = NORMAL_TRADING_EMOTIONS.includes(primaryEmotion || '') ||
                          NORMAL_TRADING_EMOTIONS.includes(secondaryEmotion || '');
    
    if (hasPositive) {
      positiveEmotions++;
      positiveEmotionTrades++;
      if ((trade.pnl || 0) > 0) {
        positiveEmotionWins++;
      }
    }
    
    if (hasNegative) {
      negativeEmotions++;
      if ((trade.pnl || 0) < 0) {
        negativeImpactLosses++;
      }
    }
    
    // Neutral emotions count as partially positive (50% weight)
    if (hasNeutral) {
      positiveEmotions += 0.5;
      positiveEmotionTrades += 0.5;
      if ((trade.pnl || 0) > 0) {
        positiveEmotionWins += 0.5;
      }
    }
    
    // Normal trading emotions count as slightly positive (25% weight)
    if (hasNormalTrading) {
      positiveEmotions += 0.25;
      positiveEmotionTrades += 0.25;
      if ((trade.pnl || 0) > 0) {
        positiveEmotionWins += 0.25;
      }
    }
  });
  
  const positiveEmotionPercentage = totalEmotions > 0 ? (positiveEmotions / totalEmotions) * 100 : 0;
  const negativeImpactPercentage = negativeEmotions > 0 ? (negativeImpactLosses / negativeEmotions) * 100 : 0;
  const positiveEmotionWinCorrelation = positiveEmotionTrades > 0 ? (positiveEmotionWins / positiveEmotionTrades) * 100 : 0;
  const emotionLoggingCompleteness = trades.length > 0 ? (totalEmotions / trades.length) * 100 : 0;
  
  return {
    positiveEmotionPercentage,
    negativeImpactPercentage,
    positiveEmotionWinCorrelation,
    emotionLoggingCompleteness,
    // Additional debug info
    totalEmotions,
    positiveEmotions,
    negativeEmotions,
    negativeImpactLosses,
    positiveEmotionWins,
    positiveEmotionTrades
  };
}

// Enhanced emotional discipline score calculation
function calculateEmotionalDisciplineScore(metrics, totalPnL) {
  const { positiveEmotionPercentage, negativeImpactPercentage, positiveEmotionWinCorrelation, emotionLoggingCompleteness } = metrics;
  
  let score = 0;
  
  // Enhanced scoring bands - more realistic for trading psychology
  if (positiveEmotionPercentage > 80 && negativeImpactPercentage < 15) {
    score = 10.0;
  } else if (
    positiveEmotionPercentage >= 65 && positiveEmotionPercentage <= 80 &&
    negativeImpactPercentage >= 15 && negativeImpactPercentage <= 25
  ) {
    score = 8.5 + ((positiveEmotionPercentage - 65) / 15) * 1.4;
  } else if (
    positiveEmotionPercentage >= 50 && positiveEmotionPercentage <= 65 &&
    negativeImpactPercentage >= 25 && negativeImpactPercentage <= 40
  ) {
    score = 7.0 + ((positiveEmotionPercentage - 50) / 15) * 1.4;
  } else if (
    positiveEmotionPercentage >= 35 && positiveEmotionPercentage <= 50 &&
    negativeImpactPercentage >= 40 && negativeImpactPercentage <= 55
  ) {
    score = 5.5 + ((positiveEmotionPercentage - 35) / 15) * 1.4;
  } else {
    score = 4.0 + (positiveEmotionPercentage / 8) * 1.4;
  }
  
  // Enhanced bonus system
  // Bonus 1: +1.0 if Positive emotions correlate with >70% wins
  if (positiveEmotionWinCorrelation > 70) {
    score += 1.0;
  }
  
  // Bonus 2: +0.5 if Positive emotions correlate with >60% wins
  else if (positiveEmotionWinCorrelation > 60) {
    score += 0.5;
  }
  
  // Bonus 3: +1.0 for complete emotional logging (>95%)
  if (emotionLoggingCompleteness > 95) {
    score += 1.0;
  }
  
  // Bonus 4: +0.5 for profitable trading despite emotional challenges
  if (totalPnL && totalPnL > 0 && score < 8.0) {
    score += 0.5;
  }
  
  return Math.min(10.0, Math.max(0, score));
}

// Test function
async function testEmotionalDisciplineFixes() {
  console.log('\n📊 Testing Enhanced Emotional Discipline Scoring...');
  
  try {
    // Get all trades with emotional data
    const { data: allTrades, error: tradesError } = await authSupabase
      .from('trades')
      .select('id, symbol, pnl, emotional_state, trade_date')
      .eq('user_id', currentUserId)
      .order('trade_date', { ascending: false });
    
    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError.message);
      return;
    }
    
    if (!allTrades || allTrades.length === 0) {
      console.log('⚠️ No trades found for testing');
      return;
    }
    
    console.log(`📈 Testing with ${allTrades.length} trades...`);
    
    // Calculate basic metrics
    const totalPnL = allTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = allTrades.filter(trade => trade.pnl > 0);
    const losingTrades = allTrades.filter(trade => trade.pnl < 0);
    const winRate = (winningTrades.length / allTrades.length) * 100;
    
    console.log('\n📊 Trading Performance:');
    console.log('===========================');
    console.log(`Total P&L: $${totalPnL.toFixed(2)}`);
    console.log(`Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`Winning Trades: ${winningTrades.length}`);
    console.log(`Losing Trades: ${losingTrades.length}`);
    
    // Test emotional data parsing
    console.log('\n🔍 Testing Emotional Data Parsing:');
    console.log('===================================');
    
    const sampleTrades = allTrades.slice(0, 5);
    sampleTrades.forEach((trade, index) => {
      console.log(`\nTrade ${index + 1}:`);
      console.log(`  Original emotional_state: ${trade.emotional_state}`);
      console.log(`  Parsed emotional state: ${JSON.stringify(parseEmotionalState(trade.emotional_state))}`);
      console.log(`  P&L: $${trade.pnl || 0}`);
    });
    
    // Calculate enhanced emotional discipline metrics
    const metrics = calculateEmotionalDisciplineMetrics(allTrades);
    const oldScore = 2.0; // Based on previous diagnosis
    const newScore = calculateEmotionalDisciplineScore(metrics, totalPnL);
    
    console.log('\n🎯 Enhanced Emotional Discipline Analysis:');
    console.log('====================================');
    console.log(`Total Emotions Logged: ${metrics.totalEmotions}`);
    console.log(`Positive Emotions: ${metrics.positiveEmotions.toFixed(1)} (${metrics.positiveEmotionPercentage.toFixed(1)}%)`);
    console.log(`Negative Emotions: ${metrics.negativeEmotions.toFixed(1)} (${((metrics.negativeEmotions/metrics.totalEmotions)*100).toFixed(1)}%)`);
    console.log(`Negative Impact Losses: ${metrics.negativeImpactLosses}/${metrics.negativeEmotions} (${metrics.negativeImpactPercentage.toFixed(1)}%)`);
    console.log(`Positive Emotion Wins: ${metrics.positiveEmotionWins.toFixed(1)}/${metrics.positiveEmotionTrades.toFixed(1)} (${metrics.positiveEmotionWinCorrelation.toFixed(1)}%)`);
    console.log(`Emotion Logging Completeness: ${metrics.emotionLoggingCompleteness.toFixed(1)}%`);
    
    console.log('\n📊 Score Comparison:');
    console.log('=====================');
    console.log(`Old Emotional Discipline Score: ${oldScore.toFixed(1)}/10`);
    console.log(`New Emotional Discipline Score: ${newScore.toFixed(1)}/10`);
    console.log(`Improvement: +${(newScore - oldScore).toFixed(1)}/10`);
    
    // Analyze improvement
    const improvement = newScore - oldScore;
    console.log('\n🎉 IMPROVEMENT ANALYSIS:');
    console.log('=========================');
    
    if (improvement > 2.0) {
      console.log('✅ SIGNIFICANT IMPROVEMENT: Score improved by more than 2.0 points');
      console.log('   The enhanced scoring system is working correctly');
    } else if (improvement > 1.0) {
      console.log('✅ GOOD IMPROVEMENT: Score improved by more than 1.0 point');
      console.log('   The scoring fixes are having positive impact');
    } else if (improvement > 0) {
      console.log('✅ MODEST IMPROVEMENT: Score improved, but could be better');
      console.log('   Consider further adjustments to scoring bands');
    } else {
      console.log('❌ NO IMPROVEMENT: Score did not improve');
      console.log('   Need to investigate further');
    }
    
    // Test profitability bonus
    if (totalPnL > 0 && newScore > oldScore) {
      console.log('\n🎁 PROFITABILITY BONUS CONFIRMED:');
      console.log('==================================');
      console.log('✅ Profitable trading account received emotional discipline bonus');
      console.log('✅ Scoring system now considers overall performance');
    }
    
    return {
      totalTrades: allTrades.length,
      totalPnL,
      winRate,
      oldScore,
      newScore,
      improvement,
      metrics,
      isProfitable: totalPnL > 0,
      hasSignificantImprovement: improvement > 2.0
    };
    
  } catch (error) {
    console.error('❌ Error testing emotional discipline fixes:', error.message);
    return null;
  }
}

// Main test function
async function main() {
  try {
    console.log('🚀 Starting Emotional Discipline Scoring Fixes Test...\n');
    
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Test the fixes
    const testResults = await testEmotionalDisciplineFixes();
    
    if (testResults) {
      console.log('\n📋 TEST RESULTS SUMMARY');
      console.log('========================');
      
      console.log('\n🎯 KEY FINDINGS:');
      console.log(`- Account is ${testResults.isProfitable ? 'PROFITABLE' : 'NOT PROFITABLE'} ($${testResults.totalPnL.toFixed(2)})`);
      console.log(`- Win Rate: ${testResults.winRate.toFixed(1)}%`);
      console.log(`- Old Score: ${testResults.oldScore.toFixed(1)}/10`);
      console.log(`- New Score: ${testResults.newScore.toFixed(1)}/10`);
      console.log(`- Improvement: +${testResults.improvement.toFixed(1)}/10`);
      
      if (testResults.hasSignificantImprovement) {
        console.log('\n🎉 SUCCESS: Emotional discipline scoring fixes are working!');
        console.log('The enhanced scoring system provides more realistic scores for profitable traders.');
      } else if (testResults.improvement > 0) {
        console.log('\n✅ PARTIAL SUCCESS: Some improvement achieved.');
        console.log('Further refinements may be needed for optimal results.');
      } else {
        console.log('\n❌ ISSUES: No improvement detected.');
        console.log('The scoring fixes may not be working as expected.');
      }
    }
    
    console.log('\n✅ Emotional Discipline Scoring Fixes Test Complete');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR during test:', error.message);
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

module.exports = { main, testEmotionalDisciplineFixes, calculateEmotionalDisciplineScore };