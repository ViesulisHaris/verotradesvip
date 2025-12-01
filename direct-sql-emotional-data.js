const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🚀 DIRECT SQL EMOTIONAL DATA CREATION');
console.log('====================================');

// Use the anon key for basic operations
const supabaseUrl = 'https://bzmixuxautbmqbrqtufx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODA2MzIsImV4cCI6MjA3Nzg1NjYzMn0.Lm4bo_r__27b0Los00TpvD9KMgwKEOPlQT0waS5jWPk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const REQUIRED_EMOTIONS = ['ANXIOUS', 'CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'GREEDY', 'CALM'];

const sampleTrades = [
  {
    symbol: 'AAPL',
    market: 'stock',
    side: 'Buy',
    quantity: 100,
    entry_price: 150.00,
    exit_price: 155.00,
    pnl: 500.00,
    emotional_state: ['CONFIDENT'],
    notes: 'Confident trade - strong technical analysis'
  },
  {
    symbol: 'GOOGL',
    market: 'stock',
    side: 'Sell',
    quantity: 50,
    entry_price: 2800.00,
    exit_price: 2750.00,
    pnl: 2500.00,
    emotional_state: ['DISCIPLINED'],
    notes: 'Disciplined trade - followed exit plan exactly'
  },
  {
    symbol: 'TSLA',
    market: 'stock',
    side: 'Buy',
    quantity: 75,
    entry_price: 250.00,
    exit_price: 240.00,
    pnl: -750.00,
    emotional_state: ['ANXIOUS'],
    notes: 'Anxious trade - worried about missing opportunity'
  },
  {
    symbol: 'BTC',
    market: 'crypto',
    side: 'Buy',
    quantity: 0.5,
    entry_price: 45000.00,
    exit_price: 46000.00,
    pnl: 500.00,
    emotional_state: ['PATIENT'],
    notes: 'Patient trade - waited for right entry point'
  },
  {
    symbol: 'ETH',
    market: 'crypto',
    side: 'Sell',
    quantity: 2.0,
    entry_price: 3000.00,
    exit_price: 2900.00,
    pnl: 200.00,
    emotional_state: ['CALM'],
    notes: 'Calm trade - no emotional attachment'
  },
  {
    symbol: 'MSFT',
    market: 'stock',
    side: 'Buy',
    quantity: 150,
    entry_price: 350.00,
    exit_price: 340.00,
    pnl: -1500.00,
    emotional_state: ['FEARFUL'],
    notes: 'Fearful trade - afraid of missing out'
  },
  {
    symbol: 'NVDA',
    market: 'stock',
    side: 'Buy',
    quantity: 200,
    entry_price: 500.00,
    exit_price: 520.00,
    pnl: 4000.00,
    emotional_state: ['GREEDY'],
    notes: 'Greedy trade - took too much risk'
  },
  {
    symbol: 'META',
    market: 'stock',
    side: 'Sell',
    quantity: 100,
    entry_price: 200.00,
    exit_price: 180.00,
    pnl: 2000.00,
    emotional_state: ['IMPULSIVE'],
    notes: 'Impulsive trade - quick decision without analysis'
  }
];

async function getCurrentUser() {
  console.log('🔍 Getting current user...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      
      // Try to sign in with test credentials
      console.log('🔐 Attempting to sign in with test credentials...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      if (signInError) {
        console.error('Sign in error:', signInError);
        return null;
      }
      
      console.log('✅ Successfully signed in:', signInData.user?.id);
      return signInData.user;
    }
    
    console.log('✅ Found current user:', user?.id);
    return user;
  } catch (error) {
    console.error('Exception getting user:', error);
    return null;
  }
}

async function createTradesWithSQL(user) {
  console.log('📈 Creating trades with direct SQL...');
  
  if (!user) {
    console.error('❌ No user available, cannot create trades');
    return { successCount: 0, errorCount: sampleTrades.length };
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < sampleTrades.length; i++) {
    const trade = sampleTrades[i];
    
    console.log(`\n📊 Creating trade ${i + 1}/${sampleTrades.length}: ${trade.symbol} (${trade.emotional_state[0]})`);
    
    try {
      // Use RPC to call a SQL function or direct insert
      const { data, error } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          symbol: trade.symbol,
          market: trade.market,
          side: trade.side,
          quantity: trade.quantity,
          entry_price: trade.entry_price,
          exit_price: trade.exit_price,
          pnl: trade.pnl,
          emotional_state: trade.emotional_state,
          notes: trade.notes,
          trade_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error(`❌ Error creating trade ${trade.symbol}:`, error);
        errorCount++;
      } else {
        console.log(`✅ Successfully created trade: ${trade.symbol} with emotion ${trade.emotional_state[0]}`);
        console.log(`   Trade ID: ${data.id}`);
        successCount++;
      }
    } catch (tradeError) {
      console.error(`❌ Exception creating trade ${trade.symbol}:`, tradeError);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Trade Creation Summary:`);
  console.log(`✅ Successfully created: ${successCount} trades`);
  console.log(`❌ Failed to create: ${errorCount} trades`);
  
  return { successCount, errorCount };
}

async function verifyTrades() {
  console.log('\n🔍 Verifying trades in database...');
  
  try {
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
  } catch (error) {
    console.error('Exception verifying trades:', error);
    return null;
  }
}

async function main() {
  try {
    console.log('🎯 Starting emotional data creation process...');
    
    // Step 1: Get current user or sign in
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('❌ Failed to authenticate. Cannot proceed.');
      return;
    }
    
    // Step 2: Create trades
    const { successCount, errorCount } = await createTradesWithSQL(user);
    
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