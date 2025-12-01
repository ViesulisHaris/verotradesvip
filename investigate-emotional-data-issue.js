const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 INVESTIGATING EMOTIONAL DATA ISSUE');
console.log('=====================================');

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

// Authenticate function
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

// Function to check sample trades
async function checkSampleTrades() {
  console.log('\n📊 Checking sample trades for emotional data...');
  
  try {
    // Get the 5 most recent trades
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching trades:', error.message);
      throw error;
    }
    
    if (!trades || trades.length === 0) {
      console.log('⚠️  No trades found');
      return;
    }
    
    console.log(`\n📋 Examining ${trades.length} most recent trades:`);
    
    trades.forEach((trade, index) => {
      console.log(`\n--- Trade ${index + 1} ---`);
      console.log(`ID: ${trade.id}`);
      console.log(`Symbol: ${trade.symbol}`);
      console.log(`Market: ${trade.market}`);
      console.log(`P&L: $${trade.pnl}`);
      console.log(`Strategy ID: ${trade.strategy_id}`);
      console.log(`Emotional State: ${JSON.stringify(trade.emotional_state, null, 2)}`);
      console.log(`Notes: ${trade.notes}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to check sample trades:', error);
    throw error;
  }
}

// Function to check if the emotional_state column exists and is properly structured
async function checkTableStructure() {
  console.log('\n🔍 Checking table structure for emotional_state column...');
  
  try {
    // Check a trade with a known ID to see the column structure
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('*')
      .eq('user_id', currentUserId)
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching trades:', error.message);
      throw error;
    }
    
    if (!trades || trades.length === 0) {
      console.log('⚠️  No trades found to check structure');
      return;
    }
    
    const trade = trades[0];
    console.log('\n📋 Trade table columns:');
    Object.keys(trade).forEach(key => {
      console.log(`  - ${key}: ${typeof trade[key]} (${Array.isArray(trade[key]) ? 'array' : 'not array'})`);
      if (key === 'emotional_state') {
        console.log(`    Value: ${JSON.stringify(trade[key])}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to check table structure:', error);
    throw error;
  }
}

// Main execution function
async function main() {
  try {
    // Authenticate
    await authenticate();
    
    // Check table structure
    await checkTableStructure();
    
    // Check sample trades
    await checkSampleTrades();
    
    console.log('\n🎉 INVESTIGATION COMPLETED');
    console.log('=====================================');
    
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

module.exports = { main };