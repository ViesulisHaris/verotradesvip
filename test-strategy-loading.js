const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testStrategyLoading() {
  console.log('🔍 Testing strategy loading from database...');
  
  try {
    // First check if we can authenticate
    console.log('📝 Step 1: Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError?.message || 'No user found');
      console.log('💡 This might be the issue - the TradeForm component requires authentication to load strategies');
      return;
    }
    
    console.log('✅ Authenticated user:', user.id);
    
    // Now check for strategies using the same query as in TradeForm
    console.log('📝 Step 2: Testing the same query as TradeForm...');
    const { data: strategies, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(100);
    
    if (error) {
      console.error('❌ Error fetching strategies:', error.message);
      console.log('🔍 Error details:', error);
      
      // Check if this is a schema cache issue
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('🚨 This appears to be a schema cache issue!');
        console.log('💡 The strategies table might not exist or there might be a cache problem');
      }
      
      return;
    }
    
    console.log('📊 Strategies found:', strategies?.length || 0);
    
    if (strategies && strategies.length > 0) {
      console.log('📝 Strategy details:');
      strategies.forEach((strategy, index) => {
        console.log(`  ${index + 1}. ID: ${strategy.id}, Name: ${strategy.name}, Active: ${strategy.is_active}`);
        if (strategy.rules && strategy.rules.length > 0) {
          console.log(`     Rules: ${strategy.rules.join(', ')}`);
        }
      });
      
      // Test formatting for dropdown
      console.log('📝 Step 3: Testing dropdown formatting...');
      const dropdownOptions = [
        { value: '', label: 'None' },
        ...strategies.map(strategy => ({
          value: strategy.id,
          label: strategy.name
        }))
      ];
      
      console.log('✅ Dropdown options formatted successfully:');
      dropdownOptions.forEach((option, index) => {
        console.log(`  ${index + 1}. Value: "${option.value}", Label: "${option.label}"`);
      });
      
      console.log('✅ Strategy loading test completed successfully!');
      console.log('💡 The strategies are being loaded correctly from the database');
      console.log('💡 If the dropdown is still empty, the issue might be in the TradeForm component itself');
    } else {
      console.log('⚠️ No active strategies found for this user');
      console.log('💡 This could explain why the dropdown is empty');
      console.log('💡 You may need to create some test strategies first');
      
      // Check if there are any strategies at all (including inactive ones)
      console.log('📝 Checking for any strategies (including inactive)...');
      const { data: allStrategies } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id);
        
      console.log('📊 Total strategies (including inactive):', allStrategies?.length || 0);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testStrategyLoading()
  .then(() => {
    console.log('\n✅ Strategy loading test completed!');
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });