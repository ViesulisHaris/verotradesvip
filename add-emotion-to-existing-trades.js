// Add emotional data to existing trades
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addEmotionToExistingTrades() {
  try {
    console.log('🔧 Adding emotional data to existing trades...');
    
    // First, get existing trades to update
    const { data: existingTrades, error: fetchError } = await supabase
      .from('trades')
      .select('id')
      .limit(2);
    
    if (fetchError) {
      console.error('❌ Error fetching existing trades:', fetchError.message);
      return;
    }
    
    if (!existingTrades || existingTrades.length === 0) {
      console.log('❌ No existing trades found to update');
      return;
    }
    
    console.log(`📝 Found ${existingTrades.length} existing trades to update`);
    
    // Update existing trades with emotional data
    for (const trade of existingTrades) {
      console.log(`📝 Updating trade ${trade.id} with emotional data`);
      
      const { error: updateError } = await supabase
        .from('trades')
        .update({
          emotional_state: '["FOMO", "CONFIDENT"]'
        })
        .eq('id', trade.id);
      
      if (updateError) {
        console.error(`❌ Error updating trade ${trade.id}:`, updateError.message);
      } else {
        console.log(`✅ Successfully updated trade ${trade.id} with emotional data`);
      }
    }
    
    console.log('🎯 Emotional data addition complete! The dashboard should now show the radar with variation.');
    
  } catch (error) {
    console.error('❌ Error adding emotional data:', error.message);
  }
}

addEmotionToExistingTrades();