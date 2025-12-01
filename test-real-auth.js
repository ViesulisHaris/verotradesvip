const { createClient } = require('@supabase/supabase-js');

// Test authentication with real credentials from login page
async function testRealAuth() {
  console.log('🧪 Testing authentication with real credentials...');
  
  // Load environment variables
  require('dotenv').config();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  console.log('✅ Environment variables loaded');
  
  // Create Supabase client with same config as login page
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
  
  // Test with credentials from login page
  const email = 'testuser@verotrade.com';
  const password = 'TestPassword123!';
  
  try {
    console.log(`🔐 Testing sign in with ${email}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      console.log('❌ Sign in failed:', error.message);
      console.log('Error details:', error);
      return;
    }
    
    console.log('✅ Sign in successful!');
    console.log('User:', data.user?.id, data.user?.email);
    
    // Test session persistence
    console.log('🔍 Testing session persistence...');
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData.session) {
      console.log('✅ Session persisted successfully');
      console.log('Session user:', sessionData.session.user?.id);
    } else {
      console.log('❌ Session not persisted');
    }
    
    // Test user retrieval
    console.log('🔍 Testing user retrieval...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ User retrieval failed:', userError.message);
    } else {
      console.log('✅ User retrieved successfully');
      console.log('User data:', userData.user?.id, userData.user?.email);
    }
    
    // Test sign out
    console.log('🔐 Testing sign out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.log('❌ Sign out failed:', signOutError.message);
    } else {
      console.log('✅ Sign out successful');
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
  }
}

// Run the test
testRealAuth().then(() => {
  console.log('🏁 Authentication test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});