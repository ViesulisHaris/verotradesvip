// Supabase Authentication Diagnostic Script (CommonJS)
// This script will help identify root cause of "Invalid API key" errors

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 [SUPABASE AUTH DIAGNOSTIC] Starting comprehensive authentication diagnosis...\n');

// 1. Check Environment Variables
console.log('📋 Step 1: Environment Variables Check');
console.log('=====================================');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl ? '✅ SET' : '❌ MISSING');
console.log('ANON Key:', supabaseAnonKey ? '✅ SET' : '❌ MISSING');
console.log('Service Role Key:', serviceRoleKey ? '✅ SET' : '❌ MISSING');

if (supabaseUrl) {
  console.log('\nURL Details:');
  console.log('- Full URL:', supabaseUrl);
  console.log('- Protocol:', supabaseUrl.startsWith('https') ? '✅ HTTPS' : '❌ INVALID');
  console.log('- Domain:', supabaseUrl.replace('https://', '').replace('.supabase.co', ''));
}

if (supabaseAnonKey) {
  console.log('\nANON Key Details:');
  console.log('- Format:', supabaseAnonKey.startsWith('eyJ') ? '✅ JWT Format' : '❌ Invalid Format');
  console.log('- Length:', supabaseAnonKey.length, 'characters');
  console.log('- First 10 chars:', supabaseAnonKey.substring(0, 10) + '...');
}

// 2. Test ANON Key Authentication
console.log('\n📋 Step 2: ANON Key Authentication Test');
console.log('========================================');

if (supabaseUrl && supabaseAnonKey) {
  try {
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ ANON client created successfully');
    
    // Test basic connection
    console.log('🔄 Testing basic connection...');
    
    anonClient.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.log('❌ Session test failed:', error.message);
        if (error.message.includes('Invalid API key')) {
          console.log('🚨 CONFIRMED: Invalid API Key error with ANON key');
        }
      } else {
        console.log('✅ Session test successful');
        console.log('- Session exists:', !!data.session);
      }
      
      // Test sign in
      console.log('🔄 Testing sign in with test credentials...');
      anonClient.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      }).then(({ data, error }) => {
        if (error) {
          console.log('❌ Sign in test failed:', error.message);
          if (error.message.includes('Invalid API key')) {
            console.log('🚨 CONFIRMED: Invalid API Key error during sign in');
          }
          if (error.message.includes('Invalid login credentials')) {
            console.log('✅ API Key is valid (credentials error is expected)');
          }
        } else {
          console.log('✅ Sign in test successful');
          console.log('- User ID:', data.user?.id);
        }
        
        // Continue to service role test
        testServiceRole();
      });
    });
    
  } catch (error) {
    console.log('❌ ANON client creation failed:', error.message);
    testServiceRole();
  }
} else {
  console.log('❌ Cannot test ANON key - missing credentials');
  testServiceRole();
}

function testServiceRole() {
  // 3. Test Service Role Key
  console.log('\n📋 Step 3: Service Role Key Test');
  console.log('==================================');

  if (supabaseUrl && serviceRoleKey) {
    try {
      const serviceClient = createClient(supabaseUrl, serviceRoleKey);
      console.log('✅ Service client created successfully');
      
      // Test admin operations
      console.log('🔄 Testing admin access...');
      serviceClient.auth.admin.listUsers().then(({ data, error }) => {
        if (error) {
          console.log('❌ Admin access failed:', error.message);
          if (error.message.includes('Invalid API key')) {
            console.log('🚨 CONFIRMED: Invalid API Key error with Service Role key');
          }
        } else {
          console.log('✅ Admin access successful');
          console.log('- Users count:', data.users.length);
        }
        
        // JWT Token Analysis
        analyzeJWT();
      });
      
    } catch (error) {
      console.log('❌ Service client creation failed:', error.message);
      analyzeJWT();
    }
  } else {
    console.log('❌ Cannot test Service Role key - missing credentials');
    analyzeJWT();
  }
}

function analyzeJWT() {
  // 4. JWT Token Analysis
  console.log('\n📋 Step 4: JWT Token Analysis');
  console.log('==============================');

  if (supabaseAnonKey) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(supabaseAnonKey, { complete: true });
      
      console.log('✅ ANON Key JWT Analysis:');
      console.log('- Header:', JSON.stringify(decoded.header, null, 2));
      console.log('- Issuer (iss):', decoded.payload.iss);
      console.log('- Audience (aud):', decoded.payload.aud);
      console.log('- Role:', decoded.payload.role);
      console.log('- Expires:', new Date(decoded.payload.exp * 1000).toISOString());
      console.log('- Issued At:', new Date(decoded.payload.iat * 1000).toISOString());
      
      // Check if issuer matches project
      if (supabaseUrl) {
        const expectedIssuer = `https://${supabaseUrl.replace('https://', '').replace('.supabase.co', '')}.supabase.co`;
        const issuerMatches = decoded.payload.iss === expectedIssuer || decoded.payload.iss === supabaseUrl;
        console.log('- Issuer Match:', issuerMatches ? '✅ YES' : '❌ NO');
        if (!issuerMatches) {
          console.log('  Expected:', expectedIssuer);
          console.log('  Actual:', decoded.payload.iss);
        }
      }
      
    } catch (error) {
      console.log('❌ JWT analysis failed:', error.message);
      console.log('This suggests key is not a valid JWT token');
    }
  }

  if (serviceRoleKey) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(serviceRoleKey, { complete: true });
      
      console.log('\n✅ Service Role Key JWT Analysis:');
      console.log('- Header:', JSON.stringify(decoded.header, null, 2));
      console.log('- Issuer (iss):', decoded.payload.iss);
      console.log('- Role:', decoded.payload.role);
      console.log('- Expires:', new Date(decoded.payload.exp * 1000).toISOString());
      
    } catch (error) {
      console.log('❌ Service Role JWT analysis failed:', error.message);
    }
  }

  // 5. Summary and Recommendations
  console.log('\n📋 Step 5: Diagnosis Summary');
  console.log('============================');

  console.log('\n🎯 MOST LIKELY ISSUES:');
  console.log('1. API Keys don\'t match Supabase project URL');
  console.log('2. Keys might be from a different Supabase project');
  console.log('3. Keys could be placeholder/example keys');

  console.log('\n🔧 RECOMMENDED FIXES:');
  console.log('1. Get fresh API keys from Supabase dashboard');
  console.log('2. Verify project URL matches keys');
  console.log('3. Update .env file with correct credentials');

  console.log('\n✅ DIAGNOSTIC COMPLETE');
}