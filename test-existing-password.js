const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

const TEST_USER_EMAIL = 'testuser@verotrade.com';

async function testPasswords() {
  console.log('🔍 [PASSWORD TEST] Testing different passwords...');
  
  const passwords = [
    'TestPassword123!',
    'TestPassword123!2025',
    'TestPassword1232025',
    'testpassword123!',
    'Testpassword123!'
  ];

  for (const password of passwords) {
    console.log(`🔍 Testing password: ${password}`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: password
      });

      if (error) {
        console.log(`❌ Failed: ${error.message}`);
      } else {
        console.log(`✅ SUCCESS! Password works: ${password}`);
        console.log(`📋 User data:`, {
          id: data.user?.id,
          email: data.user?.email,
          confirmed: !!data.user?.email_confirmed_at
        });
        return password;
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('❌ None of the passwords worked');
  return null;
}

// Run the password testing
testPasswords().then(workingPassword => {
  if (workingPassword) {
    console.log(`🎉 [SUCCESS] Working password found: ${workingPassword}`);
    process.exit(0);
  } else {
    console.log('💥 [FAILED] No working password found');
    process.exit(1);
  }
});