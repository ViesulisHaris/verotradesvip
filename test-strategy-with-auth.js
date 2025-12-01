// Test strategy loading with simulated authentication
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing strategy loading with authentication...');
console.log('Environment check:', {
  supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
  supabaseAnonKey: supabaseAnonKey ? 'SET' : 'MISSING',
  supabaseServiceKey: supabaseServiceKey ? 'SET' : 'MISSING'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Create client with service role for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

async function testStrategyLoadingWithAuth() {
  try {
    console.log('\n🚀 Step 1: Testing database connection...');
    
    // Test 1: Basic database connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Database connection error:', connectionError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    console.log('\n🚀 Step 2: Testing strategies table structure...');
    
    // Test 2: Check strategies table structure
    const { data: strategiesSchema, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'strategies')
      .order('ordinal_position');
    
    if (schemaError) {
      console.error('❌ Schema query error:', schemaError);
      return;
    }
    
    console.log('✅ Strategies table structure:');
    strategiesSchema?.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n🚀 Step 3: Testing strategies table access...');
    
    // Test 3: Direct strategies table query
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
    
    if (strategies.length > 0) {
      console.log('Sample strategy:', {
        id: strategies[0].id,
        name: strategies[0].name,
        user_id: strategies[0].user_id,
        is_active: strategies[0].is_active
      });
      
      console.log('\n🚀 Step 4: Testing user-specific strategies query...');
      
      // Test 4: User-specific strategies query
      const userId = strategies[0].user_id;
      const { data: userStrategies, error: userStrategiesError } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (userStrategiesError) {
        console.error('❌ User strategies query error:', userStrategiesError);
        return;
      }
      
      console.log('✅ User strategies query successful:', userStrategies?.length || 0, 'strategies found');
      
      if (userStrategies.length > 0) {
        console.log('\n🚀 Step 5: Testing strategy stats calculation...');
        
        // Test 5: Strategy stats calculation
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
    
    console.log('\n🚀 Step 6: Testing UUID validation...');
    
    // Test 6: UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (strategies.length > 0) {
      const strategyId = strategies[0].id;
      const userId = strategies[0].user_id;
      
      console.log('Strategy ID validation:', {
        value: strategyId,
        isValid: uuidRegex.test(strategyId),
        isNull: strategyId === null,
        isUndefined: strategyId === undefined
      });
      
      console.log('User ID validation:', {
        value: userId,
        isValid: uuidRegex.test(userId),
        isNull: userId === null,
        isUndefined: userId === undefined
      });
    }
    
  } catch (error) {
    console.error('💥 Unexpected error during testing:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testStrategyLoadingWithAuth().then(() => {
  console.log('\n📊 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});