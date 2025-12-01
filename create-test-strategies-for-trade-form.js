/**
 * Create Test Strategies for Trade Form Testing
 * 
 * This script creates test strategies to ensure the trade form
 * has strategies to select from during testing.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTestStrategies() {
  console.log('🔧 Creating test strategies for trade form testing...');
  
  try {
    // First, get or create a test user
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }
    
    if (!user) {
      console.error('❌ No user found');
      return;
    }
    
    console.log('✅ Authenticated as:', user.email);
    
    // Check existing strategies
    const { data: existingStrategies, error: fetchError } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id);
    
    if (fetchError) {
      console.error('❌ Error fetching existing strategies:', fetchError.message);
      return;
    }
    
    console.log('📊 Existing strategies:', existingStrategies?.length || 0);
    
    if (existingStrategies && existingStrategies.length > 0) {
      console.log('✅ Strategies already exist, no need to create more');
      existingStrategies.forEach(strategy => {
        console.log(`  - ${strategy.name} (${strategy.id})`);
      });
      return;
    }
    
    // Create test strategies
    const testStrategies = [
      {
        name: 'Momentum Trading',
        description: 'Buy stocks showing upward momentum with volume confirmation',
        rules: [
          'Stock must be above 50-day moving average',
          'Volume must be above 20-day average',
          'RSI must be between 30-70',
          'Enter on breakout above resistance'
        ],
        winrate_min: 60,
        profit_factor_min: 1.5,
        is_active: true
      },
      {
        name: 'Mean Reversion',
        description: 'Buy oversold stocks and sell overbought stocks',
        rules: [
          'RSI must be below 30 for buy signal',
          'RSI must be above 70 for sell signal',
          'Stock must be within 10% of 200-day MA',
          'Stop loss at 2% below entry'
        ],
        winrate_min: 55,
        max_drawdown_max: 10,
        is_active: true
      },
      {
        name: 'Breakout Trading',
        description: 'Trade stocks breaking key resistance levels',
        rules: [
          'Stock must consolidate for 3+ days',
          'Breakout must be on high volume',
          'Price must close above resistance',
          'Target is 10% above breakout level'
        ],
        winrate_min: 65,
        profit_factor_min: 2.0,
        sharpe_ratio_min: 1.2,
        is_active: true
      }
    ];
    
    console.log(`📝 Creating ${testStrategies.length} test strategies...`);
    
    for (const strategy of testStrategies) {
      const { data: createdStrategy, error: insertError } = await supabase
        .from('strategies')
        .insert({
          ...strategy,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error(`❌ Error creating strategy "${strategy.name}":`, insertError.message);
      } else {
        console.log(`✅ Created strategy: ${createdStrategy.name} (${createdStrategy.id})`);
      }
    }
    
    // Verify strategies were created
    const { data: finalStrategies, error: verifyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    if (verifyError) {
      console.error('❌ Error verifying strategies:', verifyError.message);
    } else {
      console.log(`✅ Verification complete. Total active strategies: ${finalStrategies?.length || 0}`);
      finalStrategies?.forEach(strategy => {
        console.log(`  - ${strategy.name} (${strategy.id}) - Active: ${strategy.is_active}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
createTestStrategies().then(() => {
  console.log('🏁 Test strategy creation completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test strategy creation failed:', error);
  process.exit(1);
});