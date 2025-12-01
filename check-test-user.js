const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

console.log('🔍 [ENV DEBUG] Reading .env file from:', envPath);
console.log('🔍 [ENV DEBUG] .env file content:');
console.log(envContent);

envContent.split('\n').forEach(line => {
  // Remove leading/trailing quotes and whitespace
  const cleanLine = line.trim().replace(/^["']|["']$/g, '');
  const match = cleanLine.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
    console.log(`🔍 [ENV DEBUG] Parsed: ${match[1]} = ${match[2] ? 'SET' : 'EMPTY'}`);
  } else {
    console.log(`🔍 [ENV DEBUG] Skipped line: "${line}" -> cleaned: "${cleanLine}"`);
  }
});

console.log('🔍 [ENV DEBUG] Final envVars:', Object.keys(envVars));

// Test credentials
const TEST_EMAIL = 'testuser@verotrade.com';
const TEST_PASSWORD = 'TestPassword123!';

// Environment variables
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 [AUTH DEBUG] Starting authentication diagnosis...');
console.log(`🌐 [AUTH DEBUG] Supabase URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
console.log(`🔑 [AUTH DEBUG] Anon Key: ${supabaseAnonKey ? 'SET' : 'MISSING'}`);
console.log(`🔑 [AUTH DEBUG] Service Key: ${supabaseServiceKey ? 'SET' : 'MISSING'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ [AUTH DEBUG] Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with anon key (for testing normal auth flow)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client with service key (for admin operations)
const supabaseAdmin = supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

async function checkTestUser() {
  console.log('\n📋 [AUTH DEBUG] Step 1: Checking if test user exists...');
  
  try {
    // Try to sign in with test credentials first
    console.log(`🔐 [AUTH DEBUG] Attempting to sign in as ${TEST_EMAIL}...`);
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (signInError) {
      console.log(`❌ [AUTH DEBUG] Sign in failed: ${signInError.message}`);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('💡 [AUTH DEBUG] This suggests the user either does not exist or the password is incorrect');
        
        // Check if user exists by trying to sign up (which will fail if user exists)
        console.log('🔍 [AUTH DEBUG] Checking if user exists by attempting sign up...');
        const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          options: {
            emailRedirectTo: `${supabaseUrl}/dashboard`
          }
        });
        
        if (signUpError) {
          if (signUpError.message.includes('User already registered')) {
            console.log('✅ [AUTH DEBUG] User exists in the system but password is likely incorrect');
          } else {
            console.log(`❌ [AUTH DEBUG] Sign up check failed: ${signUpError.message}`);
          }
        } else {
          console.log('✅ [AUTH DEBUG] User was created successfully (did not exist before)');
          console.log('📧 [AUTH DEBUG] User would need to confirm email before signing in');
        }
      } else {
        console.log(`❌ [AUTH DEBUG] Unexpected sign in error: ${signInError.message}`);
      }
    } else {
      console.log('✅ [AUTH DEBUG] Sign in successful!');
      console.log(`👤 [AUTH DEBUG] User ID: ${signInData.user?.id}`);
      console.log(`📧 [AUTH DEBUG] User email: ${signInData.user?.email}`);
      console.log(`🎫 [AUTH DEBUG] Session valid: ${signInData.session ? 'YES' : 'NO'}`);
      
      // Sign out to clean up
      await supabaseAnon.auth.signOut();
      return true;
    }
  } catch (error) {
    console.error('💥 [AUTH DEBUG] Exception during user check:', error.message);
  }
  
  return false;
}

async function createTestUserIfNotExists() {
  console.log('\n🔧 [AUTH DEBUG] Step 2: Attempting to create test user...');
  
  if (!supabaseAdmin) {
    console.log('❌ [AUTH DEBUG] Service key not available, cannot create user programmatically');
    return false;
  }
  
  try {
    // First check if user already exists in auth.users
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.log(`❌ [AUTH DEBUG] Failed to list users: ${listError.message}`);
      return false;
    }
    
    const existingUser = existingUsers.users.find(user => user.email === TEST_EMAIL);
    
    if (existingUser) {
      console.log('✅ [AUTH DEBUG] Test user already exists in auth system');
      console.log(`👤 [AUTH DEBUG] User ID: ${existingUser.id}`);
      console.log(`📧 [AUTH DEBUG] User email: ${existingUser.email}`);
      console.log(`🔑 [AUTH DEBUG] User confirmed: ${existingUser.email_confirmed_at ? 'YES' : 'NO'}`);
      
      if (!existingUser.email_confirmed_at) {
        console.log('🔧 [AUTH DEBUG] User exists but email not confirmed. Confirming now...');
        
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { email_confirm: true }
        );
        
        if (confirmError) {
          console.log(`❌ [AUTH DEBUG] Failed to confirm email: ${confirmError.message}`);
        } else {
          console.log('✅ [AUTH DEBUG] Email confirmed successfully');
        }
      }
      
      return true;
    }
    
    // Create the user
    console.log('🔧 [AUTH DEBUG] Creating new test user...');
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        is_test_user: true,
        created_for: 'playwright_tests'
      }
    });
    
    if (createError) {
      console.log(`❌ [AUTH DEBUG] Failed to create user: ${createError.message}`);
      return false;
    }
    
    console.log('✅ [AUTH DEBUG] Test user created successfully!');
    console.log(`👤 [AUTH DEBUG] User ID: ${createData.user?.id}`);
    console.log(`📧 [AUTH DEBUG] User email: ${createData.user?.email}`);
    
    return true;
  } catch (error) {
    console.error('💥 [AUTH DEBUG] Exception during user creation:', error.message);
    return false;
  }
}

async function testAuthenticationFlow() {
  console.log('\n🧪 [AUTH DEBUG] Step 3: Testing complete authentication flow...');
  
  try {
    // Test sign in
    console.log('🔐 [AUTH DEBUG] Testing sign in...');
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (signInError) {
      console.log(`❌ [AUTH DEBUG] Sign in failed: ${signInError.message}`);
      return false;
    }
    
    console.log('✅ [AUTH DEBUG] Sign in successful!');
    console.log(`👤 [AUTH DEBUG] User ID: ${signInData.user?.id}`);
    console.log(`🎫 [AUTH DEBUG] Session created: ${signInData.session ? 'YES' : 'NO'}`);
    
    // Test session persistence
    console.log('🔄 [AUTH DEBUG] Testing session persistence...');
    const { data: sessionData, error: sessionError } = await supabaseAnon.auth.getSession();
    
    if (sessionError) {
      console.log(`❌ [AUTH DEBUG] Session check failed: ${sessionError.message}`);
    } else {
      console.log('✅ [AUTH DEBUG] Session persistence working');
      console.log(`👤 [AUTH DEBUG] Session user: ${sessionData.session?.user?.email}`);
    }
    
    // Test sign out
    console.log('🔓 [AUTH DEBUG] Testing sign out...');
    const { error: signOutError } = await supabaseAnon.auth.signOut();
    
    if (signOutError) {
      console.log(`❌ [AUTH DEBUG] Sign out failed: ${signOutError.message}`);
    } else {
      console.log('✅ [AUTH DEBUG] Sign out successful');
    }
    
    return true;
  } catch (error) {
    console.error('💥 [AUTH DEBUG] Exception during auth flow test:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 [AUTH DEBUG] Starting authentication diagnosis...\n');
  
  // Step 1: Check if test user exists
  const userExists = await checkTestUser();
  
  // Step 2: Create user if needed
  if (!userExists) {
    const userCreated = await createTestUserIfNotExists();
    if (!userCreated) {
      console.log('\n❌ [AUTH DEBUG] Failed to create test user. Authentication tests will likely fail.');
      process.exit(1);
    }
  }
  
  // Step 3: Test complete authentication flow
  const authFlowWorks = await testAuthenticationFlow();
  
  if (authFlowWorks) {
    console.log('\n✅ [AUTH DEBUG] Authentication system is working correctly!');
    console.log('🎯 [AUTH DEBUG] Tests should be able to authenticate successfully');
  } else {
    console.log('\n❌ [AUTH DEBUG] Authentication system has issues!');
    console.log('🚨 [AUTH DEBUG] Tests will likely fail due to authentication problems');
  }
}

main().catch(console.error);