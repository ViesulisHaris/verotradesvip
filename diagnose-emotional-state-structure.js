const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function diagnoseEmotionalStateStructure() {
  try {
    console.log('🔍 DIAGNOSING EMOTIONAL STATE FIELD STRUCTURE');
    console.log('==========================================\n');
    
    // Authenticate first
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
    
    // Get sample trades with all fields to understand structure
    console.log('\n📊 Getting sample trades to analyze structure...');
    const { data: sampleTrades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .limit(5);
    
    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError.message);
      return;
    }
    
    if (sampleTrades.length === 0) {
      console.log('❌ No trades found');
      return;
    }
    
    console.log(`\n📋 Sample trade structure analysis:`);
    sampleTrades.forEach((trade, index) => {
      console.log(`\nTrade ${index + 1} (ID: ${trade.id}):`);
      console.log(`  Symbol: ${trade.symbol}`);
      console.log(`  P&L: ${trade.pnl}`);
      console.log(`  emotional_state field: ${JSON.stringify(trade.emotional_state)}`);
      console.log(`  emotional_state type: ${typeof trade.emotional_state}`);
      console.log(`  emotional_state isArray: ${Array.isArray(trade.emotional_state)}`);
      
      // Try to parse if it's a string
      if (typeof trade.emotional_state === 'string') {
        try {
          const parsed = JSON.parse(trade.emotional_state);
          console.log(`  Parsed JSON: ${JSON.stringify(parsed)}`);
          console.log(`  Parsed type: ${typeof parsed}`);
          console.log(`  Parsed isArray: ${Array.isArray(parsed)}`);
        } catch (e) {
          console.log(`  JSON parse error: ${e.message}`);
        }
      }
    });
    
    // Get all trades and analyze emotional_state patterns
    console.log('\n🔍 Analyzing emotional_state patterns across all trades...');
    const { data: allTrades, error: allTradesError } = await supabase
      .from('trades')
      .select('id, emotional_state')
      .eq('user_id', userId);
    
    if (allTradesError) {
      console.error('❌ Error fetching all trades:', allTradesError.message);
      return;
    }
    
    console.log(`\n📊 Analyzing ${allTrades.length} trades for emotional_state patterns:`);
    
    const patterns = {
      string: 0,
      array: 0,
      null: 0,
      object: 0,
      other: 0
    };
    
    const uniqueEmotions = new Set();
    
    allTrades.forEach((trade, index) => {
      const emotionalState = trade.emotional_state;
      
      if (emotionalState === null) {
        patterns.null++;
      } else if (typeof emotionalState === 'string') {
        patterns.string++;
        console.log(`\nString pattern (Trade ${index + 1}): "${emotionalState}"`);
        
        // Try to parse it
        try {
          const parsed = JSON.parse(emotionalState);
          if (Array.isArray(parsed)) {
            parsed.forEach(emotion => {
              if (typeof emotion === 'string') {
                uniqueEmotions.add(emotion.toUpperCase());
              }
            });
          }
        } catch (e) {
          // If it's not valid JSON, treat as single emotion
          uniqueEmotions.add(emotionalState.toUpperCase());
        }
      } else if (Array.isArray(emotionalState)) {
        patterns.array++;
        emotionalState.forEach(emotion => {
          if (typeof emotion === 'string') {
            uniqueEmotions.add(emotion.toUpperCase());
          }
        });
      } else if (typeof emotionalState === 'object') {
        patterns.object++;
        console.log(`\nObject pattern (Trade ${index + 1}): ${JSON.stringify(emotionalState)}`);
      } else {
        patterns.other++;
        console.log(`\nOther pattern (Trade ${index + 1}): ${typeof emotionalState} - ${JSON.stringify(emotionalState)}`);
      }
    });
    
    console.log('\n📊 emotional_state field patterns:');
    console.log(`  String: ${patterns.string}`);
    console.log(`  Array: ${patterns.array}`);
    console.log(`  Null: ${patterns.null}`);
    console.log(`  Object: ${patterns.object}`);
    console.log(`  Other: ${patterns.other}`);
    
    console.log('\n🎭 Unique emotions found:');
    const sortedEmotions = Array.from(uniqueEmotions).sort();
    if (sortedEmotions.length === 0) {
      console.log('  None found');
    } else {
      sortedEmotions.forEach(emotion => console.log(`  ✓ ${emotion}`));
    }
    
    const REQUIRED_EMOTIONS = ['ANXIOUS', 'CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'GREEDY', 'CALM'];
    const missingEmotions = REQUIRED_EMOTIONS.filter(emotion => !sortedEmotions.includes(emotion));
    
    if (missingEmotions.length === 0) {
      console.log('\n🎉 SUCCESS: All required emotions are present!');
    } else {
      console.log(`\n❌ Missing emotions: ${missingEmotions.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
  }
}

// Run the diagnosis
diagnoseEmotionalStateStructure().then(() => {
  console.log('\n✅ Emotional state structure diagnosis completed');
}).catch(error => {
  console.error('❌ Error during diagnosis:', error);
});