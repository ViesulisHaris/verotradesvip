const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugEmotionalPatterns() {
  console.log('🔍 Debugging Emotional Patterns Functionality...\n');

  try {
    // 1. Check if we can authenticate
    console.log('1️⃣ Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Authentication error:', authError);
      return;
    }
    
    if (!user) {
      console.log('⚠️ No authenticated user found');
      return;
    }
    
    console.log(`✅ Authenticated user: ${user.id}`);
    
    // 2. Check trades table structure and data
    console.log('\n2️⃣ Checking trades table structure and data...');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .limit(5);
    
    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError);
      return;
    }
    
    console.log(`✅ Found ${trades.length} trades`);
    
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
      .eq('user_id', user.id);
    
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
      .eq('user_id', user.id);
    
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
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugEmotionalPatterns();