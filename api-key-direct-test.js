// Direct API Key Test - Validate with Supabase API
// Purpose: Test the current API key directly against Supabase to confirm the issue

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔍 [DIRECT_API_TEST] Testing API key directly with Supabase API...\n');

// Read the current API key from .env.local (highest priority)
function getCurrentApiKey() {
  const envLocalPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const match = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

// Read the current Supabase URL
function getCurrentSupabaseUrl() {
  const envLocalPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const match = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

// Test API key with a simple Supabase REST API call
function testApiKeyWithSupabase(apiKey, supabaseUrl) {
  return new Promise((resolve) => {
    console.log(`🔧 Testing API key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);
    console.log(`🌐 Testing against: ${supabaseUrl}`);
    
    // Test with a simple REST API call to get project info
    const testUrl = `${supabaseUrl}/rest/v1/`;
    
    const options = {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log(`📡 Making request to: ${testUrl}`);
    
    const req = https.request(testUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Response status: ${res.statusCode}`);
        console.log(`📊 Response headers:`, res.headers);
        
        if (res.statusCode === 200) {
          console.log('✅ API key is VALID - authentication successful');
          resolve({
            valid: true,
            statusCode: res.statusCode,
            message: 'API key is valid',
            response: data.substring(0, 200) + '...'
          });
        } else if (res.statusCode === 401) {
          console.log('❌ API key is INVALID - authentication failed');
          resolve({
            valid: false,
            statusCode: res.statusCode,
            message: 'API key is invalid or expired',
            response: data.substring(0, 200) + '...'
          });
        } else {
          console.log(`⚠️  Unexpected response: ${res.statusCode}`);
          resolve({
            valid: false,
            statusCode: res.statusCode,
            message: `Unexpected response: ${res.statusCode}`,
            response: data.substring(0, 200) + '...'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      resolve({
        valid: false,
        error: error.message,
        message: 'Request failed'
      });
    });
    
    req.setTimeout(10000, () => {
      console.log('⏰ Request timed out');
      req.destroy();
      resolve({
        valid: false,
        error: 'Request timeout',
        message: 'Request timed out after 10 seconds'
      });
    });
    
    req.end();
  });
}

// Analyze the API key structure
function analyzeApiKeyStructure(apiKey) {
  console.log('\n=== API KEY STRUCTURE ANALYSIS ===');
  
  if (!apiKey) {
    console.log('❌ No API key provided');
    return;
  }
  
  const segments = apiKey.split('.');
  console.log(`📏 Total length: ${apiKey.length}`);
  console.log(`🔢 Segments: ${segments.length}`);
  
  segments.forEach((segment, index) => {
    console.log(`  Segment ${index + 1}: ${segment.length} characters`);
    console.log(`    Preview: ${segment.substring(0, 20)}${segment.length > 20 ? '...' : ''}`);
  });
  
  // Check for placeholder patterns
  if (apiKey.includes('1234567890abcdef')) {
    console.log('⚠️  WARNING: Contains placeholder pattern "1234567890abcdef"');
  }
  
  // Check if it looks like a real JWT
  if (segments.length === 3) {
    try {
      // Try to decode the header (base64url)
      const header = JSON.parse(Buffer.from(segments[0], 'base64url').toString());
      console.log('📋 JWT Header:', header);
      
      // Try to decode the payload (base64url)
      const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString());
      console.log('📋 JWT Payload:', {
        iss: payload.iss,
        ref: payload.ref,
        role: payload.role,
        iat: payload.iat,
        exp: payload.exp
      });
      
      // Check if the project reference matches
      if (payload.ref) {
        console.log(`🎯 Project reference: ${payload.ref}`);
      }
      
    } catch (error) {
      console.log('❌ Failed to decode JWT:', error.message);
    }
  }
}

// Main execution
async function runDirectTest() {
  const apiKey = getCurrentApiKey();
  const supabaseUrl = getCurrentSupabaseUrl();
  
  if (!apiKey || !supabaseUrl) {
    console.log('❌ Missing API key or URL in environment files');
    return;
  }
  
  // Analyze the key structure first
  analyzeApiKeyStructure(apiKey);
  
  console.log('\n=== DIRECT SUPABASE API TEST ===');
  
  // Test the API key directly
  const result = await testApiKeyWithSupabase(apiKey, supabaseUrl);
  
  console.log('\n=== TEST RESULTS ===');
  console.log(`Result: ${result.valid ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`Status Code: ${result.statusCode}`);
  console.log(`Message: ${result.message}`);
  
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
  
  console.log('\n=== DIAGNOSIS ===');
  if (!result.valid && result.statusCode === 401) {
    console.log('🚨 CONFIRMED: API key is invalid for this Supabase project');
    console.log('🔧 This explains the "Invalid API key" error in the application');
    console.log('💡 The API key either:');
    console.log('   1. Contains placeholder characters (1234567890abcdef)');
    console.log('   2. Is from a different Supabase project');
    console.log('   3. Has been revoked or expired');
    console.log('   4. Was corrupted during copy/paste');
  } else if (result.valid) {
    console.log('✅ API key is valid - the issue may be elsewhere');
  } else {
    console.log('⚠️  Unexpected result - further investigation needed');
  }
  
  console.log('\n=== NEXT STEPS ===');
  console.log('1. Get fresh API keys from: https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/settings/api');
  console.log('2. Replace the current API key in .env.local');
  console.log('3. Restart the development server');
  console.log('4. Test authentication again');
}

// Run the test
runDirectTest().catch(console.error);