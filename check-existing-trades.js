const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingTrades() {
  console.log('🔍 Checking existing trades in database...');
  
  try {
    // Get the test user ID from previous attempts
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }
    
    console.log(`✅ Authenticated as user: ${user.id}`);
    
    // Fetch all trades for this user
    const { data: trades, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('trade_date', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching trades:', fetchError.message);
      return;
    }
    
    console.log(`📊 Found ${trades.length} trades in database`);
    
    if (trades.length === 0) {
      console.log('\n📝 No trades found. Creating sample trades for testing...');
      
      // Create some sample trades with emotions for testing
      const sampleTrades = [
        {
          user_id: user.id,
          market: 'Stock',
          symbol: 'AAPL',
          side: 'Buy',
          quantity: 100,
          entry_price: 150.00,
          exit_price: 148.50,
          pnl: -150.00,
          trade_date: new Date().toISOString().split('T')[0],
          emotional_state: ['FOMO'],
          notes: 'FOMO trade - bought at top after seeing big green candle'
        },
        {
          user_id: user.id,
          market: 'Crypto',
          symbol: 'BTCUSD',
          side: 'Sell',
          quantity: 0.5,
          entry_price: 45000.00,
          exit_price: 44500.00,
          pnl: 250.00,
          trade_date: new Date().toISOString().split('T')[0],
          emotional_state: ['REVENGE'],
          notes: 'Revenge trade after previous loss - wanted to win it back quickly'
        },
        {
          user_id: user.id,
          market: 'Stock',
          symbol: 'TSLA',
          side: 'Buy',
          quantity: 50,
          entry_price: 250.00,
          exit_price: 248.00,
          pnl: -100.00,
          trade_date: new Date().toISOString().split('T')[0],
          emotional_state: ['FOMO', 'ANXIOUS'],
          notes: 'FOMO and anxious trade - bought during volatile market conditions'
        },
        {
          user_id: user.id,
          market: 'Stock',
          symbol: 'SPY',
          side: 'Buy',
          quantity: 75,
          entry_price: 450.00,
          exit_price: 452.00,
          pnl: 150.00,
          trade_date: new Date().toISOString().split('T')[0],
          emotional_state: null,
          notes: 'Disciplined trade with no emotional influence - followed plan exactly'
        }
      ];
      
      // Insert sample trades using the service role (bypassing RLS)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        console.log('⚠️  No service role key found. Cannot create sample trades automatically.');
        console.log('📝 Please manually create trades through the web interface at http://localhost:3000/log-trade');
        return;
      }
      
      const serviceClient = createClient(supabaseUrl, serviceRoleKey);
      
      for (let i = 0; i < sampleTrades.length; i++) {
        const trade = sampleTrades[i];
        console.log(`\n📝 Creating sample trade ${i + 1}: ${trade.symbol} with emotions: ${JSON.stringify(trade.emotional_state)}`);
        
        const { data, error } = await serviceClient
          .from('trades')
          .insert(trade)
          .select('id, symbol, emotional_state')
          .single();
        
        if (error) {
          console.error(`❌ Failed to create ${trade.symbol}:`, error.message);
        } else {
          console.log(`✅ Created ${trade.symbol} trade (ID: ${data.id})`);
        }
      }
      
      console.log('\n🎯 Sample trades created! Now you can test the filtering at http://localhost:3000/confluence');
      
    } else {
      console.log('\n📋 Existing trades:');
      trades.forEach((trade, index) => {
        console.log(`\n${index + 1}. ${trade.symbol} (${trade.market})`);
        console.log(`   ID: ${trade.id}`);
        console.log(`   Side: ${trade.side}`);
        console.log(`   P&L: ${trade.pnl}`);
        console.log(`   Emotions: ${JSON.stringify(trade.emotional_state)}`);
        console.log(`   Date: ${trade.trade_date}`);
      });
      
      // Analyze emotion distribution
      const emotionCounts = {};
      trades.forEach(trade => {
        if (trade.emotional_state) {
          const emotions = Array.isArray(trade.emotional_state) ? trade.emotional_state : 
                        typeof trade.emotional_state === 'string' ? JSON.parse(trade.emotional_state) : [];
          emotions.forEach(emotion => {
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
          });
        }
      });
      
      console.log('\n📊 Emotion Distribution:');
      Object.entries(emotionCounts).forEach(([emotion, count]) => {
        console.log(`   ${emotion}: ${count}`);
      });
      
      console.log('\n🎯 Testing Instructions:');
      console.log('1. Go to http://localhost:3000/confluence');
      console.log('2. Test emotion filter pills with these emotions:');
      Object.keys(emotionCounts).forEach(emotion => {
        console.log(`   - ${emotion} (should show ${emotionCounts[emotion]} trades)`);
      });
      console.log('3. Test multi-select by combining emotions');
      console.log('4. Check expandable rows to verify emotions display');
      console.log('5. Verify statistics update when filtering');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkExistingTrades();