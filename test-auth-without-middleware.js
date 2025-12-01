const { createClient } = require('@supabase/supabase-js');

// Test authentication without middleware
async function testAuthWithoutMiddleware() {
  console.log('🧪 Testing authentication without middleware...');
  
  // Load environment variables
  require('dotenv').config();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  console.log('✅ Environment variables loaded');
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'sb-auth-token',
    },
  });
  
  console.log('✅ Supabase client created');
  
  // Test 1: Try to sign in with test credentials
  try {
    console.log('🔐 Testing sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'testuser@verotrade.com',
      password: 'testpassword123'
    });
    
    if (error) {
      console.log('❌ Sign in failed:', error.message);
      return;
    }
    
    console.log('✅ Sign in successful!');
    console.log('User:', data.user?.id, data.user?.email);
    
    // Test 2: Check session persistence
    console.log('🔍 Testing session persistence...');
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData.session) {
      console.log('✅ Session persisted successfully');
      console.log('Session user:', sessionData.session.user?.id);
    } else {
      console.log('❌ Session not persisted');
    }
    
    // Test 3: Test user retrieval
    console.log('🔍 Testing user retrieval...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ User retrieval failed:', userError.message);
    } else {
      console.log('✅ User retrieved successfully');
      console.log('User data:', userData.user?.id, userData.user?.email);
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
  }
}

// Run the test
testAuthWithoutMiddleware().then(() => {
  console.log('🏁 Authentication test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});