const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('🔧 Creating test user for verification...');
  
  const testUser = {
    email: 'testuser1000@verotrade.com',
    password: 'TestPassword123!'
  };
  
  try {
    // First try to sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        emailRedirectTo: `${supabaseUrl}/auth/v1/verify`
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Test user already exists, proceeding with verification...');
        
        // Try to sign in to verify credentials work
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testUser.email,
          password: testUser.password
        });
        
        if (signInError) {
          console.error('❌ Test user exists but login failed:', signInError.message);
          console.log('🔧 Creating new test user with different credentials...');
          
          // Create a new test user
          const newUserEmail = `testuser${Date.now()}@verotrade.com`;
          const { data: newUserData, error: newUserError } = await supabase.auth.signUp({
            email: newUserEmail,
            password: 'TestPassword123!',
            options: {
              emailRedirectTo: `${supabaseUrl}/auth/v1/verify`
            }
          });
          
          if (newUserError) {
            console.error('❌ Failed to create new test user:', newUserError.message);
            return false;
          }
          
          console.log(`✅ New test user created: ${newUserEmail}`);
          console.log('🔧 Update test credentials in verification script to:');
          console.log(`   email: "${newUserEmail}"`);
          console.log(`   password: "TestPassword123!"`);
          return { email: newUserEmail, password: 'TestPassword123!' };
        } else {
          console.log('✅ Test user login successful!');
          return testUser;
        }
      } else {
        console.error('❌ Failed to create test user:', error.message);
        return false;
      }
    } else {
      console.log('✅ Test user created successfully!');
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Password: ${testUser.password}`);
      return testUser;
    }
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    return false;
  }
}

async function verifyUserInDatabase() {
  console.log('🔍 Verifying user in database...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'testuser1000@verotrade.com')
      .single();
    
    if (error) {
      console.log('ℹ️  User not found in users table (this is expected for new users)');
      return null;
    }
    
    if (data) {
      console.log('✅ User found in database:', data.id);
      return data;
    }
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting test user creation and verification...');
  console.log('='.repeat(60));
  
  const testUser = await createTestUser();
  if (!testUser) {
    console.log('❌ Failed to create or verify test user');
    process.exit(1);
  }
  
  await verifyUserInDatabase();
  
  console.log('\n📋 Test User Credentials:');
  console.log(`   Email: ${testUser.email}`);
  console.log(`   Password: ${testUser.password}`);
  console.log('\n🔧 Use these credentials in the user flow verification test.');
  
  console.log('\n✅ Test user setup completed successfully!');
}

main().catch(console.error);