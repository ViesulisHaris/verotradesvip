// Direct test of strategy loading functions to identify the exact error
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing strategy loading directly...');
console.log('Environment check:', {
  supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
  supabaseAnonKey: supabaseAnonKey ? 'SET' : 'MISSING'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStrategyLoading() {
  try {
    console.log('\n🚀 Step 1: Testing authentication...');
    
    // Test 1: Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Authentication error:', userError);
      return;
    }
    
    if (!user) {
      console.log('⚠️ No authenticated user found');
      console.log('Testing with anonymous access...');
    } else {
      console.log('✅ User authenticated:', { id: user.id, email: user.email });
    }
    
    console.log('\n🚀 Step 2: Testing strategies table access...');
    
    // Test 2: Direct strategies table query
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .limit(5);
    
    if (strategiesError) {
      console.error('❌ Strategies query error:', strategiesError);
      
      // Check for specific error types
      if (strategiesError.message.includes('relation') && strategiesError.message.includes('does not exist')) {
        console.error('🚨 SCHEMA CACHE ISSUE: Table reference not found');
      }
      
      if (strategiesError.message.includes('permission')) {
        console.error('🚨 PERMISSION ISSUE: Access denied');
      }
      
      if (strategiesError.message.includes('uuid') || strategiesError.message.includes('undefined')) {
        console.error('🚨 UUID ISSUE: Invalid UUID format');
      }
      
      return;
    }
    
    console.log('✅ Strategies query successful:', strategies?.length || 0, 'strategies found');
    
    if (user && strategies.length > 0) {
      console.log('\n🚀 Step 3: Testing user-specific strategies query...');
      
      // Test 3: User-specific strategies query
      const { data: userStrategies, error: userStrategiesError } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (userStrategiesError) {
        console.error('❌ User strategies query error:', userStrategiesError);
        return;
      }
      
      console.log('✅ User strategies query successful:', userStrategies?.length || 0, 'strategies found');
      
      if (userStrategies.length > 0) {
        console.log('\n🚀 Step 4: Testing strategy stats calculation...');
        
        // Test 4: Strategy stats calculation
        const firstStrategy = userStrategies[0];
        console.log('Testing stats for strategy:', firstStrategy.id, firstStrategy.name);
        
        const { data: trades, error: tradesError } = await supabase
          .from('trades')
          .select('pnl, entry_time, exit_time, trade_date')
          .eq('strategy_id', firstStrategy.id)
          .not('pnl', 'is', null)
          .order('trade_date, entry_time')
          .limit(10);
        
        if (tradesError) {
          console.error('❌ Trades query error:', tradesError);
          return;
        }
        
        console.log('✅ Trades query successful:', trades?.length || 0, 'trades found');
        
        if (trades.length > 0) {
          console.log('Sample trade data:', trades[0]);
        }
      }
    }
    
    console.log('\n🚀 Step 5: Testing schema validation...');
    
    // Test 5: Schema validation
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['strategies', 'trades', 'users']);
    
    if (tablesError) {
      console.error('❌ Schema query error:', tablesError);
    } else {
      console.log('✅ Schema validation successful:', tables?.length || 0, 'tables found');
      console.log('Available tables:', tables?.map(t => t.table_name) || []);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error during testing:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testStrategyLoading().then(() => {
  console.log('\n📊 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});