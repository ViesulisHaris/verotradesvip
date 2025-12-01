const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 COMPREHENSIVE EMOTIONAL DATA INVESTIGATION');
console.log('============================================');
console.log('Investigating database schema and emotional data structure...');

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

// Function to investigate database schema for emotional_state
async function investigateDatabaseSchema() {
  console.log('\n🏗️ Investigating database schema for emotional_state field...');
  
  try {
    // Method 1: Query information_schema.columns for emotional_state
    console.log('\n📋 Method 1: Querying information_schema.columns...');
    const { data: columns, error: columnsError } = await authSupabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'trades')
      .eq('table_schema', 'public')
      .ilike('column_name', '%emotion%');
    
    if (columnsError) {
      console.error('❌ Error querying information_schema:', columnsError.message);
    } else {
      console.log('📊 Emotional-related columns found:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // Method 2: Try to describe the trades table directly
    console.log('\n📋 Method 2: Direct table structure query...');
    const { data: tableInfo, error: tableError } = await authSupabase
      .from('trades')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error querying trades table:', tableError.message);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log('📊 Columns in trades table (from sample data):');
      Object.keys(tableInfo[0]).forEach(key => {
        const value = tableInfo[0][key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        console.log(`  - ${key}: ${type} = ${JSON.stringify(value)}`);
      });
    }
    
    // Method 3: Try RPC to get table definition
    console.log('\n📋 Method 3: RPC approach to get table definition...');
    try {
      const { data: rpcResult, error: rpcError } = await authSupabase.rpc('get_table_definition', {
        table_name: 'trades'
      });
      
      if (rpcError) {
        console.log('⚠️ RPC not available or failed:', rpcError.message);
      } else {
        console.log('📊 RPC table definition:', rpcResult);
      }
    } catch (rpcErr) {
      console.log('⚠️ RPC method not available');
    }
    
  } catch (error) {
    console.error('❌ Error investigating database schema:', error.message);
  }
}

// Function to sample trades and examine emotional data format
async function sampleTradesForEmotionalData() {
  console.log('\n🔍 Sampling trades to examine emotional data format...');
  
  try {
    // Get a sample of 10 trades
    const { data: sampleTrades, error: sampleError } = await authSupabase
      .from('trades')
      .select('*')
      .eq('user_id', currentUserId)
      .limit(10);
    
    if (sampleError) {
      console.error('❌ Error sampling trades:', sampleError.message);
      return;
    }
    
    if (!sampleTrades || sampleTrades.length === 0) {
      console.log('⚠️ No trades found for sampling');
      return;
    }
    
    console.log(`📊 Analyzing ${sampleTrades.length} sample trades:`);
    
    sampleTrades.forEach((trade, index) => {
      console.log(`\n--- Trade ${index + 1} (ID: ${trade.id}) ---`);
      console.log(`Symbol: ${trade.symbol}`);
      console.log(`P&L: $${trade.pnl}`);
      
      // Check emotional_state field specifically
      if (trade.emotional_state !== undefined && trade.emotional_state !== null) {
        console.log(`emotional_state type: ${Array.isArray(trade.emotional_state) ? 'array' : typeof trade.emotional_state}`);
        console.log(`emotional_state value: ${JSON.stringify(trade.emotional_state)}`);
        
        if (Array.isArray(trade.emotional_state)) {
          console.log(`emotional_state length: ${trade.emotional_state.length}`);
          trade.emotional_state.forEach((emotion, i) => {
            console.log(`  [${i}]: ${emotion} (type: ${typeof emotion})`);
          });
        }
      } else {
        console.log('emotional_state: NULL or UNDEFINED');
      }
      
      // Check for other emotion-related fields
      Object.keys(trade).forEach(key => {
        if (key.toLowerCase().includes('emotion') && key !== 'emotional_state') {
          console.log(`Additional emotion field ${key}: ${JSON.stringify(trade[key])}`);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error sampling trades:', error.message);
  }
}

// Function to analyze all 200 trades comprehensively
async function analyzeAllTrades() {
  console.log('\n📊 Analyzing all trades in database...');
  
  try {
    // Get total count first
    const { count: totalCount, error: countError } = await authSupabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId);
    
    if (countError) {
      console.error('❌ Error getting total trade count:', countError.message);
      return;
    }
    
    console.log(`📈 Total trades found: ${totalCount}`);
    
    // Get all trades with emotional_state field specifically
    const { data: allTrades, error: allTradesError } = await authSupabase
      .from('trades')
      .select('id, symbol, pnl, emotional_state')
      .eq('user_id', currentUserId);
    
    if (allTradesError) {
      console.error('❌ Error fetching all trades:', allTradesError.message);
      return;
    }
    
    if (!allTrades || allTrades.length === 0) {
      console.log('⚠️ No trades found for analysis');
      return;
    }
    
    console.log(`📊 Analyzing ${allTrades.length} trades for emotional data...`);
    
    // Analyze emotional data presence
    let tradesWithEmotions = 0;
    let tradesWithoutEmotions = 0;
    let totalEmotionEntries = 0;
    const emotionDistribution = {};
    const emotionTypes = new Set();
    
    allTrades.forEach((trade, index) => {
      if (trade.emotional_state !== undefined && trade.emotional_state !== null) {
        tradesWithEmotions++;
        
        if (Array.isArray(trade.emotional_state)) {
          totalEmotionEntries += trade.emotional_state.length;
          trade.emotional_state.forEach(emotion => {
            emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
            emotionTypes.add(emotion);
          });
        } else {
          // Handle non-array emotional_state
          console.log(`⚠️ Trade ${index + 1}: emotional_state is not an array: ${typeof trade.emotional_state} = ${JSON.stringify(trade.emotional_state)}`);
          emotionTypes.add('NON_ARRAY_FORMAT');
        }
      } else {
        tradesWithoutEmotions++;
      }
    });
    
    // Calculate win rate
    const winningTrades = allTrades.filter(trade => trade.pnl > 0);
    const losingTrades = allTrades.filter(trade => trade.pnl < 0);
    const winRate = (winningTrades.length / allTrades.length) * 100;
    
    console.log('\n📊 COMPREHENSIVE ANALYSIS RESULTS:');
    console.log('====================================');
    
    console.log('\n📈 Trade Count Analysis:');
    console.log(`  Total trades: ${allTrades.length}`);
    console.log(`  Winning trades: ${winningTrades.length} (${winRate.toFixed(1)}%)`);
    console.log(`  Losing trades: ${losingTrades.length} (${(100 - winRate).toFixed(1)}%)`);
    
    console.log('\n😊 Emotional Data Analysis:');
    console.log(`  Trades with emotional data: ${tradesWithEmotions}/${allTrades.length} (${((tradesWithEmotions/allTrades.length)*100).toFixed(1)}%)`);
    console.log(`  Trades without emotional data: ${tradesWithoutEmotions}/${allTrades.length} (${((tradesWithoutEmotions/allTrades.length)*100).toFixed(1)}%)`);
    console.log(`  Total emotion entries: ${totalEmotionEntries}`);
    console.log(`  Average emotions per trade: ${(totalEmotionEntries / tradesWithEmotions).toFixed(2)}`);
    
    console.log('\n🎭 Emotion Distribution:');
    Object.entries(emotionDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([emotion, count]) => {
        const percentage = ((count / totalEmotionEntries) * 100).toFixed(1);
        console.log(`  ${emotion}: ${count} occurrences (${percentage}%)`);
      });
    
    console.log('\n🏷️ Unique Emotion Types Found:');
    Array.from(emotionTypes).sort().forEach(emotion => {
      console.log(`  - ${emotion}`);
    });
    
    // Expected emotions from generator
    const expectedEmotions = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
    
    console.log('\n✅ Expected vs Actual Emotions:');
    expectedEmotions.forEach(expectedEmotion => {
      const actualCount = emotionDistribution[expectedEmotion] || 0;
      const status = actualCount > 0 ? '✅' : '❌';
      console.log(`  ${status} ${expectedEmotion}: ${actualCount} occurrences`);
    });
    
    return {
      totalTrades: allTrades.length,
      tradesWithEmotions,
      tradesWithoutEmotions,
      winRate,
      emotionDistribution,
      emotionTypes: Array.from(emotionTypes),
      expectedEmotionsPresent: expectedEmotions.filter(emotion => emotionDistribution[emotion] > 0).length
    };
    
  } catch (error) {
    console.error('❌ Error analyzing all trades:', error.message);
    return null;
  }
}

// Function to identify why verification script failed
async function diagnoseVerificationFailure() {
  console.log('\n🔬 Diagnosing why verification script failed to detect emotional data...');
  
  try {
    // Replicate the exact query from verification script
    console.log('\n📋 Replicating verification script query...');
    const { data: verificationTrades, error: verificationError } = await authSupabase
      .from('trades')
      .select('emotional_state')
      .eq('user_id', currentUserId);
    
    if (verificationError) {
      console.error('❌ Error with verification query:', verificationError.message);
      return;
    }
    
    console.log(`📊 Verification query returned ${verificationTrades.length} trades`);
    
    // Analyze using the same logic as verification script
    const emotionDistribution = {};
    let tradesWithEmotions = 0;
    let issuesFound = [];
    
    verificationTrades.forEach((trade, index) => {
      console.log(`\n--- Verification Analysis ${index + 1} ---`);
      console.log(`emotional_state: ${JSON.stringify(trade.emotional_state)}`);
      console.log(`Array.isArray check: ${Array.isArray(trade.emotional_state)}`);
      console.log(`Truthy check: ${!!trade.emotional_state}`);
      
      if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
        tradesWithEmotions++;
        trade.emotional_state.forEach(emotion => {
          emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
        });
        console.log(`✅ Trade counted as having emotions`);
      } else {
        console.log(`❌ Trade NOT counted as having emotions`);
        if (trade.emotional_state === null) {
          issuesFound.push(`Trade ${index + 1}: emotional_state is null`);
        } else if (trade.emotional_state === undefined) {
          issuesFound.push(`Trade ${index + 1}: emotional_state is undefined`);
        } else if (!Array.isArray(trade.emotional_state)) {
          issuesFound.push(`Trade ${index + 1}: emotional_state is not an array (type: ${typeof trade.emotional_state})`);
        } else {
          issuesFound.push(`Trade ${index + 1}: emotional_state failed truthy check`);
        }
      }
    });
    
    console.log('\n📊 Verification Analysis Results:');
    console.log(`  Trades with emotions (verification logic): ${tradesWithEmotions}/${verificationTrades.length}`);
    console.log(`  Unique emotions found: ${Object.keys(emotionDistribution).length}`);
    
    if (issuesFound.length > 0) {
      console.log('\n❌ Issues Found:');
      issuesFound.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
      if (issuesFound.length > 10) {
        console.log(`  ... and ${issuesFound.length - 10} more issues`);
      }
    }
    
    return {
      totalTrades: verificationTrades.length,
      tradesWithEmotions,
      emotionDistribution,
      issuesFound
    };
    
  } catch (error) {
    console.error('❌ Error diagnosing verification failure:', error.message);
    return null;
  }
}

// Main investigation function
async function main() {
  try {
    console.log('🚀 Starting comprehensive emotional data investigation...\n');
    
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Investigate database schema
    await investigateDatabaseSchema();
    
    // Step 3: Sample trades to examine emotional data format
    await sampleTradesForEmotionalData();
    
    // Step 4: Analyze all trades comprehensively
    const analysisResults = await analyzeAllTrades();
    
    // Step 5: Diagnose verification failure
    const diagnosisResults = await diagnoseVerificationFailure();
    
    // Step 6: Generate comprehensive report
    console.log('\n📋 COMPREHENSIVE INVESTIGATION REPORT');
    console.log('=====================================');
    
    console.log('\n🔍 KEY FINDINGS:');
    
    if (analysisResults) {
      console.log(`\n📊 Database State:`);
      console.log(`  - Total trades: ${analysisResults.totalTrades}`);
      console.log(`  - Trades with emotional data: ${analysisResults.tradesWithEmotions} (${((analysisResults.tradesWithEmotions/analysisResults.totalTrades)*100).toFixed(1)}%)`);
      console.log(`  - Win rate: ${analysisResults.winRate.toFixed(1)}%`);
      console.log(`  - Expected emotions present: ${analysisResults.expectedEmotionsPresent}/10`);
      
      if (analysisResults.tradesWithEmotions < analysisResults.totalTrades) {
        console.log(`\n⚠️  ISSUE DETECTED: Not all trades have emotional data!`);
        console.log(`  Missing emotional data on ${analysisResults.totalTrades - analysisResults.tradesWithEmotions} trades`);
      }
    }
    
    if (diagnosisResults) {
      console.log(`\n🔬 Verification Script Analysis:`);
      console.log(`  - Verification logic detected emotions in ${diagnosisResults.tradesWithEmotions}/${diagnosisResults.totalTrades} trades`);
      console.log(`  - Issues found: ${diagnosisResults.issuesFound.length}`);
      
      if (diagnosisResults.issuesFound.length > 0) {
        console.log(`\n❌ ROOT CAUSE IDENTIFIED:`);
        console.log(`  The verification script failed because ${diagnosisResults.issuesFound.length} trades have emotional data format issues.`);
        console.log(`  Primary issues: ${diagnosisResults.issuesFound.slice(0, 3).map(i => i.split(':')[1]).join(', ')}`);
      }
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('1. Check if emotional_state field is properly defined in database schema');
    console.log('2. Verify that all trades have emotional_state populated as arrays');
    console.log('3. Fix any trades with null/undefined/non-array emotional_state values');
    console.log('4. Update verification script to handle edge cases');
    
    // Save investigation results
    const investigationReport = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      analysisResults,
      diagnosisResults,
      summary: {
        totalTrades: analysisResults?.totalTrades || 0,
        emotionalDataCoverage: analysisResults ? (analysisResults.tradesWithEmotions/analysisResults.totalTrades)*100 : 0,
        verificationIssues: diagnosisResults?.issuesFound.length || 0,
        overallStatus: (analysisResults?.tradesWithEmotions === analysisResults?.totalTrades) ? 'PASS' : 'FAIL'
      }
    };
    
    require('fs').writeFileSync(
      `emotional-data-investigation-${Date.now()}.json`,
      JSON.stringify(investigationReport, null, 2)
    );
    
    console.log(`\n💾 Detailed investigation results saved to: emotional-data-investigation-${Date.now()}.json`);
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR during investigation:', error.message);
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

module.exports = { main, investigateDatabaseSchema, sampleTradesForEmotionalData, analyzeAllTrades };