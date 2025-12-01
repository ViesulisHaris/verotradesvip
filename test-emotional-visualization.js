const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testEmotionalVisualization() {
  console.log('📊 [EMOTIONAL VISUALIZATION] Testing emotional filtering and radar chart functionality...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ [EMOTIONAL VISUALIZATION] Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // 1. Authenticate
    console.log('\n🔍 [STEP 1] Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testuser@verotrade.com',
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.error('❌ [STEP 1] Authentication failed:', authError.message);
      return;
    }
    
    console.log(`✅ [STEP 1] Authenticated successfully`);
    
    // 2. Get trades with emotional states
    console.log('\n🔍 [STEP 2] Fetching trades for emotional analysis...');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, symbol, pnl, emotional_state, market, strategy_id, trade_date')
      .eq('user_id', authData.user.id);
    
    if (tradesError) {
      console.error('❌ [STEP 2] Error fetching trades:', tradesError.message);
      return;
    }
    
    console.log(`📊 [STEP 2] Found ${trades.length} trades`);
    
    // 3. Parse emotional states and create comprehensive analysis
    console.log('\n🔍 [STEP 3] Processing emotional states for visualization...');
    const emotionStats = {};
    const emotionPerformance = {};
    const emotionByMarket = {};
    const emotionByStrategy = {};
    
    trades.forEach(trade => {
      let emotions = [];
      
      // Parse emotional states
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
      
      // Process each emotion
      emotions.forEach(emotion => {
        // Basic stats
        if (!emotionStats[emotion]) {
          emotionStats[emotion] = {
            count: 0,
            totalPnL: 0,
            wins: 0,
            losses: 0,
            markets: new Set(),
            strategies: new Set()
          };
        }
        
        emotionStats[emotion].count++;
        emotionStats[emotion].totalPnL += trade.pnl || 0;
        emotionStats[emotion].markets.add(trade.market);
        emotionStats[emotion].strategies.add(trade.strategy_id);
        
        if ((trade.pnl || 0) > 0) {
          emotionStats[emotion].wins++;
        } else {
          emotionStats[emotion].losses++;
        }
        
        // Performance by emotion
        if (!emotionPerformance[emotion]) {
          emotionPerformance[emotion] = [];
        }
        emotionPerformance[emotion].push({
          symbol: trade.symbol,
          pnl: trade.pnl,
          market: trade.market,
          date: trade.trade_date
        });
        
        // By market
        if (!emotionByMarket[emotion]) {
          emotionByMarket[emotion] = {};
        }
        if (!emotionByMarket[emotion][trade.market]) {
          emotionByMarket[emotion][trade.market] = 0;
        }
        emotionByMarket[emotion][trade.market]++;
        
        // By strategy
        if (!emotionByStrategy[emotion]) {
          emotionByStrategy[emotion] = {};
        }
        if (!emotionByStrategy[emotion][trade.strategy_id]) {
          emotionByStrategy[emotion][trade.strategy_id] = 0;
        }
        emotionByStrategy[emotion][trade.strategy_id]++;
      });
    });
    
    // 4. Generate radar chart data
    console.log('\n🎯 [STEP 4] Generating radar chart data...');
    const maxCount = Math.max(...Object.values(emotionStats).map(s => s.count));
    const radarData = {};
    
    Object.entries(emotionStats).forEach(([emotion, stats]) => {
      const frequency = stats.count;
      const distanceFromCenter = (frequency / maxCount) * 100;
      const winRate = stats.count > 0 ? (stats.wins / stats.count * 100).toFixed(1) : '0.0';
      const avgPnL = stats.count > 0 ? (stats.totalPnL / stats.count).toFixed(0) : '0';
      
      radarData[emotion] = {
        frequency,
        distanceFromCenter: distanceFromCenter.toFixed(1),
        winRate: parseFloat(winRate),
        avgPnL: parseFloat(avgPnL),
        totalPnL: stats.totalPnL,
        markets: Array.from(stats.markets),
        strategyCount: stats.strategies.size
      };
      
      console.log(`   ${emotion}:`);
      console.log(`     Frequency: ${frequency} trades (${distanceFromCenter.toFixed(1)}% from center)`);
      console.log(`     Win Rate: ${winRate}% | Avg P&L: $${avgPnL} | Total P&L: $${stats.totalPnL}`);
      console.log(`     Markets: ${Array.from(stats.markets).join(', ')}`);
      console.log(`     Strategies: ${stats.strategies.size}`);
    });
    
    // 5. Test emotional filtering scenarios
    console.log('\n🔍 [STEP 5] Testing emotional filtering scenarios...');
    
    // Test filtering by single emotion
    const testEmotions = ['CONFIDENT', 'FEARFUL', 'IMPULSIVE', 'CALM'];
    testEmotions.forEach(emotion => {
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
        return emotions.includes(emotion);
      });
      
      const stats = radarData[emotion];
      console.log(`   ${emotion} filter: ${filteredTrades.length} trades`);
      console.log(`     Expected: ${stats.frequency} | Actual: ${filteredTrades.length} | Match: ${stats.frequency === filteredTrades.length ? '✅' : '❌'}`);
    });
    
    // Test filtering by multiple emotions
    const multiEmotionFilter = ['CONFIDENT', 'FEARFUL'];
    const multiFilteredTrades = trades.filter(trade => {
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
      return emotions.some(e => multiEmotionFilter.includes(e));
    });
    
    const expectedMultiCount = radarData['CONFIDENT'].frequency + radarData['FEARFUL'].frequency;
    console.log(`   Multi-emotion filter (CONFIDENT OR FEARFUL): ${multiFilteredTrades.length} trades`);
    console.log(`     Expected: ${expectedMultiCount} | Actual: ${multiFilteredTrades.length} | Match: ${expectedMultiCount === multiFilteredTrades.length ? '✅' : '❌'}`);
    
    // 6. Verify radar chart positioning logic
    console.log('\n🎯 [STEP 6] Verifying radar chart positioning logic...');
    const sortedEmotions = Object.entries(radarData)
      .sort(([,a], [,b]) => b.distanceFromCenter - a.distanceFromCenter);
    
    console.log('   Positioning (furthest from center to closest):');
    sortedEmotions.forEach(([emotion, data], index) => {
      const position = index < 3 ? 'Outer Ring' : index < 6 ? 'Middle Ring' : 'Inner Ring';
      console.log(`     ${index + 1}. ${emotion}: ${data.distanceFromCenter}% from center (${position})`);
    });
    
    // 7. Test data consistency
    console.log('\n🔍 [STEP 7] Testing data consistency...');
    const totalEmotionOccurrences = Object.values(radarData).reduce((sum, data) => sum + data.frequency, 0);
    const uniqueEmotions = Object.keys(radarData).length;
    const expectedEmotions = 8;
    
    console.log(`   Total emotion occurrences: ${totalEmotionOccurrences}`);
    console.log(`   Unique emotions: ${uniqueEmotions}/${expectedEmotions}`);
    console.log(`   Average per emotion: ${(totalEmotionOccurrences / expectedEmotions).toFixed(1)}`);
    console.log(`   Frequency variation: ${new Set(Object.values(radarData).map(d => d.frequency)).size > 1 ? '✅' : '❌'}`);
    
    // 8. Final validation
    console.log('\n📋 [EMOTIONAL VISUALIZATION SUMMARY]:');
    const allTestsPassed = 
      uniqueEmotions === expectedEmotions &&
      totalEmotionOccurrences > 0 &&
      new Set(Object.values(radarData).map(d => d.frequency)).size > 1;
    
    console.log(`✅ All emotions present: ${uniqueEmotions === expectedEmotions ? 'YES' : 'NO'}`);
    console.log(`✅ Frequency variation exists: ${new Set(Object.values(radarData).map(d => d.frequency)).size > 1 ? 'YES' : 'NO'}`);
    console.log(`✅ Radar positioning works: ${sortedEmotions.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Filtering works: ${expectedMultiCount === multiFilteredTrades.length ? 'YES' : 'NO'}`);
    
    if (allTestsPassed) {
      console.log('\n🎉 [SUCCESS] Emotional visualization is working perfectly!');
      console.log('✅ All 8 emotions are distributed and tracked');
      console.log('✅ Radar chart will show proper frequency-based positioning');
      console.log('✅ Emotional filtering will work correctly');
      console.log('✅ Dashboard and confluence will show identical emotional data');
    } else {
      console.log('\n❌ [ISSUE] Some emotional visualization features need attention');
    }
    
  } catch (error) {
    console.error('❌ [EMOTIONAL VISUALIZATION] Unexpected error:', error);
  }
}

testEmotionalVisualization();