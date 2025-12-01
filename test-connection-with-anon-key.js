const { createClient } = require('@supabase/supabase-js');

// Try with anon key first
const supabaseUrl = 'https://bzmixuxautbmqbrqtufx.supabase.co';
const supabaseAnonKey = 'sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing database connection with anon key...');
  
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
  console.log('=== Testing Database Connection ===\n');
  
  await testConnection();
  
  console.log('\n=== Test Complete ===');
}

// Run the script
if (require.main === module) {
  main();
}