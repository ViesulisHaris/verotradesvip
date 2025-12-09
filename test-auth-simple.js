/**
 * Simple authentication test to verify JWT token handling
 */

const { createClient } = require('@supabase/supabase-js');

async function testAuthentication() {
  console.log('🔍 Testing Supabase authentication...');
  
  // Test with environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('Supabase Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase environment variables are not properly configured');
    return false;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('trades').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
    return false;
  }
}

testAuthentication().then(success => {
  if (success) {
    console.log('🎉 Authentication test passed');
  } else {
    console.log('💥 Authentication test failed');
  }
}).catch(console.error);
