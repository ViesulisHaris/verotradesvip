require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test user credentials
const TEST_USER_EMAIL = 'testuser@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

async function verifyEmotionalData() {
  console.log('🔍 Verifying emotional data in database...');
  
  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Authenticate
    console.log('\n📝 Step 1: Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }
    
    console.log('✅ Authentication successful');
    
    const userId = authData.user.id;
    console.log(`👤 User ID: ${userId}`);
    
    // Create authenticated client
    const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });
    
    // Check trades
    console.log('\n📊 Step 2: Checking trades...');
    const { data: tradesData, error: tradesError } = await authSupabase
      .from('trades')
      .select('id, pnl, strategy_id, emotional_state, market, symbol, trade_date')
      .eq('user_id', userId);
    
    if (tradesError) {
      console.error('❌ Failed to fetch trades:', tradesError.message);
      return;
    }
    
    const trades = tradesData || [];
    console.log(`📈 Found ${trades.length} trades`);
    
    if (trades.length === 0) {
      console.log('⚠️  WARNING: No trades found in database!');
      console.log('🔧 SOLUTION: Run test data generation first at /test-comprehensive-data');
      return;
    }
    
    // Check strategies
    console.log('\n📋 Step 3: Checking strategies...');
    const { data: strategiesData, error: strategiesError } = await authSupabase
      .from('strategies')
      .select('id, name, is_active')
      .eq('user_id', userId);
    
    if (strategiesError) {
      console.error('❌ Failed to fetch strategies:', strategiesError.message);
      return;
    }
    
    const strategies = strategiesData || [];
    console.log(`📋 Found ${strategies.length} strategies`);
    
    // Analyze emotional states
    console.log('\n😊 Step 4: Analyzing emotional states...');
    const emotionDistribution = {};
    let tradesWithEmotions = 0;
    let tradesWithoutEmotions = 0;
    
    trades.forEach(trade => {
      if (trade.emotional_state) {
        tradesWithEmotions++;
        
        let emotions = [];
        
        // Handle both array and JSON string formats
        if (Array.isArray(trade.emotional_state)) {
          emotions = trade.emotional_state;
        } else if (typeof trade.emotional_state === 'string') {
          try {
            emotions = JSON.parse(trade.emotional_state);
          } catch (e) {
            // If parsing fails, treat as single emotion
            emotions = [trade.emotional_state];
          }
        }
        
        emotions.forEach(emotion => {
          emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
        });
      } else {
        tradesWithoutEmotions++;
      }
    });
    
    console.log(`📊 Trades with emotions: ${tradesWithEmotions}/${trades.length}`);
    console.log(`⚠️  Trades without emotions: ${tradesWithoutEmotions}/${trades.length}`);
    
    console.log('\n😊 Emotional States Distribution:');
    Object.entries(emotionDistribution).forEach(([emotion, count]) => {
      console.log(`  ${emotion}: ${count}`);
    });
    
    // Check if all 8 emotions are present
    const expectedEmotions = ['CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'ANXIOUS', 'GREEDY', 'CALM'];
    const presentEmotions = Object.keys(emotionDistribution);
    const missingEmotions = expectedEmotions.filter(emotion => !presentEmotions.includes(emotion));
    
    console.log('\n🎯 Emotion Coverage Analysis:');
    console.log(`✅ Present emotions: ${presentEmotions.length}/8`);
    console.log(`❌ Missing emotions: ${missingEmotions.length}`);
    
    if (missingEmotions.length > 0) {
      console.log('Missing:', missingEmotions.join(', '));
    }
    
    // Calculate win rate
    const tradesWithPnL = trades.filter(trade => trade.pnl !== null);
    const winningTrades = tradesWithPnL.filter(trade => (trade.pnl || 0) > 0);
    const winRate = tradesWithPnL.length > 0 
      ? ((winningTrades.length / tradesWithPnL.length) * 100).toFixed(1)
      : '0';
    
    console.log('\n📈 Trading Statistics:');
    console.log(`📊 Total trades: ${trades.length}`);
    console.log(`🎯 Win rate: ${winRate}%`);
    console.log(`💰 Winning trades: ${winningTrades.length}`);
    console.log(`📉 Losing trades: ${tradesWithPnL.length - winningTrades.length}`);
    
    // Overall assessment
    console.log('\n🎉 Overall Assessment:');
    
    if (trades.length >= 100) {
      console.log('✅ Trade count: SUFFICIENT (≥100 trades)');
    } else {
      console.log(`⚠️  Trade count: INSUFFICIENT (${trades.length} < 100)`);
    }
    
    if (presentEmotions.length >= 8) {
      console.log('✅ Emotional coverage: COMPLETE (all 8 emotions present)');
    } else {
      console.log(`⚠️  Emotional coverage: INCOMPLETE (${presentEmotions.length}/8 emotions)`);
    }
    
    if (tradesWithEmotions === trades.length) {
      console.log('✅ Emotional data: COMPLETE (all trades have emotions)');
    } else {
      console.log(`⚠️  Emotional data: INCOMPLETE (${tradesWithoutEmotions} trades missing emotions)`);
    }
    
    if (parseFloat(winRate) >= 70) {
      console.log('✅ Win rate: TARGET MET (≥70%)');
    } else {
      console.log(`⚠️  Win rate: BELOW TARGET (${winRate}% < 70%)`);
    }
    
    // Final recommendation
    console.log('\n🔧 Recommendations:');
    
    if (trades.length === 0) {
      console.log('1. Run test data generation at /test-comprehensive-data');
      console.log('2. Use credentials: testuser@verotrade.com / TestPassword123!');
      console.log('3. Click "Execute Complete 4-Step Process"');
    } else if (presentEmotions.length < 8 || tradesWithoutEmotions > 0) {
      console.log('1. Regenerate test data to ensure complete emotional coverage');
      console.log('2. Check that all trades have emotional_state values');
    } else {
      console.log('✅ Data looks good! Emotional analysis should work on confluence/dashboard pages');
      console.log('📝 Navigate to /confluence to test emotional analysis features');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

// Execute verification
verifyEmotionalData();