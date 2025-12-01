// Targeted Supabase Connection Test
// This test will use a real table that should exist in the database

const { createClient } = require('@supabase/supabase-js');

console.log('🎯 Targeted Supabase Connection Test\n');

const SUPABASE_URL = 'https://bzmixuxautbmqbrqtufx.supabase.co';

// Test both key formats with real database operations
const ORIGINAL_PUBLISHABLE_KEY = 'sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP';
const CURRENT_JWT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnR1ZngiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNTg0MzYwMCwiZXhwIjoxOTUxNDE5NjAwfQ.1J2K3oZzX2x3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m';

async function testRealConnection(key, keyType) {
  console.log(`\n🧪 Testing ${keyType} with real database operations...`);
  
  try {
    const client = createClient(SUPABASE_URL, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    // Test 1: Try to access strategies table (should exist based on the codebase)
    console.log('  📊 Testing strategies table access...');
    const { data: strategiesData, error: strategiesError } = await client.from('strategies').select('count').limit(1);
    
    if (strategiesError) {
      console.log(`  ❌ Strategies table failed: ${strategiesError.message}`);
      if (strategiesError.message.includes('Invalid API key')) {
        return { success: false, error: 'Invalid API key', type: keyType };
      }
    } else {
      console.log(`  ✅ Strategies table accessible!`);
      return { success: true, type: keyType, test: 'strategies' };
    }

    // Test 2: Try to access trades table (should exist based on the codebase)
    console.log('  💰 Testing trades table access...');
    const { data: tradesData, error: tradesError } = await client.from('trades').select('count').limit(1);
    
    if (tradesError) {
      console.log(`  ❌ Trades table failed: ${tradesError.message}`);
      if (tradesError.message.includes('Invalid API key')) {
        return { success: false, error: 'Invalid API key', type: keyType };
      }
    } else {
      console.log(`  ✅ Trades table accessible!`);
      return { success: true, type: keyType, test: 'trades' };
    }

    // Test 3: Try to get auth status (this should work with any valid key)
    console.log('  🔐 Testing auth status...');
    const { data: authData, error: authError } = await client.auth.getSession();
    
    if (authError) {
      console.log(`  ❌ Auth test failed: ${authError.message}`);
      if (authError.message.includes('Invalid API key')) {
        return { success: false, error: 'Invalid API key', type: keyType };
      }
    } else {
      console.log(`  ✅ Auth endpoint accessible!`);
      return { success: true, type: keyType, test: 'auth' };
    }

    return { success: false, error: 'All database operations failed', type: keyType };
    
  } catch (err) {
    console.log(`  ❌ Exception occurred: ${err.message}`);
    return { success: false, error: err.message, type: keyType };
  }
}

async function checkSupabaseProjectStatus() {
  console.log('\n🌐 Checking Supabase project status...');
  
  try {
    // Try to fetch the project status without authentication
    const response = await fetch(SUPABASE_URL);
    
    if (response.ok) {
      console.log('  ✅ Supabase project URL is reachable');
      return true;
    } else {
      console.log(`  ❌ Supabase project returned status: ${response.status}`);
      return false;
    }
  } catch (err) {
    console.log(`  ❌ Cannot reach Supabase project: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 This test will determine which API key format works with your Supabase project\n');
  
  // Check if the project is reachable
  const projectReachable = await checkSupabaseProjectStatus();
  
  if (!projectReachable) {
    console.log('\n❌ Supabase project is not reachable. Check the URL and project status.');
    return;
  }
  
  // Test both key formats
  const originalResult = await testRealConnection(ORIGINAL_PUBLISHABLE_KEY, 'Original Supabase Key');
  const jwtResult = await testRealConnection(CURRENT_JWT_KEY, 'Current JWT Key');
  
  // Provide clear diagnosis
  console.log('\n📊 FINAL DIAGNOSIS');
  console.log('==================');
  
  if (originalResult.success && !jwtResult.success) {
    console.log('\n✅ SOLUTION FOUND:');
    console.log('🔑 The ORIGINAL Supabase key format works!');
    console.log('📝 Use this key in your .env file:');
    console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY=${ORIGINAL_PUBLISHABLE_KEY}`);
    console.log('\n❌ The JWT key is invalid for this project.');
    
  } else if (jwtResult.success && !originalResult.success) {
    console.log('\n✅ SOLUTION FOUND:');
    console.log('🔑 The JWT key format works!');
    console.log('📝 The current JWT in your .env file should be correct.');
    console.log('❌ The original Supabase key format is rejected.');
    
  } else if (originalResult.success && jwtResult.success) {
    console.log('\n🤯 UNEXPECTED: Both keys work!');
    console.log('📝 Either key format should work. Use the original format for consistency.');
    
  } else {
    console.log('\n❌ CRITICAL ISSUE: Neither key format works!');
    console.log('🔍 This indicates problems with:');
    console.log('   1. The Supabase project URL');
    console.log('   2. The API keys themselves');
    console.log('   3. The Supabase project configuration');
    console.log('\n🔧 Recommended actions:');
    console.log('   1. Verify the Supabase project is active');
    console.log('   2. Generate new API keys from the Supabase dashboard');
    console.log('   3. Check if the project URL is correct');
  }
  
  console.log('\n🏁 Test complete!');
}

main().catch(console.error);