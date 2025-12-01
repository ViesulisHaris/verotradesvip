const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🚀 EXECUTING EMOTIONAL DATA CREATION');
console.log('===================================');

// Initialize Supabase client with service role key for full permissions
const supabase = createClient(
  'https://bzmixuxautbmqbrqtufx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnR1ZngiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM1ODQzNjAwLCJleHAiOjE5NTE0MTk2MDB9.7J6K1oZzX2x3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const REQUIRED_EMOTIONS = ['ANXIOUS', 'CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'GREEDY', 'CALM'];

const sampleTrades = [
  {
    symbol: 'AAPL',
    market: 'Stock',
    side: 'Buy',
    quantity: 100,
    entry_price: 150.00,
    exit_price: 155.00,
    pnl: 500.00,
    emotional_state: ['CONFIDENT'],
    notes: 'Confident trade - strong technical analysis',
    user_id: 'test-user-id' // We'll need to get a real user ID
  },
  {
    symbol: 'GOOGL',
    market: 'Stock',
    side: 'Sell',
    quantity: 50,
    entry_price: 2800.00,
    exit_price: 2750.00,
    pnl: 2500.00,
    emotional_state: ['DISCIPLINED'],
    notes: 'Disciplined trade - followed exit plan exactly',
    user_id: 'test-user-id'
  },
  {
    symbol: 'TSLA',
    market: 'Stock',
    side: 'Buy',
    quantity: 75,
    entry_price: 250.00,
    exit_price: 240.00,
    pnl: -750.00,
    emotional_state: ['ANXIOUS'],
    notes: 'Anxious trade - worried about missing opportunity',
    user_id: 'test-user-id'
  },
  {
    symbol: 'BTC',
    market: 'Crypto',
    side: 'Buy',
    quantity: 0.5,
    entry_price: 45000.00,
    exit_price: 46000.00,
    pnl: 500.00,
    emotional_state: ['PATIENT'],
    notes: 'Patient trade - waited for right entry point',
    user_id: 'test-user-id'
  },
  {
    symbol: 'ETH',
    market: 'Crypto',
    side: 'Sell',
    quantity: 2.0,
    entry_price: 3000.00,
    exit_price: 2900.00,
    pnl: 200.00,
    emotional_state: ['CALM'],
    notes: 'Calm trade - no emotional attachment',
    user_id: 'test-user-id'
  },
  {
    symbol: 'MSFT',
    market: 'Stock',
    side: 'Buy',
    quantity: 150,
    entry_price: 350.00,
    exit_price: 340.00,
    pnl: -1500.00,
    emotional_state: ['FEARFUL'],
    notes: 'Fearful trade - afraid of missing out',
    user_id: 'test-user-id'
  },
  {
    symbol: 'NVDA',
    market: 'Stock',
    side: 'Buy',
    quantity: 200,
    entry_price: 500.00,
    exit_price: 520.00,
    pnl: 4000.00,
    emotional_state: ['GREEDY'],
    notes: 'Greedy trade - took too much risk',
    user_id: 'test-user-id'
  },
  {
    symbol: 'META',
    market: 'Stock',
    side: 'Sell',
    quantity: 100,
    entry_price: 200.00,
    exit_price: 180.00,
    pnl: 2000.00,
    emotional_state: ['IMPULSIVE'],
    notes: 'Impulsive trade - quick decision without analysis',
    user_id: 'test-user-id'
  }
];

async function getUserId() {
  console.log('🔍 Getting test user ID...');
  
  // Try to get an existing user first
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
    
  if (userError) {
    console.error('Error fetching users:', userError);
    return null;
  }
  
  if (users && users.length > 0) {
    console.log(`✅ Found existing user: ${users[0].id}`);
    return users[0].id;
  }
  
  // If no users exist, create a test user
  console.log('📝 Creating test user...');
  const { data: newUser, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: 'test-user-id',
      email: 'test@example.com',
      full_name: 'Test User'
    })
    .select()
    .single();
    
  if (createError) {
    console.error('Error creating test user:', createError);
    return null;
  }
  
  console.log(`✅ Created test user: ${newUser.id}`);
  return newUser.id;
}

async function createTradesWithEmotions(userId) {
  console.log('📈 Creating trades with emotional states...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < sampleTrades.length; i++) {
    const trade = { ...sampleTrades[i], user_id: userId };
    
    console.log(`\n📊 Creating trade ${i + 1}/${sampleTrades.length}: ${trade.symbol} (${trade.emotional_state[0]})`);
    
    const { data, error } = await supabase
      .from('trades')
      .insert({
        user_id: trade.user_id,
        symbol: trade.symbol,
        market: trade.market,
        side: trade.side,
        quantity: trade.quantity,
        entry_price: trade.entry_price,
        exit_price: trade.exit_price,
        pnl: trade.pnl,
        emotional_state: trade.emotional_state,
        notes: trade.notes,
        trade_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
      
    if (error) {
      console.error(`❌ Error creating trade ${trade.symbol}:`, error);
      errorCount++;
    } else {
      console.log(`✅ Successfully created trade: ${trade.symbol} with emotion ${trade.emotional_state[0]}`);
      successCount++;
    }
  }
  
  console.log(`\n📊 Trade Creation Summary:`);
  console.log(`✅ Successfully created: ${successCount} trades`);
  console.log(`❌ Failed to create: ${errorCount} trades`);
  
  return { successCount, errorCount };
}

async function verifyTrades() {
  console.log('\n🔍 Verifying trades in database...');
  
  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching trades:', error);
    return null;
  }
  
  console.log(`✅ Found ${trades.length} trades in database`);
  
  // Check emotional states
  const emotionCounts = {};
  REQUIRED_EMOTIONS.forEach(emotion => {
    emotionCounts[emotion] = 0;
  });
  
  trades.forEach(trade => {
    if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
      trade.emotional_state.forEach(emotion => {
        if (emotionCounts[emotion] !== undefined) {
          emotionCounts[emotion]++;
        }
      });
    }
  });
  
  console.log('\n🎭 Emotional State Distribution:');
  Object.entries(emotionCounts).forEach(([emotion, count]) => {
    console.log(`  ${emotion}: ${count} trade(s)`);
  });
  
  const missingEmotions = Object.entries(emotionCounts)
    .filter(([emotion, count]) => count === 0)
    .map(([emotion]) => emotion);
    
  if (missingEmotions.length > 0) {
    console.log(`\n⚠️  Missing emotions: ${missingEmotions.join(', ')}`);
  } else {
    console.log('\n✅ All required emotions are represented!');
  }
  
  return { trades, emotionCounts, missingEmotions };
}

async function main() {
  try {
    // Step 1: Get or create user ID
    const userId = await getUserId();
    if (!userId) {
      console.error('❌ Failed to get user ID. Exiting.');
      return;
    }
    
    // Step 2: Create trades with emotions
    const { successCount, errorCount } = await createTradesWithEmotions(userId);
    
    if (successCount === 0) {
      console.error('❌ No trades were created successfully. Exiting.');
      return;
    }
    
    // Step 3: Verify trades
    const verification = await verifyTrades();
    
    if (verification && verification.missingEmotions.length === 0) {
      console.log('\n🎉 SUCCESS: All emotions have been created in the database!');
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Go to http://localhost:3000/dashboard');
      console.log('2. Go to http://localhost:3000/confluence');
      console.log('3. Verify emotional analysis appears on both pages');
      console.log('4. Test emotion filtering functionality');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some trades were created but emotions may be missing.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Execute the script
main();