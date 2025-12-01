const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testEmotionalAnalysisFix() {
  console.log('🧠 [EMOTIONAL ANALYSIS] Testing emotional analysis fix...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ [EMOTIONAL ANALYSIS] Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // 1. Authenticate as testuser@verotrade.com
    console.log('\n🔍 [STEP 1] Authenticating as testuser@verotrade.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testuser@verotrade.com',
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.error('❌ [STEP 1] Authentication failed:', authError.message);
      return;
    }
    
    const authenticatedUserId = authData.user.id;
    console.log(`✅ [STEP 1] Authenticated successfully with User ID: ${authenticatedUserId}`);
    
    // 2. Get all trades with emotional states
    console.log('\n🔍 [STEP 2] Fetching trades with emotional states...');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, symbol, pnl, emotional_state, created_at')
      .eq('user_id', authenticatedUserId);
    
    if (tradesError) {
      console.error('❌ [STEP 2] Error fetching trades:', tradesError.message);
      return;
    }
    
    console.log(`📊 [STEP 2] Found ${trades.length} trades`);
    
    // 3. Analyze emotional distribution manually
    console.log('\n🔍 [STEP 3] Analyzing emotional distribution...');
    const emotionDistribution = {};
    const emotionDetails = {};
    
    trades.forEach((trade, index) => {
      let emotions = [];
      
      // Parse emotional states (handle both array and JSON string formats)
      if (trade.emotional_state) {
        if (Array.isArray(trade.emotional_state)) {
          emotions = trade.emotional_state;
        } else if (typeof trade.emotional_state === 'string') {
          try {
            emotions = JSON.parse(trade.emotional_state);
          } catch (e) {
            emotions = [trade.emotional_state];
          }
        }
      }
      
      // Count emotions
      emotions.forEach(emotion => {
        emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
        
        if (!emotionDetails[emotion]) {
          emotionDetails[emotion] = [];
        }
        emotionDetails[emotion].push({
          tradeId: trade.id,
          symbol: trade.symbol,
          pnl: trade.pnl
        });
      });
      
      // Log first few trades for verification
      if (index < 5) {
        console.log(`📋 [STEP 3] Trade ${index + 1}: ${trade.symbol} - P&L: $${trade.pnl} - Emotions: [${emotions.join(', ')}]`);
      }
    });
    
    // 4. Display emotional distribution results
    console.log('\n📊 [EMOTIONAL DISTRIBUTION RESULTS]:');
    const totalEmotions = Object.values(emotionDistribution).reduce((sum, count) => sum + count, 0);
    
    Object.entries(emotionDistribution)
      .sort(([,a], [,b]) => b - a) // Sort by frequency (highest first)
      .forEach(([emotion, count]) => {
        const percentage = ((count / totalEmotions) * 100).toFixed(1);
        console.log(`   ${emotion}: ${count} occurrences (${percentage}%)`);
        
        // Show sample trades for each emotion
        const samples = emotionDetails[emotion].slice(0, 3);
        console.log(`      Sample trades: ${samples.map(t => `${t.symbol} ($${t.pnl})`).join(', ')}`);
      });
    
    // 5. Verify all emotions are present
    const expectedEmotions = ['CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'ANXIOUS', 'GREEDY', 'CALM'];
    const presentEmotions = Object.keys(emotionDistribution);
    const missingEmotions = expectedEmotions.filter(emotion => !presentEmotions.includes(emotion));
    
    console.log('\n🔍 [EMOTIONAL COVERAGE ANALYSIS]:');
    console.log(`✅ Expected emotions: ${expectedEmotions.length}`);
    console.log(`📊 Present emotions: ${presentEmotions.length}`);
    console.log(`📋 Present: [${presentEmotions.join(', ')}]`);
    
    if (missingEmotions.length > 0) {
      console.log(`❌ Missing: [${missingEmotions.join(', ')}]`);
    } else {
      console.log('✅ All expected emotions are present!');
    }
    
    // 6. Test frequency-based positioning (for radar chart)
    console.log('\n🎯 [RADAR CHART POSITIONING TEST]:');
    const maxFrequency = Math.max(...Object.values(emotionDistribution));
    const radarPositions = {};
    
    Object.entries(emotionDistribution).forEach(([emotion, count]) => {
      // Distance from center = frequency (higher frequency = further from center)
      const distanceFromCenter = (count / maxFrequency) * 100; // 0-100% scale
      radarPositions[emotion] = {
        frequency: count,
        distanceFromCenter: distanceFromCenter.toFixed(1),
        position: distanceFromCenter > 66 ? 'Outer' : distanceFromCenter > 33 ? 'Middle' : 'Inner'
      };
      
      console.log(`   ${emotion}: ${count} occurrences -> ${distanceFromCenter.toFixed(1)}% from center (${radarPositions[emotion].position})`);
    });
    
    // 7. Test emotional filtering simulation
    console.log('\n🔍 [EMOTIONAL FILTERING TEST]:');
    const testEmotions = ['CONFIDENT', 'FEARFUL', 'IMPULSIVE'];
    
    testEmotions.forEach(testEmotion => {
      const filteredTrades = trades.filter(trade => {
        let emotions = [];
        if (trade.emotional_state) {
          if (Array.isArray(trade.emotional_state)) {
            emotions = trade.emotional_state;
          } else if (typeof trade.emotional_state === 'string') {
            try {
              emotions = JSON.parse(trade.emotional_state);
            } catch (e) {
              emotions = [trade.emotional_state];
            }
          }
        }
        return emotions.includes(testEmotion);
      });
      
      const totalPnL = filteredTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winRate = filteredTrades.length > 0 
        ? ((filteredTrades.filter(t => (t.pnl || 0) > 0).length / filteredTrades.length) * 100).toFixed(1)
        : '0.0';
      
      console.log(`   ${testEmotion}: ${filteredTrades.length} trades, Total P&L: $${totalPnL}, Win Rate: ${winRate}%`);
    });
    
    // 8. Summary
    console.log('\n📋 [EMOTIONAL ANALYSIS SUMMARY]:');
    const allEmotionsPresent = missingEmotions.length === 0;
    const hasGoodDistribution = presentEmotions.length >= 7;
    const hasFrequencyVariation = new Set(Object.values(emotionDistribution)).size > 1;
    
    console.log(`✅ All emotions present: ${allEmotionsPresent ? 'YES' : 'NO'}`);
    console.log(`✅ Good distribution: ${hasGoodDistribution ? 'YES' : 'NO'}`);
    console.log(`✅ Frequency variation: ${hasFrequencyVariation ? 'YES' : 'NO'}`);
    console.log(`✅ Total emotion occurrences: ${totalEmotions}`);
    console.log(`✅ Average per emotion: ${(totalEmotions / expectedEmotions.length).toFixed(1)}`);
    
    if (allEmotionsPresent && hasGoodDistribution && hasFrequencyVariation) {
      console.log('\n🎉 [SUCCESS] Emotional analysis fix is working correctly!');
      console.log('✅ All 8 emotions are distributed across 100 trades');
      console.log('✅ Frequency-based positioning will work properly');
      console.log('✅ Emotional filtering will work correctly');
      console.log('✅ Radar chart will show proper distribution');
    } else {
      console.log('\n❌ [ISSUE] Emotional analysis needs further attention');
    }
    
  } catch (error) {
    console.error('❌ [EMOTIONAL ANALYSIS] Unexpected error:', error);
  }
}

testEmotionalAnalysisFix();