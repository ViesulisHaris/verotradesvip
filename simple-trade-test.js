const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const cleanLine = line.trim().replace(/^["']|["']$/g, '');
  const match = cleanLine.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/generate-test-data`;
const TEST_EMAIL = 'testuser@verotrade.com';
const TEST_PASSWORD = 'TestPassword123!';

async function testTradeGeneration() {
  console.log('🚀 Testing trade generation...');
  
  try {
    // Authenticate first
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (error) {
      console.log('❌ Authentication failed:', error.message);
      return false;
    }
    
    console.log('✅ Authentication successful');
    console.log(`👤 User ID: ${data.user.id}`);
    
    // Now try to generate trades using service key
    const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ action: 'generate-trades' })
    });
    
    const responseData = await response.json();
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response data:', responseData);
    
    if (response.status === 200) {
      console.log('✅ Trade generation successful');
      console.log(`📈 Generated ${responseData.count} trades`);
      console.log(`🎯 Win rate: ${responseData.stats.winRate}%`);
      console.log(`💰 Total P&L: $${responseData.stats.totalPnL.toFixed(2)}`);
      return true;
    } else {
      console.log('❌ Trade generation failed:', responseData.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testTradeGeneration()
  .then(success => {
    if (success) {
      console.log('\n🎉 Trade generation test completed successfully!');
    } else {
      console.log('\n❌ Trade generation test failed!');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });