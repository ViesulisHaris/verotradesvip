const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Debugging middleware authentication...');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'SET' : 'MISSING');

// Create Supabase client with same config as middleware
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'sb-auth-token',
  },
});

async function testAuth() {
  try {
    console.log('\n🔄 Testing authentication with test user...');
    
    // Test login with the test user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'testuser@verotrade.com',
      password: 'TestPassword123!'
    });
    
    if (error) {
      console.error('❌ Login failed:', error.message);
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('User ID:', data.user?.id);
    console.log('Session expires at:', data.session?.expires_at);
    
    // Test getUser with the access token
    if (data.session?.access_token) {
      console.log('\n🔍 Testing getUser with access token...');
      const { data: userData, error: userError } = await supabase.auth.getUser(data.session.access_token);
      
      if (userError) {
        console.error('❌ getUser failed:', userError.message);
      } else {
        console.log('✅ getUser successful!');
        console.log('User ID from getUser:', userData.user?.id);
      }
    }
    
    // Check what the session data looks like
    console.log('\n📋 Session data structure:');
    console.log('Session object keys:', Object.keys(data.session || {}));
    console.log('Access token length:', data.session?.access_token?.length);
    console.log('Refresh token present:', !!data.session?.refresh_token);
    
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

testAuth();