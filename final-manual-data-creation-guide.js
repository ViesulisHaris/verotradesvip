const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('📋 FINAL MANUAL DATA CREATION GUIDE');
console.log('===================================');
console.log('Since automated data creation is facing persistence issues,');
console.log('this guide will help you create the required data manually.');
console.log('');

const REQUIRED_EMOTIONS = ['ANXIOUS', 'CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'GREEDY', 'CALM'];

console.log('🎯 REQUIRED EMOTIONS:');
REQUIRED_EMOTIONS.forEach((emotion, index) => {
  console.log(`  ${index + 1}. ${emotion}`);
});

console.log('\n📝 STEP-BY-STEP MANUAL CREATION:');
console.log('=====================================');

console.log('\n🔐 STEP 1: Authenticate');
console.log('1. Open your browser and go to: http://localhost:3000/login');
console.log('2. Login with: test@example.com');
console.log('3. Password: testpassword123');

console.log('\n🎯 STEP 2: Create Strategies (Optional but Recommended)');
console.log('1. Go to: http://localhost:3000/strategies (if available)');
console.log('2. Create these strategies:');
console.log('   - Momentum Breakout (Active)');
console.log('   - Mean Reversion (Active)');
console.log('   - Trend Following (Inactive)');

console.log('\n📈 STEP 3: Create Trades with Emotional States');
console.log('1. Go to: http://localhost:3000/log-trade');
console.log('2. Create the following trades one by one:');

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
    notes: 'Confident trade - strong technical analysis'
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
    notes: 'Disciplined trade - followed exit plan exactly'
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
    notes: 'Anxious trade - worried about missing opportunity'
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
    notes: 'Patient trade - waited for right entry point'
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
    notes: 'Calm trade - no emotional attachment'
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
    notes: 'Fearful trade - afraid of missing out'
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
    notes: 'Greedy trade - took too much risk'
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
    notes: 'Impulsive trade - quick decision without analysis'
  }
];

sampleTrades.forEach((trade, index) => {
  console.log(`\n  Trade ${index + 1}:`);
  console.log(`    Symbol: ${trade.symbol}`);
  console.log(`    Market: ${trade.market}`);
  console.log(`    Side: ${trade.side}`);
  console.log(`    Quantity: ${trade.quantity}`);
  console.log(`    Entry Price: $${trade.entry_price.toFixed(2)}`);
  console.log(`    Exit Price: $${trade.exit_price.toFixed(2)}`);
  console.log(`    P&L: $${trade.pnl.toFixed(2)}`);
  console.log(`    Emotional State: ${JSON.stringify(trade.emotional_state)}`);
  console.log(`    Notes: ${trade.notes}`);
});

console.log('\n🎭 STEP 4: Create Additional Multi-Emotion Trades');
console.log('Create 2-3 more trades with multiple emotions:');
console.log('1. Trade with ["CONFIDENT", "PATIENT"]');
console.log('2. Trade with ["DISCIPLINED", "CALM"]');
console.log('3. Trade with ["ANXIOUS", "FEARFUL"]');

console.log('\n🔍 STEP 5: Verification');
console.log('1. After creating all trades, go to: http://localhost:3000/dashboard');
console.log('2. Look for emotional analysis components');
console.log('3. Go to: http://localhost:3000/confluence');
console.log('4. Check for radar charts with all 8 emotions');
console.log('5. Test emotion filtering functionality');

console.log('\n📊 EXPECTED RESULTS:');
console.log('==================');
console.log('✅ Total trades: 8-11');
console.log('✅ Total strategies: 0-3');
console.log('✅ All 8 emotions represented');
console.log('✅ Emotional analysis working on dashboard');
console.log('✅ Emotional analysis working on confluence');
console.log('✅ Radar charts showing all emotions');

console.log('\n🚀 ALTERNATIVE: AUTOMATED APPROACH');
console.log('If manual creation works, the issue is with automated scripts.');
console.log('The data structure and authentication are working correctly.');
console.log('This suggests the emotional analysis components should work once data exists.');

console.log('\n✅ SUMMARY:');
console.log('==========');
console.log('1. Database is ready for data creation');
console.log('2. All 8 required emotions identified');
console.log('3. Manual creation approach provided');
console.log('4. Verification steps outlined');
console.log('5. Emotional analysis components should work once data is present');

console.log('\n🎯 NEXT STEPS:');
console.log('1. Follow the manual creation steps above');
console.log('2. Verify emotional analysis on both pages');
console.log('3. Test emotion filtering functionality');
console.log('4. Confirm radar charts display correctly');