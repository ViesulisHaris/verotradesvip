const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔧 FIXING EMOTION NAMES');
console.log('=============================');

// Use service role key for admin operations (same as API routes)
const supabase = createClient(
  'https://bzmixuxautbmqbrqtufx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnR1ZngiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM1ODQzNjAwLCJleHAiOjE5NTE0MTk2MDB9.7J6K1oZzX2x3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m'
);

// Map our current emotions to the expected ones
const emotionMapping = {
  'CONFIDENT': 'CONFIDENT',
  'ANXIOUS': 'ANXIOUS', 
  'FEARFUL': 'FEARFUL',
  'DISCIPLINED': 'DISCIPLINED',
  'IMPULSIVE': 'IMPULSIVE',
  'PATIENT': 'PATIENCE',
  'GREEDY': 'GREEDY',
  'CALM': 'CALM'
};

const REQUIRED_EMOTIONS = ['CONFIDENT', 'ANXIOUS', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENCE', 'GREEDY', 'CALM'];

async function fixEmotionNames() {
  console.log('🔧 Fixing emotion names in database...');
  
  try {
    // Get all trades with emotional states (no auth needed with service role key)
    const { data: trades, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (fetchError) {
      console.error('❌ Error fetching trades:', fetchError);
      return;
    }
    
    console.log(`✅ Found ${trades.length} trades to update`);
    
    // Update trades with correct emotion names
    let updateCount = 0;
    
    for (const trade of trades) {
      if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
        const currentEmotions = trade.emotional_state;
        const updatedEmotions = currentEmotions.map(emotion => {
          // Map our current emotions to the expected ones
          if (emotionMapping[emotion]) {
            return emotionMapping[emotion];
          }
          return emotion; // Keep unchanged if not in mapping
        });
        
        // Update the trade if emotions changed
        if (JSON.stringify(updatedEmotions) !== JSON.stringify(currentEmotions)) {
          console.log(`📝 Updating trade ${trade.id}: ${trade.symbol} - ${JSON.stringify(currentEmotions)} → ${JSON.stringify(updatedEmotions)}`);
          
          const { error: updateError } = await supabase
            .from('trades')
            .update({ emotional_state: updatedEmotions })
            .eq('id', trade.id);
            
          if (updateError) {
            console.error(`❌ Error updating trade ${trade.id}:`, updateError);
          } else {
            updateCount++;
            console.log(`✅ Successfully updated trade ${trade.id}`);
          }
        }
      }
    }
    
    console.log(`📊 Updated ${updateCount} trades with correct emotion names`);
    
    // Verify the updates
    const { data: updatedTrades, error: verifyError } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (verifyError) {
      console.error('❌ Error verifying updates:', verifyError);
      return;
    }
    
    console.log(`✅ Verification: Found ${updatedTrades.length} updated trades`);
    
    // Count emotions after update
    const emotionCounts = {};
    REQUIRED_EMOTIONS.forEach(emotion => emotionCounts[emotion] = 0);
    
    updatedTrades.forEach(trade => {
      if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
        trade.emotional_state.forEach(emotion => {
          if (emotionCounts[emotion] !== undefined) {
            emotionCounts[emotion]++;
          }
        });
      }
    });
    
    console.log('\n📊 Emotion Distribution After Fix:');
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      console.log(`  ${emotion}: ${count} trade(s)`);
    });
    
    const allEmotionsPresent = REQUIRED_EMOTIONS.every(emotion => emotionCounts[emotion] > 0);
    
    if (allEmotionsPresent) {
      console.log('\n🎉 SUCCESS: All required emotions are now present in the database!');
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Refresh dashboard page');
      console.log('2. Refresh confluence page');
      console.log('3. Test emotional analysis functionality');
      console.log('4. Verify radar charts display correctly');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some emotions may still be missing');
      console.log('Missing emotions:', REQUIRED_EMOTIONS.filter(emotion => emotionCounts[emotion] === 0));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Execute the fix
fixEmotionNames();