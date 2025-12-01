// Comprehensive Supabase API Key Diagnostic Test
// This test will help identify the root cause of the API key rejection

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Starting comprehensive Supabase API key diagnostic...\n');

// Test configurations
const SUPABASE_URL = 'https://bzmixuxautbmqbrqtufx.supabase.co';

// The keys we need to test
const ORIGINAL_PUBLISHABLE_KEY = 'sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP';
const CURRENT_JWT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnR1ZngiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNTg0MzYwMCwiZXhwIjoxOTUxNDE5NjAwfQ.1J2K3oZzX2x3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m';

async function testApiKey(key, keyType) {
  console.log(`\n🧪 Testing ${keyType} API key...`);
  console.log(`📝 Key format: ${key.startsWith('eyJ') ? 'JWT' : 'Supabase format'}`);
  console.log(`📝 Key length: ${key.length} characters`);
  
  try {
    const client = createClient(SUPABASE_URL, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    // Test 1: Simple connection test
    console.log('  🔗 Testing basic connection...');
    const { data, error } = await client.from('_test_connection').select('count').limit(1);
    
    if (error) {
      console.log(`  ❌ Connection failed: ${error.message}`);
      console.log(`  📄 Error details: ${JSON.stringify(error, null, 2)}`);
      return { success: false, error: error.message, type: keyType };
    } else {
      console.log(`  ✅ Connection successful!`);
      return { success: true, type: keyType };
    }
  } catch (err) {
    console.log(`  ❌ Exception occurred: ${err.message}`);
    return { success: false, error: err.message, type: keyType };
  }
}

async function testEnvironmentVariables() {
  console.log('\n🌍 Testing environment variable loading...');
  
  // Check if we're in a Node.js environment that can access process.env
  if (typeof process !== 'undefined' && process.env) {
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log(`  📝 NEXT_PUBLIC_SUPABASE_URL: ${envUrl ? '✅ SET' : '❌ MISSING'}`);
    console.log(`  📝 NEXT_PUBLIC_SUPABASE_ANON_KEY: ${envKey ? '✅ SET' : '❌ MISSING'}`);
    
    if (envKey) {
      console.log(`  📝 Env key format: ${envKey.startsWith('eyJ') ? 'JWT' : 'Supabase format'}`);
      console.log(`  📝 Env key length: ${envKey.length} characters`);
      
      // Test the environment key
      return await testApiKey(envKey, 'Environment Variable');
    }
  } else {
    console.log('  ⚠️  Not in a Node.js environment or process.env not available');
  }
  
  return null;
}

async function analyzeKeyFormat() {
  console.log('\n🔬 Analyzing key formats...');
  
  console.log('\n📋 Original Supabase Publishable Key:');
  console.log(`  Format: Supabase native`);
  console.log(`  Prefix: ${ORIGINAL_PUBLISHABLE_KEY.split('_')[0]}`);
  console.log(`  Type: ${ORIGINAL_PUBLISHABLE_KEY.split('_')[1]}`);
  console.log(`  Length: ${ORIGINAL_PUBLISHABLE_KEY.length}`);
  
  console.log('\n📋 Current JWT Key:');
  console.log(`  Format: JWT`);
  
  // Try to decode the JWT
  try {
    const parts = CURRENT_JWT_KEY.split('.');
    if (parts.length === 3) {
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      console.log(`  Header: ${JSON.stringify(header, null, 2)}`);
      console.log(`  Payload: ${JSON.stringify(payload, null, 2)}`);
      console.log(`  Issuer: ${payload.iss}`);
      console.log(`  Ref: ${payload.ref}`);
      console.log(`  Role: ${payload.role}`);
      console.log(`  Issued At: ${new Date(payload.iat * 1000).toISOString()}`);
      console.log(`  Expires At: ${new Date(payload.exp * 1000).toISOString()}`);
      
      // Check if JWT is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.log(`  ⚠️  JWT is EXPIRED!`);
      } else {
        console.log(`  ✅ JWT is valid (not expired)`);
      }
    }
  } catch (err) {
    console.log(`  ❌ Failed to decode JWT: ${err.message}`);
  }
}

async function main() {
  console.log('🎯 Supabase API Key Diagnostic Test');
  console.log('=====================================');
  
  // Step 1: Analyze key formats
  await analyzeKeyFormat();
  
  // Step 2: Test both keys
  const originalKeyResult = await testApiKey(ORIGINAL_PUBLISHABLE_KEY, 'Original Supabase Key');
  const jwtKeyResult = await testApiKey(CURRENT_JWT_KEY, 'Current JWT Key');
  
  // Step 3: Test environment variables
  const envResult = await testEnvironmentVariables();
  
  // Step 4: Summary and recommendations
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('=====================');
  
  console.log(`\n🔑 Original Supabase Key: ${originalKeyResult.success ? '✅ WORKS' : '❌ FAILED'}`);
  if (!originalKeyResult.success) {
    console.log(`   Error: ${originalKeyResult.error}`);
  }
  
  console.log(`\n🔑 Current JWT Key: ${jwtKeyResult.success ? '✅ WORKS' : '❌ FAILED'}`);
  if (!jwtKeyResult.success) {
    console.log(`   Error: ${jwtKeyResult.error}`);
  }
  
  if (envResult) {
    console.log(`\n🌍 Environment Variable Key: ${envResult.success ? '✅ WORKS' : '❌ FAILED'}`);
    if (!envResult.success) {
      console.log(`   Error: ${envResult.error}`);
    }
  }
  
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  
  if (originalKeyResult.success && !jwtKeyResult.success) {
    console.log('✅ Use the ORIGINAL Supabase publishable key format');
    console.log('✅ Update .env file to use: sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP');
  } else if (jwtKeyResult.success && !originalKeyResult.success) {
    console.log('✅ The JWT format is correct, but ensure it\'s the right JWT from your Supabase project');
  } else if (!originalKeyResult.success && !jwtKeyResult.success) {
    console.log('❌ Both keys failed - check your Supabase project URL and API key generation');
    console.log('❌ Verify the Supabase project is active and API keys are properly configured');
  }
  
  console.log('\n🔧 NEXT STEPS');
  console.log('============');
  console.log('1. Identify which key format works for your Supabase project');
  console.log('2. Update the .env file with the correct key');
  console.log('3. Restart the development server');
  console.log('4. Test the authentication flow');
  
  console.log('\n🏁 Diagnostic complete!');
}

// Run the diagnostic
main().catch(console.error);