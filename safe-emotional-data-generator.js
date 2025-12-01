const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// SAFETY CONFIRMATION
console.log('🔒 SAFETY CONFIRMATION REQUIRED');
console.log('================================');
console.log('This script will ONLY CREATE data - NO DELETION OPERATIONS');
console.log('Required emotions: ANXIOUS, CONFIDENT, FEARFUL, DISCIPLINED, IMPULSIVE, PATIENT, GREEDY, CALM');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');
setTimeout(() => {
  console.log('✅ Safety confirmation received - proceeding with safe data generation...\n');
}, 3000);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Define the 8 required emotions exactly as specified
const REQUIRED_EMOTIONS = ['ANXIOUS', 'CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'GREEDY', 'CALM'];

// Realistic trading symbols
const TRADING_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM',
  'BTC', 'ETH', 'SPY', 'QQQ', 'GLD', 'SLV', 'OIL', 'EUR/USD'
];

// Market types
const MARKETS = ['Stock', 'Crypto', 'Forex', 'Commodity', 'ETF'];

// Strategy templates
const STRATEGY_TEMPLATES = [
  {
    name: 'Momentum Breakout',
    description: 'Capture strong price movements with volume confirmation',
    rules: ['High volume breakout', 'RSI > 50', 'Price above 20 SMA']
  },
  {
    name: 'Mean Reversion',
    description: 'Trade reversals from overextended conditions',
    rules: ['RSI < 30 or > 70', 'Price at support/resistance', 'Divergence signal']
  },
  {
    name: 'Trend Following',
    description: 'Follow established trends with pullback entries',
    rules: ['Price above 200 SMA', 'Higher highs/lows', 'Pullback to 50 SMA']
  },
  {
    name: 'Volatility Trading',
    description: 'Exploit high volatility environments with defined risk',
    rules: ['VIX > 20', 'Options flow analysis', 'Earnings catalyst']
  },
  {
    name: 'Scalping Strategy',
    description: 'Quick in-and-out trades with small profits',
    rules: ['Tight spreads', 'High liquidity', '1-5 min holds']
  }
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateRealisticPnL(emotion) {
  // Different emotions tend to have different P&L patterns
  const ranges = {
    'CONFIDENT': { min: 50, max: 500, positiveBias: 0.8 },
    'DISCIPLINED': { min: 25, max: 300, positiveBias: 0.75 },
    'PATIENT': { min: 30, max: 400, positiveBias: 0.7 },
    'CALM': { min: 20, max: 250, positiveBias: 0.65 },
    'ANXIOUS': { min: -200, max: 150, positiveBias: 0.4 },
    'FEARFUL': { min: -300, max: 100, positiveBias: 0.3 },
    'IMPULSIVE': { min: -400, max: 200, positiveBias: 0.35 },
    'GREEDY': { min: -250, max: 600, positiveBias: 0.45 }
  };
  
  const config = ranges[emotion] || ranges['CALM'];
  const isPositive = Math.random() < config.positiveBias;
  
  if (isPositive) {
    return getRandomFloat(config.min, config.max);
  } else {
    return -getRandomFloat(Math.abs(config.min), Math.abs(config.max));
  }
}

function generateTradeDate(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toISOString().split('T')[0];
}

async function createTestStrategies(userId) {
  console.log('🎯 Creating trading strategies...');
  
  const createdStrategies = [];
  
  for (let i = 0; i < STRATEGY_TEMPLATES.length; i++) {
    const template = STRATEGY_TEMPLATES[i];
    
    const strategy = {
      user_id: userId,
      name: template.name,
      description: template.description,
      is_active: Math.random() > 0.3, // 70% chance of being active
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('strategies')
      .insert(strategy)
      .select();
    
    if (error) {
      console.error(`❌ Error creating strategy ${template.name}:`, error.message);
    } else {
      console.log(`✅ Created strategy: ${template.name} (ID: ${data[0].id})`);
      createdStrategies.push(data[0]);
    }
  }
  
  return createdStrategies;
}

async function createTestTradesWithEmotions(userId, strategies) {
  console.log('📈 Creating test trades with emotional states...');
  
  const createdTrades = [];
  const emotionCounts = {};
  
  // Initialize emotion counts
  REQUIRED_EMOTIONS.forEach(emotion => {
    emotionCounts[emotion] = 0;
  });
  
  // Generate 75 trades (within the 50-100 range requested)
  const totalTrades = 75;
  const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
  const endDate = new Date();
  
  for (let i = 0; i < totalTrades; i++) {
    // Ensure each emotion appears multiple times
    const emotionIndex = i % REQUIRED_EMOTIONS.length;
    const primaryEmotion = REQUIRED_EMOTIONS[emotionIndex];
    emotionCounts[primaryEmotion]++;
    
    // Sometimes add secondary emotions (30% chance)
    const emotionalState = [primaryEmotion];
    if (Math.random() < 0.3) {
      const secondaryEmotion = getRandomElement(REQUIRED_EMOTIONS.filter(e => e !== primaryEmotion));
      emotionalState.push(secondaryEmotion);
    }
    
    const strategy = strategies.length > 0 ? getRandomElement(strategies) : null;
    const isBuy = Math.random() > 0.45; // 55% buy, 45% sell
    
    const trade = {
      user_id: userId,
      symbol: getRandomElement(TRADING_SYMBOLS),
      market: getRandomElement(MARKETS),
      side: isBuy ? 'Buy' : 'Sell',
      quantity: Math.floor(Math.random() * 900) + 100, // 100-1000
      entry_price: getRandomFloat(10, 500),
      exit_price: getRandomFloat(10, 500),
      pnl: generateRealisticPnL(primaryEmotion),
      trade_date: generateTradeDate(startDate, endDate),
      strategy_id: strategy ? strategy.id : null,
      emotional_state: emotionalState,
      entry_time: `${Math.floor(Math.random() * 6) + 9}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`,
      exit_time: `${Math.floor(Math.random() * 8) + 10}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`,
      notes: `Test trade - ${primaryEmotion} emotional state${emotionalState.length > 1 ? ` with ${emotionalState[1]}` : ''}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('trades')
      .insert(trade)
      .select();
    
    if (error) {
      console.error(`❌ Error creating trade ${i + 1}:`, error.message);
    } else {
      createdTrades.push(data[0]);
      if ((i + 1) % 10 === 0) {
        console.log(`✅ Created ${i + 1}/${totalTrades} trades...`);
      }
    }
  }
  
  console.log('\n📊 Emotion distribution in created trades:');
  REQUIRED_EMOTIONS.forEach(emotion => {
    console.log(`  ${emotion}: ${emotionCounts[emotion]} trades`);
  });
  
  return createdTrades;
}

async function verifyEmotionalData() {
  console.log('\n🔍 Verifying emotional data creation...');
  
  const { data: trades, error } = await supabase
    .from('trades')
    .select('emotional_state');
  
  if (error) {
    console.error('❌ Error verifying emotional data:', error.message);
    return false;
  }
  
  const uniqueEmotions = new Set();
  
  trades.forEach(trade => {
    if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
      trade.emotional_state.forEach(emotion => {
        if (typeof emotion === 'string') {
          uniqueEmotions.add(emotion.toUpperCase());
        }
      });
    }
  });
  
  const foundEmotions = Array.from(uniqueEmotions).sort();
  console.log('\n🎭 Emotions found in database:');
  foundEmotions.forEach(emotion => console.log(`  ✓ ${emotion}`));
  
  const missingEmotions = REQUIRED_EMOTIONS.filter(emotion => !foundEmotions.includes(emotion));
  
  if (missingEmotions.length === 0) {
    console.log('\n🎉 SUCCESS: All required emotions are present!');
    return true;
  } else {
    console.log(`\n❌ ISSUE: Missing emotions: ${missingEmotions.join(', ')}`);
    return false;
  }
}

async function safeDataGeneration() {
  try {
    console.log('🚀 STARTING SAFE EMOTIONAL DATA GENERATION');
    console.log('==========================================\n');
    
    // Wait for safety confirmation
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    // Get current user (will prompt for authentication if needed)
    console.log('🔐 Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication required. Please ensure you are logged in.');
      console.log('💡 Try logging in through the web application first, then run this script again.');
      return;
    }
    
    console.log(`✅ Authenticated as user: ${user.email || user.id}`);
    
    // Create strategies first
    const strategies = await createTestStrategies(user.id);
    
    // Create trades with emotional states
    const trades = await createTestTradesWithEmotions(user.id, strategies);
    
    // Verify the data was created correctly
    const verificationSuccess = await verifyEmotionalData();
    
    if (verificationSuccess) {
      console.log('\n🎉 SAFE DATA GENERATION COMPLETED SUCCESSFULLY!');
      console.log('===============================================');
      console.log(`✅ Created ${strategies.length} trading strategies`);
      console.log(`✅ Created ${trades.length} trades with emotional states`);
      console.log('✅ All 8 required emotions are represented');
      console.log('\n🚀 Emotional state analysis should now work on dashboard and confluence pages!');
    } else {
      console.log('\n❌ Data generation completed but verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error during safe data generation:', error.message);
  }
}

// Run the safe data generation
safeDataGeneration().then(() => {
  console.log('\n✅ Safe data generation process completed');
}).catch(error => {
  console.error('❌ Error during data generation:', error);
});