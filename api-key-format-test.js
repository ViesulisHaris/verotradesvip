// API Key Format Test for Valid Supabase Project
// Since the project URL is confirmed correct, we need to test which key format works

const { createClient } = require('@supabase/supabase-js');

console.log('🔑 API Key Format Test for Valid Supabase Project\n');

const SUPABASE_URL = 'https://bzmixuxautbmqbrqtufx.supabase.co';

// Test both key formats
const ORIGINAL_PUBLISHABLE_KEY = 'sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP';
const CURRENT_JWT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnR1ZngiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNTg0MzYwMCwiZXhwIjoxOTUxNDE5NjAwfQ.1J2K3oZzX2x3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m';

async function testKeyFormat(key, keyType) {
  console.log(`\n🧪 Testing ${keyType}...`);
  console.log(`📝 Key: ${key.substring(0, 20)}...`);
  
  try {
    const client = createClient(SUPABASE_URL, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    // Test 1: Try auth endpoint (should work with any valid key)
    console.log('  🔐 Testing auth endpoint...');
    const { data: authData, error: authError } = await client.auth.getSession();
    
    if (authError && authError.message.includes('Invalid API key')) {
      console.log(`  ❌ Auth failed: ${authError.message}`);
      return { success: false, error: 'Invalid API key', type: keyType };
    }
    
    console.log('  ✅ Auth endpoint accessible');

    // Test 2: Try to access a known table (strategies)
    console.log('  📊 Testing strategies table access...');
    const { data: strategiesData, error: strategiesError } = await client.from('strategies').select('count').limit(1);
    
    if (strategiesError) {
      console.log(`  ❌ Strategies table failed: ${strategiesError.message}`);
      if (strategiesError.message.includes('Invalid API key')) {
        return { success: false, error: 'Invalid API key', type: keyType };
      }
      if (strategiesError.message.includes('does not exist')) {
        console.log('  ✅ Key is valid, but strategies table does not exist (this is OK)');
        return { success: true, type: keyType, note: 'Table does not exist but key is valid' };
      }
    } else {
      console.log('  ✅ Strategies table accessible!');
      return { success: true, type: keyType, test: 'strategies' };
    }

    // Test 3: Try to access trades table
    console.log('  💰 Testing trades table access...');
    const { data: tradesData, error: tradesError } = await client.from('trades').select('count').limit(1);
    
    if (tradesError) {
      console.log(`  ❌ Trades table failed: ${tradesError.message}`);
      if (tradesError.message.includes('Invalid API key')) {
        return { success: false, error: 'Invalid API key', type: keyType };
      }
      if (tradesError.message.includes('does not exist')) {
        console.log('  ✅ Key is valid, but trades table does not exist (this is OK)');
        return { success: true, type: keyType, note: 'Table does not exist but key is valid' };
      }
    } else {
      console.log('  ✅ Trades table accessible!');
      return { success: true, type: keyType, test: 'trades' };
    }

    // If we get here, the key is valid but tables might not exist
    console.log('  ✅ Key format is valid (auth works, tables may not exist)');
    return { success: true, type: keyType, note: 'Auth works, tables may not exist' };
    
  } catch (err) {
    console.log(`  ❌ Exception occurred: ${err.message}`);
    return { success: false, error: err.message, type: keyType };
  }
}

async function main() {
  console.log('🎯 Testing which API key format works with your Supabase project\n');
  
  // Test both key formats
  const originalResult = await testKeyFormat(ORIGINAL_PUBLISHABLE_KEY, 'Original Supabase Key');
  const jwtResult = await testKeyFormat(CURRENT_JWT_KEY, 'Current JWT Key');
  
  // Provide clear diagnosis and solution
  console.log('\n📊 FINAL DIAGNOSIS');
  console.log('==================');
  
  if (originalResult.success && !jwtResult.success) {
    console.log('\n✅ SOLUTION FOUND:');
    console.log('🔑 The ORIGINAL Supabase key format works!');
    console.log('📝 Update your .env file with:');
    console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY=${ORIGINAL_PUBLISHABLE_KEY}`);
    console.log('\n❌ The JWT key is invalid for this project.');
    
  } else if (jwtResult.success && !originalResult.success) {
    console.log('\n✅ SOLUTION FOUND:');
    console.log('🔑 The JWT key format works!');
    console.log('📝 Your current .env file JWT should be correct.');
    console.log('❌ The original Supabase key format is rejected.');
    
  } else if (originalResult.success && jwtResult.success) {
    console.log('\n🤯 BOTH KEYS WORK!');
    console.log('📝 Either key format will work. Use the original format for consistency.');
    console.log(`📝 Recommended: ${ORIGINAL_PUBLISHABLE_KEY}`);
    
  } else {
    console.log('\n❌ NEITHER KEY WORKS!');
    console.log('🔍 This indicates:');
    console.log('   1. Both keys are invalid for this project');
    console.log('   2. The project may have different API key requirements');
    console.log('\n🔧 Recommended actions:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to Project Settings > API');
    console.log('   3. Copy the correct "anon" public key');
    console.log('   4. Update your .env file with the correct key');
  }
  
  console.log('\n🔧 NEXT STEPS');
  console.log('============');
  console.log('1. Update the .env file with the working key format');
  console.log('2. Restart the development server');
  console.log('3. Test the authentication flow');
  console.log('4. Verify the "invalid API key" error is resolved');
  
  console.log('\n🏁 Test complete!');
}

main().catch(console.error);