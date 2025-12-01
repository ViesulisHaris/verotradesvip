const { createClient } = require('@supabase/supabase-js');

// Database connection
const supabaseUrl = 'https://bzmixuxautbmqbrqtufx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnR1ZngiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM1ODQzNjAwLCJleHAiOjE5NTE0MTk2MDB9.7J6K1oZzX2x3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  console.log('🔍 Testing database connection with service key...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('strategies')
      .select('count')
      .single();
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('Error details:', error);
      return false;
    } else {
      console.log('✅ Database connection successful!');
      console.log(`   Current strategies count: ${data.count || 0}`);
      return true;
    }
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function main() {
  console.log('=== Testing Service Key Connection ===\n');
  
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ Cannot proceed - database connection failed');
    process.exit(1);
  }

  console.log('\n=== Test Complete ===');
}

// Run script
if (require.main === module) {
  main();
}