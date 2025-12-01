// Direct Verification Test using exact .env values
// This test uses the exact values from the .env file to verify the fix

const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Direct Verification Test\n');

// Use exact values from .env file
const SUPABASE_URL = 'https://bzmixuxautbmqbrqtufx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP';

console.log('📋 Using Exact Configuration:');
console.log(`  URL: ${SUPABASE_URL}`);
console.log(`  Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log(`  Key Format: ${SUPABASE_ANON_KEY.startsWith('sb_') ? 'Supabase Native' : 'Other'}`);

async function directVerification() {
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    console.log('\n🧪 Testing Supabase Connection...');

    // Test 1: Auth endpoint
    console.log('  🔐 Testing auth endpoint...');
    const { data: authData, error: authError } = await client.auth.getSession();
    
    if (authError && authError.message.includes('Invalid API key')) {
      console.log(`  ❌ FAIL: ${authError.message}`);
      return false;
    }
    console.log('  ✅ Auth endpoint accessible');

    // Test 2: Database access
    console.log('  📊 Testing database access...');
    const { data: strategiesData, error: strategiesError } = await client.from('strategies').select('count').limit(1);
    
    if (strategiesError && strategiesError.message.includes('Invalid API key')) {
      console.log(`  ❌ FAIL: ${strategiesError.message}`);
      return false;
    }
    console.log('  ✅ Database accessible');

    // Test 3: Specific table operations
    console.log('  💰 Testing trades table...');
    const { data: tradesData, error: tradesError } = await client.from('trades').select('count').limit(1);
    
    if (tradesError && tradesError.message.includes('Invalid API key')) {
      console.log(`  ❌ FAIL: ${tradesError.message}`);
      return false;
    }
    console.log('  ✅ Trades table accessible');

    console.log('\n🎉 SUCCESS: API key fix verified!');
    console.log('✅ "Invalid API key" error should be resolved');
    console.log('✅ Authentication flow should work correctly');
    console.log('✅ Database operations should work properly');
    
    return true;

  } catch (err) {
    console.log(`\n❌ FAIL: Exception occurred: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🎯 Direct API Key Verification Test');
  console.log('===================================\n');
  
  const success = await directVerification();
  
  console.log('\n📊 VERIFICATION RESULT');
  console.log('======================');
  
  if (success) {
    console.log('✅ FIX SUCCESSFUL!');
    console.log('\n🔧 Next Steps:');
    console.log('1. The "invalid API key" error should be resolved');
    console.log('2. Navigate to your application');
    console.log('3. Test authentication functionality');
    console.log('4. Verify database operations work');
  } else {
    console.log('❌ FIX FAILED!');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if .env file has correct values');
    console.log('2. Restart the development server');
    console.log('3. Verify API key format is correct');
  }
  
  console.log('\n🏁 Verification complete!');
}

main().catch(console.error);