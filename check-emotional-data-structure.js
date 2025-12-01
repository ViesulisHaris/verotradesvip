const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 CHECKING EMOTIONAL DATA STRUCTURE');
console.log('====================================');

const supabaseUrl = 'https://bzmixuxautbmqbrqtufx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODA2MzIsImV4cCI6MjA3Nzg1NjYzMn0.Lm4bo_r__27b0Los00TpvD9KMgwKEOPlQT0waS5jWPk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEmotionalDataStructure() {
  console.log('🔍 Checking emotional data structure...');
  
  try {
    // First, sign in to get proper access
    console.log('🔐 Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (signInError) {
      console.error('Sign in error:', signInError);
      return;
    }
    
    console.log('✅ Signed in successfully');
    
    // Check recent trades with emotional states
    console.log('\n📊 Checking recent trades with emotional states...');
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Error fetching trades:', error);
      return;
    }
    
    console.log(`✅ Found ${trades.length} recent trades`);
    
    trades.forEach((trade, index) => {
      console.log(`\n📈 Trade ${index + 1}:`);
      console.log(`   ID: ${trade.id}`);
      console.log(`   Symbol: ${trade.symbol}`);
      console.log(`   Market: ${trade.market}`);
      console.log(`   Side: ${trade.side}`);
      console.log(`   P&L: ${trade.pnl}`);
      console.log(`   Emotional State: ${JSON.stringify(trade.emotional_state)}`);
      console.log(`   Notes: ${trade.notes}`);
      console.log(`   Created: ${trade.created_at}`);
    });
    
    // Check the database schema for emotional_state column
    console.log('\n🔍 Checking database schema for emotional_state column...');
    
    // Try to get column information
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'trades' })
      .catch(() => ({ data: null, error: new Error('RPC not available') }));
      
    if (columnError) {
      console.log('⚠️  Could not get column info via RPC, checking manually...');
      
      // Try to insert a test trade to see the expected structure
      const testTrade = {
        user_id: signInData.user.id,
        symbol: 'TEST',
        market: 'stock',
        side: 'Buy',
        quantity: 1,
        entry_price: 100,
        exit_price: 110,
        pnl: 10,
        emotional_state: ['TEST_EMOTION'],
        notes: 'Test trade for emotional state structure',
        trade_date: new Date().toISOString().split('T')[0]
      };
      
      console.log('🧪 Testing emotional state structure with sample trade...');
      const { data: testData, error: testError } = await supabase
        .from('trades')
        .insert(testTrade)
        .select()
        .single();
        
      if (testError) {
        console.error('❌ Test trade failed:', testError);
      } else {
        console.log('✅ Test trade created successfully');
        console.log(`   Test trade emotional_state: ${JSON.stringify(testData.emotional_state)}`);
        
        // Clean up test trade
        await supabase
          .from('trades')
          .delete()
          .eq('id', testData.id);
      }
    }
    
  } catch (error) {
    console.error('Exception checking emotional data structure:', error);
  }
}

async function main() {
  await checkEmotionalDataStructure();
}

main();