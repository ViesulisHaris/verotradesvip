// This guide provides manual steps to create trades with emotional states
// Since automated scripts are failing due to API key issues, we'll use the browser

console.log('📝 MANUAL TRADE CREATION GUIDE');
console.log('==============================');
console.log('');
console.log('Since automated scripts are failing due to API key issues,');
console.log('please follow these manual steps to create trades with emotions:');
console.log('');
console.log('1. Open your browser and navigate to: http://localhost:3000/log-trade');
console.log('2. Log in with your test account');
console.log('3. Create the following trades with emotional states:');
console.log('');

const tradesToCreate = [
  {
    symbol: 'AAPL',
    side: 'Buy',
    quantity: 100,
    entryPrice: 150.00,
    exitPrice: 155.00,
    emotion: 'CONFIDENT',
    notes: 'Confident trade - strong technical analysis'
  },
  {
    symbol: 'GOOGL',
    side: 'Sell',
    quantity: 50,
    entryPrice: 2800.00,
    exitPrice: 2750.00,
    emotion: 'DISCIPLINED',
    notes: 'Disciplined trade - followed exit plan exactly'
  },
  {
    symbol: 'TSLA',
    side: 'Buy',
    quantity: 75,
    entryPrice: 250.00,
    exitPrice: 240.00,
    emotion: 'ANXIOUS',
    notes: 'Anxious trade - worried about missing opportunity'
  },
  {
    symbol: 'BTC',
    side: 'Buy',
    quantity: 0.5,
    entryPrice: 45000.00,
    exitPrice: 47000.00,
    emotion: 'GREEDY',
    notes: 'Greedy trade - wanted more profits'
  },
  {
    symbol: 'ETH',
    side: 'Sell',
    quantity: 10,
    entryPrice: 3200.00,
    exitPrice: 3150.00,
    emotion: 'PATIENT',
    notes: 'Patient trade - waited for right entry'
  },
  {
    symbol: 'MSFT',
    side: 'Buy',
    quantity: 60,
    entryPrice: 300.00,
    exitPrice: 295.00,
    emotion: 'FEARFUL',
    notes: 'Fearful trade - scared of losses'
  },
  {
    symbol: 'NVDA',
    side: 'Buy',
    quantity: 40,
    entryPrice: 500.00,
    exitPrice: 520.00,
    emotion: 'IMPULSIVE',
    notes: 'Impulsive trade - jumped in without analysis'
  },
  {
    symbol: 'META',
    side: 'Sell',
    quantity: 30,
    entryPrice: 350.00,
    exitPrice: 345.00,
    emotion: 'CALM',
    notes: 'Calm trade - followed the plan'
  }
];

console.log('TRADES TO CREATE:');
console.log('=================');
tradesToCreate.forEach((trade, index) => {
  console.log(`${index + 1}. Symbol: ${trade.symbol}`);
  console.log(`   Side: ${trade.side}`);
  console.log(`   Quantity: ${trade.quantity}`);
  console.log(`   Entry Price: $${trade.entryPrice}`);
  console.log(`   Exit Price: $${trade.exitPrice}`);
  console.log(`   Emotion: ${trade.emotion}`);
  console.log(`   Notes: ${trade.notes}`);
  console.log('');
});

console.log('VERIFICATION STEPS:');
console.log('==================');
console.log('1. After creating all trades, navigate to: http://localhost:3000/dashboard');
console.log('2. Check if the emotional state analysis radar chart shows emotions');
console.log('3. Navigate to: http://localhost:3000/confluence');
console.log('4. Check if the emotional state analysis shows identical emotions');
console.log('5. Test emotion filtering functionality');
console.log('');
console.log('REQUIRED EMOTIONS TO VERIFY:');
console.log('============================');
console.log('- CONFIDENT');
console.log('- ANXIOUS');
console.log('- FEARFUL');
console.log('- DISCIPLINED');
console.log('- IMPULSIVE');
console.log('- PATIENT');
console.log('- GREEDY');
console.log('- CALM');
console.log('');
console.log('📊 EXPECTED RESULT:');
console.log('==================');
console.log('All 8 emotions should appear in the emotional state analysis');
console.log('on both dashboard and confluence pages.');
console.log('');
console.log('🎯 COMPLETION CRITERIA:');
console.log('=======================');
console.log('✅ Trades actually exist in database (verified count > 0)');
console.log('✅ Emotional state analysis on dashboard shows emotions');
console.log('✅ Emotional state analysis on confluence shows identical emotions');
console.log('✅ All 8 emotions are represented across the trades');