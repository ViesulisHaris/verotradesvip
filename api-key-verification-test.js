// API Key Verification Test
// Test the actual API key being loaded by the application

console.log('🔍 [API_KEY_TEST] Starting API Key Verification...\n');

// Test 1: Check environment variables directly
console.log('1️⃣ Testing environment variables:');
console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log('   📏 ANON_KEY Length:', key.length);
  console.log('   🔑 ANON_KEY Start:', key.substring(0, 20) + '...');
  console.log('   🏁 ANON_KEY End:', '...' + key.substring(key.length - 20));
  console.log('   🔍 JWT Format:', key.startsWith('eyJ') ? 'VALID' : 'INVALID');
  console.log('   ⚠️  Length Check:', key.length >= 300 ? 'VALID (300+)' : 'TOO SHORT');
}

// Test 2: Try to create Supabase client
console.log('\n2️⃣ Testing Supabase client creation:');
try {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('   ❌ Missing environment variables');
  } else {
    console.log('   🔧 Creating client...');
    const client = createClient(supabaseUrl, supabaseAnonKey);
    console.log('   ✅ Client created successfully');
    
    // Test 3: Try to make a simple API call
    console.log('\n3️⃣ Testing API connectivity:');
    client.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.log('   ❌ API call failed:', error.message);
        if (error.message.includes('Invalid') || error.message.includes('401')) {
          console.log('   🔍 Likely cause: Invalid API key');
        }
      } else {
        console.log('   ✅ API call successful - no session (expected for anonymous)');
      }
    }).catch((err) => {
      console.log('   ❌ API call exception:', err.message);
    });
  }
} catch (error) {
  console.log('   ❌ Client creation failed:', error.message);
}

console.log('\n🎯 [API_KEY_TEST] Verification Complete');