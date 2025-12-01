const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugEmotionalPatterns() {
  console.log('🔍 Debugging Emotional Patterns Functionality with Service Role...\n');

  try {
    // 1. Get a test user
    console.log('1️⃣ Getting test user...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️ No users found in profiles table');
      return;
    }
    
    const testUser = users[0];
    console.log(`✅ Using test user: ${testUser.id} (${testUser.email})`);
    
    // 2. Check trades table structure and data
    console.log('\n2️⃣ Checking trades table structure and data...');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', testUser.id)
      .limit(5);
    
    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError);
      return;
    }
    
    console.log(`✅ Found ${trades.length} trades for user`);
    
    if (trades.length > 0) {
      console.log('Sample trade structure:');
      console.log(JSON.stringify(trades[0], null, 2));
      
      // Check emotional_state field specifically
      const emotionalStates = trades.map(t => t.emotional_state);
      console.log('\nEmotional states found:', emotionalStates);
    }
    
    // 3. Check total trades count
    console.log('\n3️⃣ Checking total trades count...');
    const { count: totalTrades, error: countError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', testUser.id);
    
    if (countError) {
      console.error('❌ Error counting trades:', countError);
      return;
    }
    
    console.log(`✅ Total trades: ${totalTrades}`);
    
    // 4. Check emotional data processing
    console.log('\n4️⃣ Simulating emotional data processing...');
    
    const { data: allTrades } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', testUser.id);
    
    if (!allTrades || allTrades.length === 0) {
      console.log('⚠️ No trades found for emotional analysis');
      
      // Create some test trades with emotional data
      console.log('\n🔧 Creating test trades with emotional data...');
      const testEmotions = ['FOMO', 'REVENGE', 'TILT', 'PATIENCE', 'DISCIPLINE', 'CONFIDENT', 'NEUTRAL'];
      const testTrades = [];
      
      for (let i = 0; i < 10; i++) {
        const randomEmotion = testEmotions[Math.floor(Math.random() * testEmotions.length)];
        const randomPnL = Math.floor(Math.random() * 1000) - 500; // Random PnL between -500 and 500
        
        const { data: newTrade, error: insertError } = await supabase
          .from('trades')
          .insert({
            user_id: testUser.id,
            symbol: 'TEST',
            side: Math.random() > 0.5 ? 'Buy' : 'Sell',
            entry_price: 100,
            exit_price: 100 + (randomPnL / 100),
            quantity: 100,
            pnl: randomPnL,
            emotional_state: randomEmotion,
            strategy_id: null,
            notes: 'Test trade for emotional patterns debugging',
            trade_date: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ Error creating test trade:', insertError);
        } else {
          testTrades.push(newTrade);
        }
      }
      
      console.log(`✅ Created ${testTrades.length} test trades with emotional data`);
      
      // Use the newly created trades for analysis
      allTrades.push(...testTrades);
    }
    
    const emotions = allTrades.reduce((acc, t) => {
      const e = t.emotional_state ?? 'Neutral';
      acc[e] = (acc[e] ?? 0) + 1;
      return acc;
    }, {});
    
    console.log('Emotions count:', emotions);
    
    const totalEmotions = Object.values(emotions).reduce((a, b) => a + b, 0) || 1;
    console.log('Total emotions:', totalEmotions);
    
    // 5. Simulate emotionData creation (like in dashboard)
    console.log('\n5️⃣ Simulating emotionData creation...');
    const emotionData = Object.entries(emotions).map(([label, value]) => ({
      subject: label,
      value: (value / totalEmotions) * 10,
      fullMark: 10,
      percent: ((value / totalEmotions) * 100).toFixed(1) + '%',
      leaning: 'Balanced',
      side: 'NULL',
      leaningValue: 0,
      totalTrades: value,
    }));
    
    console.log('EmotionData for EmotionRadar:');
    console.log(JSON.stringify(emotionData, null, 2));
    
    // 6. Check if emotion data is valid for EmotionRadar
    console.log('\n6️⃣ Validating emotion data for EmotionRadar...');
    const VALID_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
    
    emotionData.forEach((item, index) => {
      const normalizedSubject = item.subject.toUpperCase().trim();
      const isValid = VALID_EMOTIONS.includes(normalizedSubject);
      console.log(`Item ${index}: ${item.subject} - ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });
    
    // 7. Check if there are any valid emotions
    const validEmotions = emotionData.filter(item => {
      const normalizedSubject = item.subject.toUpperCase().trim();
      return VALID_EMOTIONS.includes(normalizedSubject);
    });
    
    console.log(`\n✅ Valid emotions for EmotionRadar: ${validEmotions.length}`);
    console.log('Invalid emotions:', emotionData.length - validEmotions.length);
    
    // 8. Final diagnosis
    console.log('\n🎯 DIAGNOSIS:');
    if (validEmotions.length === 0) {
      console.log('❌ No valid emotions found - EmotionRadar will show "No valid emotional data available"');
      console.log('   This could be because:');
      console.log('   - Trades have no emotional_state data');
      console.log('   - Emotional states use invalid values');
      console.log('   - Emotional states are null/undefined');
    } else if (validEmotions.length < emotionData.length) {
      console.log('⚠️ Some emotions are invalid - EmotionRadar will filter them out');
    } else {
      console.log('✅ All emotions are valid - EmotionRadar should display correctly');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugEmotionalPatterns();