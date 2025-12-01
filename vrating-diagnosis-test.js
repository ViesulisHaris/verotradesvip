const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import VRating calculation functions
const { calculateVRating } = require('./src/lib/vrating-calculations.ts');

console.log('🔍 VRATING DIAGNOSIS TEST');
console.log('==========================');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_USER_EMAIL = 'testuser@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runDiagnosisTest() {
  try {
    console.log('\n🔐 Authenticating...');
    
    // Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }
    
    if (!authData.session) {
      console.error('❌ No session obtained');
      return;
    }
    
    // Create authenticated client
    const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });
    
    console.log('✅ Authenticated successfully');
    
    // Fetch trades
    console.log('\n📊 Fetching trades...');
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('*')
      .eq('user_id', authData.session.user.id);
    
    if (error) {
      console.error('❌ Error fetching trades:', error.message);
      return;
    }
    
    if (!trades || trades.length === 0) {
      console.log('⚠️  No trades found');
      return;
    }
    
    console.log(`✅ Found ${trades.length} trades`);
    
    // Analyze P&L distribution
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const largeLosses = trades.filter(t => t.pnl < -5);
    const veryLargeLosses = trades.filter(t => t.pnl < -50);
    
    console.log('\n📈 P&L Analysis:');
    console.log(`  Total P&L: $${trades.reduce((sum, t) => sum + t.pnl, 0).toFixed(2)}`);
    console.log(`  Win Rate: ${((winningTrades.length / trades.length) * 100).toFixed(1)}%`);
    console.log(`  Winning Trades: ${winningTrades.length}`);
    console.log(`  Losing Trades: ${losingTrades.length}`);
    console.log(`  Large Losses (< -$5): ${largeLosses.length} (${((largeLosses.length / trades.length) * 100).toFixed(1)}%)`);
    console.log(`  Very Large Losses (< -$50): ${veryLargeLosses.length} (${((veryLargeLosses.length / trades.length) * 100).toFixed(1)}%)`);
    
    console.log('\n💰 Loss Distribution:');
    const lossRanges = [
      { min: -5, max: 0, label: 'Small losses (-$5 to $0)' },
      { min: -25, max: -5, label: 'Medium losses (-$25 to -$5)' },
      { min: -50, max: -25, label: 'Large losses (-$50 to -$25)' },
      { min: -100, max: -50, label: 'Very large losses (-$100 to -$50)' },
      { min: -Infinity, max: -100, label: 'Huge losses (< -$100)' }
    ];
    
    lossRanges.forEach(range => {
      const count = losingTrades.filter(t => t.pnl >= range.min && t.pnl < range.max).length;
      const percentage = ((count / trades.length) * 100).toFixed(1);
      console.log(`  ${range.label}: ${count} trades (${percentage}%)`);
    });
    
    // Calculate VRating with debug logging
    console.log('\n🎯 Calculating VRating with debug logging...');
    console.log('=====================================');
    
    const vratingResult = calculateVRating(trades);
    
    console.log('\n📊 VRating Results:');
    console.log(`  Overall Rating: ${vratingResult.overallRating}`);
    console.log('  Category Scores:');
    console.log(`    Profitability: ${vratingResult.categoryScores.profitability}`);
    console.log(`    Risk Management: ${vratingResult.categoryScores.riskManagement}`);
    console.log(`    Consistency: ${vratingResult.categoryScores.consistency}`);
    console.log(`    Emotional Discipline: ${vratingResult.categoryScores.emotionalDiscipline}`);
    console.log(`    Journaling Adherence: ${vratingResult.categoryScores.journalingAdherence}`);
    
    console.log('\n🔍 Diagnosis Summary:');
    console.log('=======================');
    
    if (vratingResult.categoryScores.riskManagement < 4.0) {
      console.log('❌ RISK MANAGEMENT SCORE IS VERY LOW (< 4.0)');
      console.log('   This confirms our diagnosis: The large loss threshold of -$5 is too restrictive');
      console.log(`   With ${largeLosses.length} losses > $5 out of ${trades.length} trades (${((largeLosses.length / trades.length) * 100).toFixed(1)}%),`);
      console.log('   the system is penalizing normal trading losses as "large losses"');
      console.log('   RECOMMENDATION: Change threshold from -$5 to -$50');
    }
    
    if (vratingResult.overallRating < 6.0 && vratingResult.categoryScores.profitability > 7.0) {
      console.log('❌ OVERALL VRATING DRAGGED DOWN BY RISK MANAGEMENT');
      console.log('   Despite good profitability, overall rating is low due to risk management penalties');
      console.log('   This confirms the risk management scoring is overly punitive for profitable accounts');
    }
    
    console.log('\n✅ Diagnosis complete! Check console logs above for detailed debug information.');
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
runDiagnosisTest();