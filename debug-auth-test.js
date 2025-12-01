const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Debug Authentication Test');
console.log('================================');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  }
});

async function testAuth() {
  try {
    console.log('\n🧪 Testing login with testuser1000@verotrade.com...');
    
    const startTime = Date.now();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'testuser1000@verotrade.com',
      password: 'TestPassword123!'
    });
    
    const duration = Date.now() - startTime;
    console.log(`⏱️  Login attempt took ${duration}ms`);
    
    if (error) {
      console.error('❌ Login failed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code
      });
    } else {
      console.log('✅ Login successful!');
      console.log('User data:', {
        id: data.user?.id,
        email: data.user?.email,
        confirmed: data.user?.email_confirmed
      });
      
      // Test session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('📋 Session active:', !!sessionData.session);
      
      if (sessionData.session) {
        console.log('Session expires:', new Date(sessionData.session.expires_at * 1000));
      }
    }
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

testAuth();