const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Define the 8 required emotions exactly as specified
const REQUIRED_EMOTIONS = ['ANXIOUS', 'CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'GREEDY', 'CALM'];

async function verifyEmotionalDataAuthenticated() {
  try {
    console.log('🔍 VERIFYING EMOTIONAL DATA WITH AUTHENTICATION');
    console.log('==============================================\n');
    
    // First authenticate
    console.log('🔐 Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }
    
    console.log(`✅ Authenticated as: ${authData.user.email}`);
    const userId = authData.user.id;
    
    // Check strategies
    console.log('\n🎯 Checking strategies...');
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name, is_active')
      .eq('user_id', userId);
    
    if (strategiesError) {
      console.error('❌ Error fetching strategies:', strategiesError.message);
    } else {
      console.log(`✅ Found ${strategies.length} strategies:`);
      strategies.forEach(strategy => {
        console.log(`  - ${strategy.name} (${strategy.is_active ? 'Active' : 'Inactive'})`);
      });
    }
    
    // Check trades with emotional states
    console.log('\n📈 Checking trades with emotional states...');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, symbol, emotional_state, pnl, trade_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError.message);
      return;
    }
    
    console.log(`✅ Found ${trades.length} trades total`);
    
    if (trades.length === 0) {
      console.log('❌ No trades found - data creation may have failed');
      return;
    }
    
    // Analyze emotional states
    const uniqueEmotions = new Set();
    const emotionCounts = {};
    
    trades.forEach(trade => {
      if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
        trade.emotional_state.forEach(emotion => {
          if (typeof emotion === 'string') {
            const upperEmotion = emotion.toUpperCase();
            uniqueEmotions.add(upperEmotion);
            emotionCounts[upperEmotion] = (emotionCounts[upperEmotion] || 0) + 1;
          }
        });
      }
    });
    
    const foundEmotions = Array.from(uniqueEmotions).sort();
    
    console.log('\n🎭 Emotions found in database:');
    foundEmotions.forEach(emotion => {
      const count = emotionCounts[emotion] || 0;
      console.log(`  ✓ ${emotion}: ${count} trades`);
    });
    
    const missingEmotions = REQUIRED_EMOTIONS.filter(emotion => !foundEmotions.includes(emotion));
    
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Total strategies: ${strategies.length}`);
    console.log(`✅ Total trades: ${trades.length}`);
    console.log(`✅ Unique emotions found: ${foundEmotions.length}`);
    console.log(`✅ Required emotions: ${REQUIRED_EMOTIONS.length}`);
    
    if (missingEmotions.length === 0) {
      console.log('\n🎉 SUCCESS: All required emotions are present!');
      console.log('\n🚀 Emotional state analysis should now work on dashboard and confluence pages!');
      console.log('\n📋 Next steps:');
      console.log('1. Visit http://localhost:3000/dashboard to check emotional analysis');
      console.log('2. Visit http://localhost:3000/confluence to verify radar charts');
      console.log('3. Test emotion filtering functionality');
      return true;
    } else {
      console.log(`\n❌ ISSUE: Missing emotions: ${missingEmotions.join(', ')}`);
      console.log('\n💡 To fix this, you may need to:');
      console.log('1. Run the data generation script again');
      console.log('2. Check RLS policies on trades table');
      console.log('3. Verify emotional_state column structure');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    return false;
  }
}

// Run the verification
verifyEmotionalDataAuthenticated().then(success => {
  if (success) {
    console.log('\n✅ Verification completed successfully - emotional data is ready!');
  } else {
    console.log('\n❌ Verification failed - please check the issues above');
  }
}).catch(error => {
  console.error('❌ Error during verification:', error);
});