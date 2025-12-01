import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { validateUUID } from '@/lib/uuid-validation';

// Database connection
const supabaseUrl = 'https://bzmixuxautbmqbrqtufx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnR1ZngiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM1ODQzNjAwLCJleHAiOjE5NTE0MTk2MDB9.7J6K1oZzX2x3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test user ID (consistent across test runs) - using a valid UUID v4
const TEST_USER_ID = '00000000-0000-4000-8000-000000000001';

// Define types for test data
interface TestStrategy {
  id: string;
  name: string;
  description: string;
  rules: (string | { text: string; id: string })[];
}

interface TestTrade {
  id: string;
  strategy_id: string;
  symbol: string;
  side: string;
  quantity: number;
  entry_price: number;
  exit_price: number;
  pnl: number;
  trade_date: string;
  entry_time: string;
  exit_time: string;
}

// Test data structure - using proper UUID v4 format
const testStrategies: TestStrategy[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Test Strategy A',
    description: 'Strategy for testing basic functionality',
    rules: [
      'Enter trade only when price is above 200-day moving average',
      'Exit trade when price crosses below 50-day moving average'
    ]
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Test Strategy B',
    description: 'Strategy for testing basic functionality',
    rules: [
      'Enter trade only when volume is 50% above average',
      'Set stop loss at 2% below breakout level',
      'Take profit at 3x the risk amount'
    ]
  }
];

const testTrades: TestTrade[] = [
  // Strategy A trades
  {
    id: 'tttttttt-tttt-4ttt-8ttt-tttttttttt01',
    strategy_id: '11111111-1111-4111-8111-111111111111',
    symbol: 'AAPL',
    side: 'Buy',
    quantity: 100,
    entry_price: 150.25,
    exit_price: 155.50,
    pnl: 525.00,
    trade_date: '2024-01-15',
    entry_time: '09:30:00',
    exit_time: '10:45:00'
  },
  {
    id: 'tttttttt-tttt-4ttt-8ttt-tttttttttt02',
    strategy_id: '11111111-1111-4111-8111-111111111111',
    symbol: 'MSFT',
    side: 'Buy',
    quantity: 50,
    entry_price: 280.75,
    exit_price: 285.00,
    pnl: 212.50,
    trade_date: '2024-01-16',
    entry_time: '10:00:00',
    exit_time: '11:30:00'
  },
  {
    id: 'tttttttt-tttt-4ttt-8ttt-tttttttttt03',
    strategy_id: '11111111-1111-4111-8111-111111111111',
    symbol: 'GOOGL',
    side: 'Buy',
    quantity: 25,
    entry_price: 140.50,
    exit_price: 138.25,
    pnl: -56.25,
    trade_date: '2024-01-17',
    entry_time: '11:00:00',
    exit_time: '12:15:00'
  },
  
  // Strategy B trades
  {
    id: 'tttttttt-tttt-4ttt-8ttt-tttttttttt04',
    strategy_id: '22222222-2222-4222-8222-222222222222',
    symbol: 'TSLA',
    side: 'Buy',
    quantity: 75,
    entry_price: 220.50,
    exit_price: 225.00,
    pnl: 337.50,
    trade_date: '2024-01-18',
    entry_time: '09:30:00',
    exit_time: '10:30:00'
  },
  {
    id: 'tttttttt-tttt-4ttt-8ttt-tttttttttt05',
    strategy_id: '22222222-2222-4222-8222-222222222222',
    symbol: 'NVDA',
    side: 'Buy',
    quantity: 30,
    entry_price: 450.25,
    exit_price: 445.00,
    pnl: -157.50,
    trade_date: '2024-01-19',
    entry_time: '10:00:00',
    exit_time: '11:00:00'
  },
  {
    id: 'tttttttt-tttt-4ttt-8ttt-tttttttttt06',
    strategy_id: '22222222-2222-4222-8222-222222222222',
    symbol: 'AMD',
    side: 'Buy',
    quantity: 100,
    entry_price: 95.50,
    exit_price: 98.00,
    pnl: 250.00,
    trade_date: '2024-01-20',
    entry_time: '09:45:00',
    exit_time: '10:45:00'
  }
];

export async function POST(request: Request) {
  try {
    // Step 1: Clean up existing test data
    console.log('🧹 Cleaning up existing test data...');
    await cleanupTestData();

    // Step 2: Create strategies
    console.log('📋 Creating test strategies...');
    await createStrategies();

    // Step 3: Create strategy rules
    console.log('📝 Creating strategy rules...');
    await createStrategyRules();

    // Step 4: Create trades
    console.log('💰 Creating test trades...');
    await createTrades();

    // Step 5: Verify data creation
    console.log('🔍 Verifying data creation...');
    const verificationResults = await verifyDataCreation();

    console.log('\n✅ Test data creation completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      results: verificationResults
    });

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function cleanupTestData() {
  try {
    // Delete trades
    const { error: tradesError } = await supabase
      .from('trades')
      .delete()
      .in('strategy_id', ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']);
    
    if (tradesError) console.log('Note: trades cleanup:', tradesError.message);

    // Delete strategy rules
    const { error: rulesError } = await supabase
      .from('strategy_rules')
      .delete()
      .in('strategy_id', ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']);
    
    if (rulesError) console.log('Note: strategy_rules cleanup:', rulesError.message);

    // Delete strategies
    const { error: strategiesError } = await supabase
      .from('strategies')
      .delete()
      .in('id', ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']);
    
    if (strategiesError) console.log('Note: strategies cleanup:', strategiesError.message);

    console.log('✅ Cleanup completed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Note: Cleanup error (expected if tables don\'t exist):', errorMessage);
  }
}

async function createStrategies() {
  for (const strategy of testStrategies) {
    // Validate UUIDs before database operations
    try {
      validateUUID(strategy.id, 'strategy.id');
      validateUUID(TEST_USER_ID, 'TEST_USER_ID');
    } catch (validationError) {
      throw new Error(`Invalid UUID in strategy creation: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
    }

    const { data, error } = await supabase
      .from('strategies')
      .insert({
        id: strategy.id,
        user_id: TEST_USER_ID,
        name: strategy.name,
        description: strategy.description,
        rules: strategy.rules,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create strategy ${strategy.name}: ${error.message}`);
    }

    console.log(`  ✅ Created strategy: ${strategy.name}`);
  }
}

async function createStrategyRules() {
  for (const strategy of testStrategies) {
    // Validate strategy ID before processing rules
    try {
      validateUUID(strategy.id, 'strategy.id');
    } catch (validationError) {
      throw new Error(`Invalid strategy ID in rule creation: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
    }

    for (let i = 0; i < strategy.rules.length; i++) {
      const ruleId = crypto.randomUUID();
      
      // Validate rule ID before database operations
      try {
        validateUUID(ruleId, 'ruleId');
      } catch (validationError) {
        throw new Error(`Invalid rule ID generated: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
      }

      const { data, error } = await supabase
        .from('strategy_rules')
        .insert({
          id: ruleId,
          strategy_id: strategy.id,
          rule_text: strategy.rules[i],
          rule_order: i + 1,
          is_checked: false
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create rule for ${strategy.name}: ${error.message}`);
      }
    }
    console.log(`  ✅ Created ${strategy.rules.length} rules for ${strategy.name}`);
  }
}

async function createTrades() {
  for (const trade of testTrades) {
    // Validate UUIDs before database operations
    try {
      validateUUID(trade.id, 'trade.id');
      validateUUID(TEST_USER_ID, 'TEST_USER_ID');
      validateUUID(trade.strategy_id, 'trade.strategy_id');
    } catch (validationError) {
      throw new Error(`Invalid UUID in trade creation: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
    }

    const { data, error } = await supabase
      .from('trades')
      .insert({
        id: trade.id,
        user_id: TEST_USER_ID,
        strategy_id: trade.strategy_id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        entry_price: trade.entry_price,
        exit_price: trade.exit_price,
        pnl: trade.pnl,
        trade_date: trade.trade_date,
        entry_time: trade.entry_time,
        exit_time: trade.exit_time
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create trade ${trade.symbol}: ${error.message}`);
    }

    console.log(`  ✅ Created trade: ${trade.symbol}`);
  }
}


async function verifyDataCreation() {
  // Validate TEST_USER_ID before verification
  try {
    validateUUID(TEST_USER_ID, 'TEST_USER_ID');
  } catch (validationError) {
    throw new Error(`Invalid TEST_USER_ID in verification: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
  }

  // Check strategies
  const { data: strategies, error: strategiesError } = await supabase
    .from('strategies')
    .select('*')
    .eq('user_id', TEST_USER_ID);

  if (strategiesError) throw strategiesError;
  console.log(`\n📊 Verification Results:`);
  console.log(`  Strategies: ${strategies.length} created`);

  // Check strategy rules
  const strategyIds = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'];
  
  // Validate strategy IDs before verification
  for (const strategyId of strategyIds) {
    try {
      validateUUID(strategyId, 'strategyId');
    } catch (validationError) {
      throw new Error(`Invalid strategy ID in verification: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
    }
  }

  const { data: rules, error: rulesError } = await supabase
    .from('strategy_rules')
    .select('*')
    .in('strategy_id', strategyIds);

  if (rulesError) throw rulesError;
  console.log(`  Strategy Rules: ${rules.length} created`);

  // Check trades
  const { data: trades, error: tradesError } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', TEST_USER_ID);

  if (tradesError) throw tradesError;
  console.log(`  Trades: ${trades.length} created`);

  return {
    strategies: strategies.length,
    strategyRules: rules.length,
    trades: trades.length
  };
}