const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fkxfupbfdkqpqjowgspf.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test user credentials (use existing test user or create one)
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'test123456';

async function executeTestDataGeneration() {
  console.log('🚀 Starting comprehensive test data generation...');
  
  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Step 1: Authenticate
    console.log('\n📝 Step 1: Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      
      // Try to sign up if login fails
      console.log('🔄 Trying to sign up...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      if (signUpError) {
        console.error('❌ Sign up failed:', signUpError.message);
        return;
      }
      
      console.log('✅ Sign up successful');
      
      // Try to sign in again
      const { data: retryAuthData, error: retryAuthError } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      if (retryAuthError) {
        console.error('❌ Retry authentication failed:', retryAuthError.message);
        return;
      }
      
      var session = retryAuthData.session;
    } else {
      console.log('✅ Authentication successful');
      var session = authData.session;
    }
    
    if (!session) {
      console.error('❌ No session obtained');
      return;
    }
    
    const token = session.access_token;
    console.log(`🔑 Got JWT token (length: ${token.length})`);
    
    // Step 2: Delete All Data
    console.log('\n🗑️ Step 2: Deleting all existing data...');
    const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/generate-test-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ action: 'delete-all' })
    });
    
    if (!deleteResponse.ok) {
      console.error('❌ Delete failed:', await deleteResponse.text());
      return;
    }
    
    const deleteResult = await deleteResponse.json();
    console.log('✅ Delete successful:', deleteResult.message);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Create Strategies
    console.log('\n📈 Step 3: Creating trading strategies...');
    const strategiesResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/generate-test-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ action: 'create-strategies' })
    });
    
    if (!strategiesResponse.ok) {
      console.error('❌ Strategies creation failed:', await strategiesResponse.text());
      return;
    }
    
    const strategiesResult = await strategiesResponse.json();
    console.log('✅ Strategies created successfully:', strategiesResult.message);
    console.log(`📊 Created ${strategiesResult.count} strategies`);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Generate Trades
    console.log('\n📊 Step 4: Generating trades with emotional states...');
    const tradesResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/generate-test-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ action: 'generate-trades' })
    });
    
    if (!tradesResponse.ok) {
      console.error('❌ Trades generation failed:', await tradesResponse.text());
      return;
    }
    
    const tradesResult = await tradesResponse.json();
    console.log('✅ Trades generated successfully:', tradesResult.message);
    console.log(`📊 Generated ${tradesResult.count} trades`);
    console.log(`🎯 Win rate: ${tradesResult.stats.winRate}%`);
    console.log(`📈 Total P&L: $${tradesResult.stats.totalPnL.toFixed(2)}`);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 5: Verify Data
    console.log('\n🔍 Step 5: Verifying generated data...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/generate-test-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ action: 'verify-data' })
    });
    
    if (!verifyResponse.ok) {
      console.error('❌ Verification failed:', await verifyResponse.text());
      return;
    }
    
    const verifyResult = await verifyResponse.json();
    console.log('✅ Verification completed:', verifyResult.message);
    
    const verification = verifyResult.verification;
    console.log('\n📊 Verification Results:');
    console.log(`📈 Total Trades: ${verification.summary.totalTrades}`);
    console.log(`🎯 Win Rate: ${verification.summary.winRate.toFixed(1)}%`);
    console.log(`💰 Total P&L: $${verification.summary.totalPnL.toFixed(2)}`);
    console.log(`📋 Total Strategies: ${verification.summary.totalStrategies}`);
    
    console.log('\n😊 Emotional States Distribution:');
    Object.entries(verification.emotionDistribution).forEach(([emotion, count]) => {
      console.log(`  ${emotion}: ${count}`);
    });
    
    console.log('\n🏢 Market Distribution:');
    Object.entries(verification.marketDistribution).forEach(([market, count]) => {
      console.log(`  ${market}: ${count}`);
    });
    
    console.log('\n📋 Strategy Usage:');
    Object.entries(verification.strategyDistribution).forEach(([strategy, count]) => {
      console.log(`  ${strategy}: ${count}`);
    });
    
    // Check if emotional states are properly distributed
    const emotionCount = Object.keys(verification.emotionDistribution).length;
    if (emotionCount >= 8) {
      console.log('\n✅ SUCCESS: All 8 emotional states are represented in the data!');
    } else {
      console.log(`\n⚠️  WARNING: Only ${emotionCount} emotional states found (expected 8)`);
    }
    
    console.log('\n🎉 Test data generation completed successfully!');
    console.log('📝 You can now navigate to /confluence or /dashboard to see the emotional analysis in action.');
    
  } catch (error) {
    console.error('❌ Error during test data generation:', error.message);
  }
}

// Alternative approach using the Next.js API endpoint
async function executeViaNextAPI() {
  console.log('🚀 Starting test data generation via Next.js API...');
  
  try {
    // First, let's try to use the local API endpoint
    const baseUrl = 'http://localhost:3000';
    
    // Step 1: Delete All Data
    console.log('\n🗑️ Step 1: Deleting all existing data...');
    const deleteResponse = await fetch(`${baseUrl}/api/generate-test-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'delete-all' })
    });
    
    if (!deleteResponse.ok) {
      console.error('❌ Delete failed:', await deleteResponse.text());
      return;
    }
    
    const deleteResult = await deleteResponse.json();
    console.log('✅ Delete successful:', deleteResult.message);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Create Strategies
    console.log('\n📈 Step 2: Creating trading strategies...');
    const strategiesResponse = await fetch(`${baseUrl}/api/generate-test-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'create-strategies' })
    });
    
    if (!strategiesResponse.ok) {
      console.error('❌ Strategies creation failed:', await strategiesResponse.text());
      return;
    }
    
    const strategiesResult = await strategiesResponse.json();
    console.log('✅ Strategies created successfully:', strategiesResult.message);
    console.log(`📊 Created ${strategiesResult.count} strategies`);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Generate Trades
    console.log('\n📊 Step 3: Generating trades with emotional states...');
    const tradesResponse = await fetch(`${baseUrl}/api/generate-test-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'generate-trades' })
    });
    
    if (!tradesResponse.ok) {
      console.error('❌ Trades generation failed:', await tradesResponse.text());
      return;
    }
    
    const tradesResult = await tradesResponse.json();
    console.log('✅ Trades generated successfully:', tradesResult.message);
    console.log(`📊 Generated ${tradesResult.count} trades`);
    console.log(`🎯 Win rate: ${tradesResult.stats.winRate}%`);
    console.log(`📈 Total P&L: $${tradesResult.stats.totalPnL.toFixed(2)}`);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Verify Data
    console.log('\n🔍 Step 4: Verifying generated data...');
    const verifyResponse = await fetch(`${baseUrl}/api/generate-test-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'verify-data' })
    });
    
    if (!verifyResponse.ok) {
      console.error('❌ Verification failed:', await verifyResponse.text());
      return;
    }
    
    const verifyResult = await verifyResponse.json();
    console.log('✅ Verification completed:', verifyResult.message);
    
    const verification = verifyResult.verification;
    console.log('\n📊 Verification Results:');
    console.log(`📈 Total Trades: ${verification.summary.totalTrades}`);
    console.log(`🎯 Win Rate: ${verification.summary.winRate.toFixed(1)}%`);
    console.log(`💰 Total P&L: $${verification.summary.totalPnL.toFixed(2)}`);
    console.log(`📋 Total Strategies: ${verification.summary.totalStrategies}`);
    
    console.log('\n😊 Emotional States Distribution:');
    Object.entries(verification.emotionDistribution).forEach(([emotion, count]) => {
      console.log(`  ${emotion}: ${count}`);
    });
    
    // Check if emotional states are properly distributed
    const emotionCount = Object.keys(verification.emotionDistribution).length;
    if (emotionCount >= 8) {
      console.log('\n✅ SUCCESS: All 8 emotional states are represented in the data!');
    } else {
      console.log(`\n⚠️  WARNING: Only ${emotionCount} emotional states found (expected 8)`);
    }
    
    console.log('\n🎉 Test data generation completed successfully!');
    console.log('📝 You can now navigate to /confluence or /dashboard to see the emotional analysis in action.');
    
  } catch (error) {
    console.error('❌ Error during test data generation:', error.message);
  }
}

// Execute the test data generation
console.log('🔄 Trying Next.js API approach first...');
executeViaNextAPI().catch(error => {
  console.log('❌ Next.js API approach failed, trying Supabase RPC approach...');
  executeTestDataGeneration();
});