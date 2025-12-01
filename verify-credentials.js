const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Verifying Test Credentials');
console.log('=============================');

async function verifyCredentials() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('📧 Email: testuser1000@verotrade.com');
  console.log('🔑 Password: TestPassword123!');
  
  try {
    console.log('\n🧪 Attempting sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'testuser1000@verotrade.com',
      password: 'TestPassword123!'
    });
    
    if (error) {
      console.error('❌ Sign in failed:', error.message);
      console.error('Error details:', error);
      return false;
    }
    
    if (data.user && data.session) {
      console.log('✅ Sign in successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('Session expires at:', new Date(data.session.expires_at * 1000).toISOString());
      return true;
    } else {
      console.error('❌ No user or session returned');
      return false;
    }
  } catch (err) {
    console.error('💥 Exception:', err.message);
    return false;
  }
}

// Test user creation if login fails
async function createTestUser() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('\n🔧 Attempting to create test user...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'testuser1000@verotrade.com',
      password: 'TestPassword123!',
      options: {
        data: {
          display_name: 'Test User 1000'
        }
      }
    });
    
    if (error) {
      console.error('❌ User creation failed:', error.message);
      return false;
    }
    
    console.log('✅ User creation initiated!');
    console.log('User ID:', data.user?.id);
    console.log('Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    return true;
  } catch (err) {
    console.error('💥 Exception:', err.message);
    return false;
  }
}

// Run verification
async function main() {
  const loginSuccess = await verifyCredentials();
  
  if (!loginSuccess) {
    console.log('\n🔄 Login failed, attempting to create user...');
    const createSuccess = await createTestUser();
    
    if (createSuccess) {
      console.log('\n🔄 User created, trying login again...');
      await verifyCredentials();
    }
  }
}

main().catch(console.error);