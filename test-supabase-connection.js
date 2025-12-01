require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Test Supabase client configuration with environment variables
console.log('Testing Supabase client configuration...');

try {
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;  
  console.log('Environment variables loaded:');
  console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables');
  }
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client created successfully');
  
  // Test basic connection
  supabase.from('trades').select('count').then(result => {
    console.log('✅ Supabase connection test successful');
    console.log('Connection test result:', result);
  }).catch(error => {
    console.error('❌ Supabase connection test failed:', error.message);
  });
  
} catch (error) {
  console.error('❌ Supabase configuration test failed:', error.message);
  process.exit(1);
}