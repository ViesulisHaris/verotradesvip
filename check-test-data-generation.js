const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkTestDataGeneration() {
  console.log('🔍 [DATA GENERATION] Checking test data generation process...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ [DATA GENERATION] Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // 1. Authenticate as testuser@verotrade.com
    console.log('\n🔍 [STEP 1] Authenticating as testuser@verotrade.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testuser@verotrade.com',
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.error('❌ [STEP 1] Authentication failed:', authError.message);
      return;
    }
    
    const authenticatedUserId = authData.user.id;
    console.log(`✅ [STEP 1] Authenticated successfully with User ID: ${authenticatedUserId}`);
    
    // 2. Check current data state
    console.log('\n🔍 [STEP 2] Checking current data state...');
    const { data: currentTrades, error: tradesError } = await supabase
      .from('trades')
      .select('id, created_at')
      .eq('user_id', authenticatedUserId);
    
    if (tradesError) {
      console.error('❌ [STEP 2] Error checking current trades:', tradesError.message);
      return;
    }
    
    console.log(`📊 [STEP 2] Current trades count: ${currentTrades.length}`);
    
    const { data: currentStrategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name')
      .eq('user_id', authenticatedUserId);
    
    if (strategiesError) {
      console.error('❌ [STEP 2] Error checking current strategies:', strategiesError.message);
      return;
    }
    
    console.log(`📊 [STEP 2] Current strategies count: ${currentStrategies.length}`);
    
    // 3. Call the test data generation API to see what happens
    console.log('\n🔍 [STEP 3] Testing test data generation API...');
    
    // First, let's try to delete all existing data
    console.log('📋 [STEP 3] Deleting existing data...');
    const deleteResponse = await fetch('http://localhost:3000/api/generate-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`
      },
      body: JSON.stringify({ action: 'delete-all' })
    });
    
    const deleteResult = await deleteResponse.json();
    console.log('📋 [STEP 3] Delete result:', deleteResult);
    
    // 4. Generate strategies
    console.log('\n📋 [STEP 4] Generating strategies...');
    const strategiesResponse = await fetch('http://localhost:3000/api/generate-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`
      },
      body: JSON.stringify({ action: 'create-strategies' })
    });
    
    const strategiesResult = await strategiesResponse.json();
    console.log('📋 [STEP 4] Strategies generation result:', strategiesResult);
    
    // 5. Generate trades
    console.log('\n📋 [STEP 5] Generating trades...');
    const tradesResponse = await fetch('http://localhost:3000/api/generate-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`
      },
      body: JSON.stringify({ action: 'generate-trades' })
    });
    
    const tradesResult = await tradesResponse.json();
    console.log('📋 [STEP 5] Trades generation result:', tradesResult);
    
    // 6. Verify the final data
    console.log('\n🔍 [STEP 6] Verifying final data state...');
    const { data: finalTrades, error: finalTradesError } = await supabase
      .from('trades')
      .select('id, symbol, pnl, created_at')
      .eq('user_id', authenticatedUserId);
    
    if (finalTradesError) {
      console.error('❌ [STEP 6] Error checking final trades:', finalTradesError.message);
      return;
    }
    
    console.log(`📊 [STEP 6] Final trades count: ${finalTrades.length}`);
    
    const { data: finalStrategies, error: finalStrategiesError } = await supabase
      .from('strategies')
      .select('id, name')
      .eq('user_id', authenticatedUserId);
    
    if (finalStrategiesError) {
      console.error('❌ [STEP 6] Error checking final strategies:', finalStrategiesError.message);
      return;
    }
    
    console.log(`📊 [STEP 6] Final strategies count: ${finalStrategies.length}`);
    
    // 7. Analysis
    console.log('\n🔍 [DATA GENERATION] ANALYSIS:');
    console.log(`✅ Expected trades: 100`);
    console.log(`📊 Actual trades generated: ${finalTrades.length}`);
    console.log(`✅ Expected strategies: 5`);
    console.log(`📊 Actual strategies generated: ${finalStrategies.length}`);
    
    if (finalTrades.length !== 100) {
      console.log('\n🚨 [PROBLEM] Trade generation is incomplete!');
      console.log('🔧 [POSSIBLE CAUSES]:');
      console.log('   1. API is failing partway through generation');
      console.log('   2. Database constraints are preventing some inserts');
      console.log('   3. Batch processing is failing silently');
      console.log('   4. Error in the generation logic');
      
      // Check if there are any error patterns in the generated trades
      if (finalTrades.length > 0) {
        const createdDates = finalTrades.map(t => new Date(t.created_at));
        const minDate = new Date(Math.min(...createdDates));
        const maxDate = new Date(Math.max(...createdDates));
        
        console.log(`📅 [INFO] Trade creation date range: ${minDate.toISOString()} to ${maxDate.toISOString()}`);
        
        // Check for duplicate symbols
        const symbolCounts = {};
        finalTrades.forEach(trade => {
          symbolCounts[trade.symbol] = (symbolCounts[trade.symbol] || 0) + 1;
        });
        
        console.log('📊 [INFO] Symbol distribution:');
        Object.entries(symbolCounts).forEach(([symbol, count]) => {
          console.log(`   ${symbol}: ${count} trades`);
        });
      }
    } else {
      console.log('\n✅ [SUCCESS] Trade generation completed successfully!');
    }
    
    // 8. Call verify-data API to get detailed statistics
    console.log('\n🔍 [STEP 7] Getting detailed verification...');
    const verifyResponse = await fetch('http://localhost:3000/api/generate-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`
      },
      body: JSON.stringify({ action: 'verify-data' })
    });
    
    const verifyResult = await verifyResponse.json();
    console.log('📋 [STEP 7] Verification result:', JSON.stringify(verifyResult, null, 2));
    
  } catch (error) {
    console.error('❌ [DATA GENERATION] Unexpected error:', error);
  }
}

checkTestDataGeneration();