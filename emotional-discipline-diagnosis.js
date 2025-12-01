/**
 * Emotional Discipline Scoring Diagnosis Script
 * 
 * This script investigates why steady trading accounts get low emotional discipline scores
 * due to negative emotions being heavily penalized.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 EMOTIONAL DISCIPLINE SCORING DIAGNOSIS');
console.log('==========================================');
console.log('Investigating emotional discipline scoring issues...');

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

// Import VRating calculation functions
const POSITIVE_EMOTIONS = ['PATIENCE', 'DISCIPLINE', 'CONFIDENT', 'FOCUSED', 'CALM'];
const NEGATIVE_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'ANXIOUS', 'GREED', 'FEAR'];

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

// Function to parse emotional state
function parseEmotionalState(emotionalState) {
  if (!emotionalState) return null;
  
  if (typeof emotionalState === 'string') {
    try {
      return JSON.parse(emotionalState);
    } catch {
      return null;
    }
  }
  
  if (typeof emotionalState === 'object') {
    return emotionalState;
  }
  
  return null;
}

// Function to calculate emotional discipline metrics
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
    
    // Check for negative emotions
    const hasNegative = NEGATIVE_EMOTIONS.includes(primaryEmotion || '') ||
                       NEGATIVE_EMOTIONS.includes(secondaryEmotion || '');
    
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

// Function to calculate emotional discipline score
function calculateEmotionalDisciplineScore(metrics) {
  const { positiveEmotionPercentage, negativeImpactPercentage, positiveEmotionWinCorrelation } = metrics;
  
  console.log('\n🎯 Emotional Discipline Score Calculation:');
  console.log('==========================================');
  console.log(`Positive Emotion Percentage: ${positiveEmotionPercentage.toFixed(1)}%`);
  console.log(`Negative Impact Percentage: ${negativeImpactPercentage.toFixed(1)}%`);
  console.log(`Positive Emotion Win Correlation: ${positiveEmotionWinCorrelation.toFixed(1)}%`);
  
  let score = 0;
  
  // Base scoring bands - from VRating calculation
  if (positiveEmotionPercentage > 90 && negativeImpactPercentage < 10) {
    score = 10.0;
    console.log('🟢 Band 1: Perfect emotional discipline (score = 10.0)');
  } else if (
    positiveEmotionPercentage >= 70 && positiveEmotionPercentage <= 90 &&
    negativeImpactPercentage >= 10 && negativeImpactPercentage <= 20
  ) {
    score = 8.0 + ((positiveEmotionPercentage - 70) / 20) * 1.9;
    console.log('🟡 Band 2: Good emotional discipline (score = 8.0-9.9)');
  } else if (
    positiveEmotionPercentage >= 50 && positiveEmotionPercentage <= 70 &&
    negativeImpactPercentage >= 20 && negativeImpactPercentage <= 30
  ) {
    score = 6.0 + ((positiveEmotionPercentage - 50) / 20) * 1.9;
    console.log('🟠 Band 3: Moderate emotional discipline (score = 6.0-7.9)');
  } else if (
    positiveEmotionPercentage >= 30 && positiveEmotionPercentage <= 50 &&
    negativeImpactPercentage >= 30 && negativeImpactPercentage <= 50
  ) {
    score = 4.0 + ((positiveEmotionPercentage - 30) / 20) * 1.9;
    console.log('🔴 Band 4: Poor emotional discipline (score = 4.0-5.9)');
  } else {
    score = 2.0 + (positiveEmotionPercentage / 10) * 1.9;
    console.log('🔴 Band 5: Very Poor emotional discipline (score = 2.0-3.9)');
  }
  
  // Bonus: +1.0 if Positive emotions correlate with >70% wins
  if (positiveEmotionWinCorrelation > 70) {
    score += 1.0;
    console.log(`🎁 Bonus: +1.0 for positive emotion win correlation (${positiveEmotionWinCorrelation.toFixed(1)}%)`);
  }
  
  const finalScore = Math.min(10.0, Math.max(0, score));
  console.log(`\n📊 Final Emotional Discipline Score: ${finalScore.toFixed(1)}/10`);
  
  return finalScore;
}

// Function to analyze emotional data patterns
async function analyzeEmotionalPatterns() {
  console.log('\n📊 Analyzing Emotional Data Patterns...');
  
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
      console.log('⚠️ No trades found for analysis');
      return;
    }
    
    console.log(`📈 Analyzing ${allTrades.length} trades...`);
    
    // Analyze emotional data distribution
    const emotionDistribution = {};
    const emotionByPnL = { positive: {}, negative: {} };
    let tradesWithEmotions = 0;
    let totalPnL = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    
    allTrades.forEach(trade => {
      const pnl = trade.pnl || 0;
      totalPnL += pnl;
      
      if (pnl > 0) winningTrades++;
      else if (pnl < 0) losingTrades++;
      
      const emotionalState = parseEmotionalState(trade.emotional_state);
      if (!emotionalState) return;
      
      tradesWithEmotions++;
      
      const primaryEmotion = emotionalState.primary_emotion?.toUpperCase();
      const secondaryEmotion = emotionalState.secondary_emotion?.toUpperCase();
      
      // Track emotion distribution
      [primaryEmotion, secondaryEmotion].forEach(emotion => {
        if (emotion && emotion.trim()) {
          emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
          
          // Track emotions by P&L outcome
          const pnlCategory = pnl > 0 ? 'positive' : 'negative';
          if (emotionByPnL[pnlCategory]) {
            emotionByPnL[pnlCategory][emotion] = (emotionByPnL[pnlCategory][emotion] || 0) + 1;
          }
        }
      });
    });
    
    // Calculate basic metrics
    const winRate = (winningTrades / allTrades.length) * 100;
    const emotionCoverage = (tradesWithEmotions / allTrades.length) * 100;
    
    console.log('\n📊 Trading Performance Summary:');
    console.log('==================================');
    console.log(`Total Trades: ${allTrades.length}`);
    console.log(`Total P&L: $${totalPnL.toFixed(2)}`);
    console.log(`Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`Winning Trades: ${winningTrades}`);
    console.log(`Losing Trades: ${losingTrades}`);
    console.log(`Trades with Emotional Data: ${tradesWithEmotions} (${emotionCoverage.toFixed(1)}%)`);
    
    console.log('\n🎭 Emotion Distribution:');
    console.log('===========================');
    Object.entries(emotionDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([emotion, count]) => {
        const percentage = (count / tradesWithEmotions) * 100;
        console.log(`${emotion}: ${count} occurrences (${percentage.toFixed(1)}%)`);
      });
    
    console.log('\n📈 Emotions by Trade Outcome:');
    console.log('===============================');
    
    console.log('\n😊 Emotions in Winning Trades:');
    if (Object.keys(emotionByPnL.positive).length > 0) {
      Object.entries(emotionByPnL.positive)
        .sort(([,a], [,b]) => b - a)
        .forEach(([emotion, count]) => {
          const percentage = (count / winningTrades) * 100;
          console.log(`  ${emotion}: ${count} times (${percentage.toFixed(1)}% of winning trades)`);
        });
    } else {
      console.log('  No emotions found in winning trades');
    }
    
    console.log('\n😔 Emotions in Losing Trades:');
    if (Object.keys(emotionByPnL.negative).length > 0) {
      Object.entries(emotionByPnL.negative)
        .sort(([,a], [,b]) => b - a)
        .forEach(([emotion, count]) => {
          const percentage = (count / losingTrades) * 100;
          console.log(`  ${emotion}: ${count} times (${percentage.toFixed(1)}% of losing trades)`);
        });
    } else {
      console.log('  No emotions found in losing trades');
    }
    
    // Calculate emotional discipline metrics and score
    const metrics = calculateEmotionalDisciplineMetrics(allTrades);
    const emotionalDisciplineScore = calculateEmotionalDisciplineScore(metrics);
    
    console.log('\n🎯 Emotional Discipline Analysis:');
    console.log('==================================');
    console.log(`Total Emotions Logged: ${metrics.totalEmotions}`);
    console.log(`Positive Emotions: ${metrics.positiveEmotions} (${metrics.positiveEmotionPercentage.toFixed(1)}%)`);
    console.log(`Negative Emotions: ${metrics.negativeEmotions} (${((metrics.negativeEmotions/metrics.totalEmotions)*100).toFixed(1)}%)`);
    console.log(`Negative Impact Losses: ${metrics.negativeImpactLosses}/${metrics.negativeEmotions} (${metrics.negativeImpactPercentage.toFixed(1)}%)`);
    console.log(`Positive Emotion Wins: ${metrics.positiveEmotionWins}/${metrics.positiveEmotionTrades} (${metrics.positiveEmotionWinCorrelation.toFixed(1)}%)`);
    console.log(`Emotion Logging Completeness: ${metrics.emotionLoggingCompleteness.toFixed(1)}%`);
    console.log(`Final Emotional Discipline Score: ${emotionalDisciplineScore.toFixed(1)}/10`);
    
    // Identify potential issues
    console.log('\n🔍 POTENTIAL ISSUES IDENTIFIED:');
    console.log('==================================');
    
    if (metrics.positiveEmotionPercentage < 50) {
      console.log('⚠️  ISSUE: Low positive emotion percentage (<50%)');
      console.log('   This heavily penalizes the emotional discipline score');
    }
    
    if (metrics.negativeImpactPercentage > 30) {
      console.log('⚠️  ISSUE: High negative impact percentage (>30%)');
      console.log('   This indicates negative emotions are correlated with losses');
    }
    
    if (metrics.negativeEmotions > metrics.positiveEmotions) {
      console.log('⚠️  ISSUE: More negative emotions than positive emotions');
      console.log('   This creates a bias toward lower scores');
    }
    
    if (totalPnL > 0 && emotionalDisciplineScore < 5.0) {
      console.log('⚠️  CRITICAL ISSUE: Profitable account with low emotional discipline score');
      console.log('   This suggests the scoring system is too punitive');
    }
    
    // Analysis of scoring fairness
    console.log('\n🎯 SCORING SYSTEM ANALYSIS:');
    console.log('=============================');
    
    console.log('\n📊 Current Scoring Bands:');
    console.log('  Band 1 (10.0): >90% positive, <10% negative impact');
    console.log('  Band 2 (8.0-9.9): 70-90% positive, 10-20% negative impact');
    console.log('  Band 3 (6.0-7.9): 50-70% positive, 20-30% negative impact');
    console.log('  Band 4 (4.0-5.9): 30-50% positive, 30-50% negative impact');
    console.log('  Band 5 (2.0-3.9): Everything else');
    
    console.log('\n🤔 POTENTIAL PROBLEMS:');
    console.log('1. Too strict requirements for high scores (>90% positive emotions)');
    console.log('2. Negative emotions in losing trades double-penalize the score');
    console.log('3. Normal emotional responses to trading (anxiety, fear) are treated as "negative"');
    console.log('4. No consideration for overall trading performance');
    console.log('5. Steady profitable trading can still get low scores due to emotional honesty');
    
    return {
      totalTrades: allTrades.length,
      totalPnL,
      winRate,
      emotionCoverage,
      emotionalDisciplineScore,
      metrics,
      emotionDistribution,
      isProfitable: totalPnL > 0,
      hasLowEmotionalScore: emotionalDisciplineScore < 5.0
    };
    
  } catch (error) {
    console.error('❌ Error analyzing emotional patterns:', error.message);
    return null;
  }
}

// Main diagnosis function
async function main() {
  try {
    console.log('🚀 Starting Emotional Discipline Scoring Diagnosis...\n');
    
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Analyze emotional patterns
    const analysisResults = await analyzeEmotionalPatterns();
    
    if (analysisResults) {
      console.log('\n📋 DIAGNOSIS SUMMARY');
      console.log('====================');
      
      console.log('\n🎯 KEY FINDINGS:');
      console.log(`- Account is ${analysisResults.isProfitable ? 'PROFITABLE' : 'NOT PROFITABLE'} ($${analysisResults.totalPnL.toFixed(2)})`);
      console.log(`- Win Rate: ${analysisResults.winRate.toFixed(1)}%`);
      console.log(`- Emotional Discipline Score: ${analysisResults.emotionalDisciplineScore.toFixed(1)}/10`);
      console.log(`- Emotion Coverage: ${analysisResults.emotionCoverage.toFixed(1)}%`);
      
      if (analysisResults.isProfitable && analysisResults.hasLowEmotionalScore) {
        console.log('\n🚨 PRIMARY ISSUE CONFIRMED:');
        console.log('Profitable trading account is receiving low emotional discipline score!');
        console.log('\n🔍 ROOT CAUSES:');
        console.log('1. Negative emotions are heavily penalized in scoring');
        console.log('2. Normal emotional responses (ANXIOUS, FEAR) treated as "negative"');
        console.log('3. High threshold for positive emotions (>90% required for top scores)');
        console.log('4. No consideration for overall trading profitability');
        console.log('5. Emotional honesty in logging leads to lower scores');
        
        console.log('\n💡 RECOMMENDED FIXES:');
        console.log('1. Adjust scoring bands to be more realistic');
        console.log('2. Reduce negative emotion penalties');
        console.log('3. Consider overall profitability in emotional scoring');
        console.log('4. Treat some emotions as "neutral" rather than negative');
        console.log('5. Add bonus for profitable trading despite emotional challenges');
      }
    }
    
    console.log('\n✅ Emotional Discipline Scoring Diagnosis Complete');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR during diagnosis:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Execute script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main, analyzeEmotionalPatterns, calculateEmotionalDisciplineScore };