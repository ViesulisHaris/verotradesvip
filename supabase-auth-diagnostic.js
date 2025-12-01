// Supabase Authentication Diagnostic Script
// This script will help identify the root cause of "Invalid API key" errors

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
    const { data, error } = await anonClient.from('_test_connection').select('*').limit(1);
    
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      if (error.message.includes('Invalid API key')) {
        console.log('🚨 CONFIRMED: Invalid API Key error with ANON key');
      }
      if (error.message.includes('relation "_test_connection" does not exist')) {
        console.log('✅ Connection successful (table doesn\'t exist is expected)');
      }
    } else {
      console.log('✅ Basic connection successful');
    }
    
    // Test auth session
    console.log('🔄 Testing auth session...');
    const { data: sessionData, error: sessionError } = await anonClient.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session test failed:', sessionError.message);
    } else {
      console.log('✅ Session test successful');
      console.log('- Session exists:', !!sessionData.session);
    }
    
  } catch (error) {
    console.log('❌ ANON client creation failed:', error.message);
  }
} else {
  console.log('❌ Cannot test ANON key - missing credentials');
}

// 3. Test Service Role Key
console.log('\n📋 Step 3: Service Role Key Test');
console.log('==================================');

if (supabaseUrl && serviceRoleKey) {
  try {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    console.log('✅ Service client created successfully');
    
    // Test admin operations
    console.log('🔄 Testing admin access...');
    const { data: usersData, error: usersError } = await serviceClient.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Admin access failed:', usersError.message);
      if (usersError.message.includes('Invalid API key')) {
        console.log('🚨 CONFIRMED: Invalid API Key error with Service Role key');
      }
    } else {
      console.log('✅ Admin access successful');
      console.log('- Users count:', usersData.users.length);
    }
    
  } catch (error) {
    console.log('❌ Service client creation failed:', error.message);
  }
} else {
  console.log('❌ Cannot test Service Role key - missing credentials');
}

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
    console.log('This suggests the key is not a valid JWT token');
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

// 5. Test Authentication Flow
console.log('\n📋 Step 5: Authentication Flow Test');
console.log('====================================');

if (supabaseUrl && supabaseAnonKey) {
  try {
    const testClient = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('🔄 Testing sign up...');
    const { data: signUpData, error: signUpError } = await testClient.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (signUpError) {
      console.log('❌ Sign up failed:', signUpError.message);
      if (signUpError.message.includes('Invalid API key')) {
        console.log('🚨 CONFIRMED: Invalid API Key error during sign up');
      }
    } else {
      console.log('✅ Sign up successful (test user created)');
    }
    
    // Test sign in
    console.log('🔄 Testing sign in...');
    const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      if (signInError.message.includes('Invalid API key')) {
        console.log('🚨 CONFIRMED: Invalid API Key error during sign in');
      }
    } else {
      console.log('✅ Sign in successful');
      console.log('- User ID:', signInData.user?.id);
      console.log('- Email:', signInData.user?.email);
    }
    
  } catch (error) {
    console.log('❌ Authentication flow test failed:', error.message);
  }
}

// 6. Summary and Recommendations
console.log('\n📋 Step 6: Diagnosis Summary');
console.log('============================');

console.log('\n🎯 MOST LIKELY ISSUES:');
console.log('1. API Keys don\'t match the Supabase project URL');
console.log('2. Keys might be from a different Supabase project');
console.log('3. Keys could be placeholder/example keys');

console.log('\n🔧 RECOMMENDED FIXES:');
console.log('1. Get fresh API keys from Supabase dashboard');
console.log('2. Verify project URL matches the keys');
console.log('3. Update .env file with correct credentials');

console.log('\n✅ DIAGNOSTIC COMPLETE');