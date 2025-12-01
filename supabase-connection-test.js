/**
 * Supabase Connection Diagnostic Test
 * This script tests the Supabase connection and environment variables
 * to identify issues causing the "TypeError: Failed to fetch" errors.
 */

require('dotenv').config({ path: '.env' });

console.log('🔍 [DEBUG] Starting Supabase Connection Diagnostic Test\n');

// 1. Test Environment Variables
console.log('1. Testing Environment Variables:');
console.log('===============================');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ SET' : '❌ MISSING'}`);
if (supabaseUrl) {
  console.log(`  Value: ${supabaseUrl}`);
  console.log(`  Format: ${supabaseUrl.startsWith('https://') ? '✅ Valid URL format' : '❌ Invalid URL format'}`);
}

console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ SET' : '❌ MISSING'}`);
if (supabaseAnonKey) {
  console.log(`  Length: ${supabaseAnonKey.length} characters`);
  console.log(`  Format: ${supabaseAnonKey.startsWith('eyJ') ? '✅ Valid JWT format' : '❌ Invalid JWT format'}`);
}

console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? '✅ SET' : '❌ MISSING'}`);
if (supabaseServiceRoleKey) {
  console.log(`  Length: ${supabaseServiceRoleKey.length} characters`);
  console.log(`  Format: ${supabaseServiceRoleKey.startsWith('eyJ') ? '✅ Valid JWT format' : '❌ Invalid JWT format'}`);
}

// 2. Test URL Connectivity
console.log('\n2. Testing URL Connectivity:');
console.log('===========================');

const https = require('https');
const { URL } = require('url');

if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    console.log(`Hostname: ${url.hostname}`);
    console.log(`Protocol: ${url.protocol}`);
    
    // Test basic HTTP connection
    const req = https.request(supabaseUrl, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Status Message: ${res.statusMessage}`);
      console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response Length: ${data.length} characters`);
        console.log(`Response Preview: ${data.substring(0, 200)}...`);
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Connection Error: ${error.message}`);
      console.log(`Error Code: ${error.code}`);
      console.log(`Error Stack: ${error.stack}`);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Connection Timeout');
      req.destroy();
    });
    
    req.end();
  } catch (error) {
    console.log(`❌ URL Parsing Error: ${error.message}`);
  }
} else {
  console.log('❌ Cannot test connectivity - URL is missing');
}

// 3. Test Supabase Client Creation
console.log('\n3. Testing Supabase Client Creation:');
console.log('===================================');

try {
  const { createClient } = require('@supabase/supabase-js');
  
  if (supabaseUrl && supabaseAnonKey) {
    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client created successfully');
    
    // Test a simple API call
    console.log('Testing simple API call...');
    supabase.from('profiles').select('count', { count: 'exact', head: true })
      .then(({ data, error, count, status }) => {
        if (error) {
          console.log('❌ API Call Error:');
          console.log(`  Message: ${error.message}`);
          console.log(`  Code: ${error.code}`);
          console.log(`  Details: ${JSON.stringify(error.details, null, 2)}`);
          console.log(`  Hint: ${error.hint}`);
        } else {
          console.log('✅ API Call Successful:');
          console.log(`  Status: ${status}`);
          console.log(`  Count: ${count}`);
        }
      })
      .catch((error) => {
        console.log('❌ API Call Exception:');
        console.log(`  Message: ${error.message}`);
        console.log(`  Stack: ${error.stack}`);
      });
  } else {
    console.log('❌ Cannot create Supabase client - missing URL or API key');
  }
} catch (error) {
  console.log('❌ Supabase Client Creation Error:');
  console.log(`  Message: ${error.message}`);
  console.log(`  Stack: ${error.stack}`);
}

// 4. Summary
console.log('\n4. Summary:');
console.log('===========');

const issues = [];
if (!supabaseUrl) issues.push('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!supabaseAnonKey) issues.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
if (supabaseUrl && !supabaseUrl.startsWith('https://')) issues.push('Invalid URL format');
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) issues.push('Invalid API key format');

if (issues.length === 0) {
  console.log('✅ No obvious configuration issues detected');
  console.log('   The problem might be:');
  console.log('   - Network connectivity issues');
  console.log('   - Supabase service downtime');
  console.log('   - CORS or firewall restrictions');
  console.log('   - Region-specific access problems');
} else {
  console.log('❌ Configuration Issues Found:');
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
}

console.log('\n🔍 [DEBUG] Supabase Connection Diagnostic Test Complete\n');