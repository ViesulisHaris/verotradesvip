const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Credentials...');
console.log('=====================================');
console.log('Supabase URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('Anon Key:', supabaseAnonKey ? 'SET' : 'MISSING');
console.log('Service Role Key:', serviceRoleKey ? 'SET' : 'MISSING');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Test with anon key
console.log('🔄 Testing connection with anon key...');
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabaseAnon.from('information_schema.tables').select('table_name').limit(1);
    
    if (error) {
      console.error('❌ Anon key connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Anon key connection successful');
    
    // Test authentication with test credentials
    console.log('🔄 Testing authentication with testuser@verotrade.com...');
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: 'testuser@verotrade.com',
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.error('❌ Test user authentication failed:', authError.message);
      console.log('🔍 This might be expected if the test user doesn\'t exist');
      return true; // Connection worked, just test user doesn't exist
    }
    
    if (authData.user && authData.session) {
      console.log('✅ Test user authentication successful');
      console.log('👤 User ID:', authData.user.id);
      console.log('📧 User email:', authData.user.email);
      
      // Test strategies access
      console.log('🔄 Testing strategies table access...');
      const { data: strategiesData, error: strategiesError } = await supabaseAnon
        .from('strategies')
        .select('*')
        .limit(1);
      
      if (strategiesError) {
        console.error('❌ Strategies table access failed:', strategiesError.message);
      } else {
        console.log('✅ Strategies table access successful');
      }
      
      // Sign out the test user
      await supabaseAnon.auth.signOut();
    }
    
    return true;
  } catch (error) {
    console.error('❌ Anon connection test failed:', error.message);
    return false;
  }
}

// Test with service role key
async function testServiceRoleConnection() {
  if (!serviceRoleKey) {
    console.log('⚠️  Service role key not provided, skipping service role test');
    return true;
  }
  
  console.log('🔄 Testing connection with service role key...');
  const supabaseService = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    const { data, error } = await supabaseService.from('information_schema.tables').select('table_name').limit(1);
    
    if (error) {
      console.error('❌ Service role key connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Service role key connection successful');
    return true;
  } catch (error) {
    console.error('❌ Service role connection test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting authentication tests...\n');
  
  const anonSuccess = await testAnonConnection();
  console.log('');
  const serviceSuccess = await testServiceRoleConnection();
  console.log('');
  
  if (anonSuccess && serviceSuccess) {
    console.log('✅ All tests passed! Supabase credentials are working correctly.');
  } else {
    console.log('❌ Some tests failed. Check the error messages above.');
    process.exit(1);
  }
}

runTests().catch(console.error);