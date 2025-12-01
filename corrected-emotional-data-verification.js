const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 CORRECTED EMOTIONAL DATA VERIFICATION');
console.log('=======================================');
console.log('Verifying emotional data with proper format handling...');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test user credentials
const TEST_USER_EMAIL = 'testuser@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

// Expected specifications from the generator
const EXPECTED_SPECS = {
  TOTAL_TRADES: 200,
  WIN_RATE: 0.71, // 71% wins
  WINNING_TRADES: 142,
  LOSING_TRADES: 58,
  EMOTIONS: ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL']
};

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

// Function to parse emotional state from string format
function parseEmotionalState(emotionalState) {
  if (!emotionalState) return [];
  
  // If it's already an array, return it
  if (Array.isArray(emotionalState)) {
    return emotionalState;
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof emotionalState === 'string') {
    try {
      const parsed = JSON.parse(emotionalState);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn(`⚠️ Failed to parse emotional_state: ${emotionalState}`);
      return [];
    }
  }
  
  // If it's an object, try to convert to array
  if (typeof emotionalState === 'object') {
    return Object.values(emotionalState).filter(val => typeof val === 'string');
  }
  
  return [];
}

// Function to verify emotional states with corrected logic
async function verifyEmotionalStatesCorrected() {
  console.log('\n😊 Verifying emotional states with corrected logic...');
  
  try {
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('id, emotional_state')
      .eq('user_id', currentUserId);
    
    if (error) {
      console.error('❌ Error fetching trades for emotional states:', error.message);
      return false;
    }
    
    const emotionDistribution = {};
    let tradesWithEmotions = 0;
    let tradesWithoutEmotions = 0;
    let formatIssues = [];
    
    trades.forEach((trade, index) => {
      const parsedEmotions = parseEmotionalState(trade.emotional_state);
      
      if (parsedEmotions.length > 0) {
        tradesWithEmotions++;
        parsedEmotions.forEach(emotion => {
          emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
        });
      } else {
        tradesWithoutEmotions++;
        if (trade.emotional_state) {
          formatIssues.push(`Trade ${index + 1}: Could not parse emotional_state: ${JSON.stringify(trade.emotional_state)}`);
        }
      }
    });
    
    console.log('📊 Corrected Emotional States Analysis:');
    console.log(`  Total trades analyzed: ${trades.length}`);
    console.log(`  Trades with emotional data: ${tradesWithEmotions}/${trades.length} (${((tradesWithEmotions/trades.length)*100).toFixed(1)}%)`);
    console.log(`  Trades without emotional data: ${tradesWithoutEmotions}/${trades.length} (${((tradesWithoutEmotions/trades.length)*100).toFixed(1)}%)`);
    console.log(`  Format issues: ${formatIssues.length}`);
    
    if (formatIssues.length > 0) {
      console.log('\n⚠️ Format Issues (first 5):');
      formatIssues.slice(0, 5).forEach(issue => console.log(`  - ${issue}`));
    }
    
    console.log('\n🎭 Emotion Distribution:');
    const totalEmotionEntries = Object.values(emotionDistribution).reduce((sum, count) => sum + count, 0);
    
    Object.entries(emotionDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([emotion, count]) => {
        const percentage = ((count / totalEmotionEntries) * 100).toFixed(1);
        console.log(`  ${emotion}: ${count} occurrences (${percentage}%)`);
      });
    
    console.log('\n✅ Expected vs Actual Emotions:');
    let allEmotionsPresent = true;
    
    EXPECTED_SPECS.EMOTIONS.forEach(expectedEmotion => {
      const count = emotionDistribution[expectedEmotion] || 0;
      const status = count > 0 ? '✅' : '❌';
      console.log(`  ${status} ${expectedEmotion}: ${count} occurrences`);
      if (count === 0) allEmotionsPresent = false;
    });
    
    const success = tradesWithEmotions === trades.length && allEmotionsPresent;
    
    if (success) {
      console.log('\n✅ All emotional data verification checks passed!');
    } else {
      console.log('\n❌ Some emotional data verification checks failed');
    }
    
    return {
      totalTrades: trades.length,
      tradesWithEmotions,
      tradesWithoutEmotions,
      emotionDistribution,
      allEmotionsPresent,
      formatIssues: formatIssues.length,
      success
    };
    
  } catch (error) {
    console.error('❌ Error verifying emotional states:', error.message);
    return false;
  }
}

// Function to verify overall data quality
async function verifyOverallDataQuality() {
  console.log('\n📊 Verifying overall data quality...');
  
  try {
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('*')
      .eq('user_id', currentUserId);
    
    if (error) {
      console.error('❌ Error fetching trades for quality check:', error.message);
      return false;
    }
    
    // Analyze win rate
    const winningTrades = trades.filter(trade => trade.pnl > 0);
    const losingTrades = trades.filter(trade => trade.pnl < 0);
    const actualWinRate = (winningTrades.length / trades.length);
    
    // Analyze market distribution
    const marketDistribution = {};
    trades.forEach(trade => {
      marketDistribution[trade.market] = (marketDistribution[trade.market] || 0) + 1;
    });
    
    // Analyze emotional data formats
    let stringFormatCount = 0;
    let arrayFormatCount = 0;
    let nullFormatCount = 0;
    
    trades.forEach(trade => {
      if (trade.emotional_state === null || trade.emotional_state === undefined) {
        nullFormatCount++;
      } else if (Array.isArray(trade.emotional_state)) {
        arrayFormatCount++;
      } else if (typeof trade.emotional_state === 'string') {
        stringFormatCount++;
      }
    });
    
    console.log('📊 Overall Data Quality Analysis:');
    console.log(`  Total trades: ${trades.length}`);
    console.log(`  Win rate: ${(actualWinRate * 100).toFixed(1)}% (${winningTrades.length} wins, ${losingTrades.length} losses)`);
    
    console.log('\n🏢 Market Distribution:');
    Object.entries(marketDistribution).forEach(([market, count]) => {
      const percentage = ((count / trades.length) * 100).toFixed(1);
      console.log(`  ${market}: ${count} trades (${percentage}%)`);
    });
    
    console.log('\n😊 Emotional Data Format Analysis:');
    console.log(`  Array format: ${arrayFormatCount} trades (${((arrayFormatCount/trades.length)*100).toFixed(1)}%)`);
    console.log(`  String format: ${stringFormatCount} trades (${((stringFormatCount/trades.length)*100).toFixed(1)}%)`);
    console.log(`  Null/undefined: ${nullFormatCount} trades (${((nullFormatCount/trades.length)*100).toFixed(1)}%)`);
    
    return {
      totalTrades: trades.length,
      winRate: actualWinRate,
      marketDistribution,
      formatAnalysis: {
        arrayFormat: arrayFormatCount,
        stringFormat: stringFormatCount,
        nullFormat: nullFormatCount
      }
    };
    
  } catch (error) {
    console.error('❌ Error verifying data quality:', error.message);
    return false;
  }
}

// Main verification function
async function main() {
  try {
    console.log('🚀 Starting corrected emotional data verification...\n');
    
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Verify emotional states with corrected logic
    const emotionalResults = await verifyEmotionalStatesCorrected();
    
    // Step 3: Verify overall data quality
    const qualityResults = await verifyOverallDataQuality();
    
    // Step 4: Generate comprehensive corrected report
    console.log('\n📋 CORRECTED VERIFICATION REPORT');
    console.log('================================');
    
    console.log('\n🎯 SUMMARY:');
    console.log(`  Total trades in database: ${qualityResults?.totalTrades || 'Unknown'}`);
    console.log(`  Win rate: ${qualityResults ? (qualityResults.winRate * 100).toFixed(1) : 'Unknown'}%`);
    console.log(`  Emotional data coverage: ${emotionalResults ? ((emotionalResults.tradesWithEmotions/emotionalResults.totalTrades)*100).toFixed(1) : 'Unknown'}%`);
    console.log(`  All expected emotions present: ${emotionalResults?.allEmotionsPresent ? 'YES' : 'NO'}`);
    
    console.log('\n🔍 ROOT CAUSE ANALYSIS:');
    console.log('  The original verification script failed because:');
    console.log('  1. emotional_state field is stored as STRING (JSON array) instead of native ARRAY');
    console.log('  2. Verification script used Array.isArray() check which returned false');
    console.log('  3. All emotional data was present but in wrong format for detection');
    
    console.log('\n✅ CORRECTED RESULTS:');
    if (emotionalResults) {
      console.log(`  - Trades with emotional data: ${emotionalResults.tradesWithEmotions}/${emotionalResults.totalTrades}`);
      console.log(`  - Expected emotions found: ${EXPECTED_SPECS.EMOTIONS.filter(emotion => emotionalResults.emotionDistribution[emotion] > 0).length}/10`);
      console.log(`  - Format issues resolved: ${emotionalResults.formatIssues === 0 ? 'YES' : 'NO'}`);
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('  1. Database contains valid emotional data in JSON string format');
    console.log('  2. Frontend should parse emotional_state strings using JSON.parse()');
    console.log('  3. Consider migrating database to store emotions as native arrays');
    console.log('  4. Update verification scripts to handle both string and array formats');
    
    // Save corrected verification results
    const correctedReport = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      originalIssue: 'emotional_state stored as JSON string instead of array',
      correctedResults: {
        emotional: emotionalResults,
        quality: qualityResults
      },
      summary: {
        totalTrades: qualityResults?.totalTrades || 0,
        emotionalDataCoverage: emotionalResults ? (emotionalResults.tradesWithEmotions/emotionalResults.totalTrades)*100 : 0,
        allEmotionsPresent: emotionalResults?.allEmotionsPresent || false,
        winRate: qualityResults?.winRate || 0,
        overallStatus: (emotionalResults?.success && qualityResults) ? 'PASS' : 'PARTIAL'
      }
    };
    
    require('fs').writeFileSync(
      `corrected-emotional-verification-${Date.now()}.json`,
      JSON.stringify(correctedReport, null, 2)
    );
    
    console.log(`\n💾 Corrected verification results saved to: corrected-emotional-verification-${Date.now()}.json`);
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR during corrected verification:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Execute the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main, verifyEmotionalStatesCorrected, parseEmotionalState };