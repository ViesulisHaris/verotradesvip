// Comprehensive API Key Diagnostic Script
// This script will validate the most likely sources of "Invalid API key" error

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

console.log('🔍 [API_KEY_DIAGNOSIS] Starting comprehensive API key diagnosis...\n');

// Step 1: Check Environment Variables
console.log('📋 [STEP 1] Checking Environment Variables...');
const envVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
};

console.log('Environment Variables Status:', {
  hasUrl: !!envVars.NEXT_PUBLIC_SUPABASE_URL,
  hasAnonKey: !!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  hasServiceKey: !!envVars.SUPABASE_SERVICE_ROLE_KEY,
  urlLength: envVars.NEXT_PUBLIC_SUPABASE_URL?.length,
  anonKeyLength: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
  serviceKeyLength: envVars.SUPABASE_SERVICE_ROLE_KEY?.length,
  urlPreview: envVars.NEXT_PUBLIC_SUPABASE_URL ? envVars.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20) + '...' : 'MISSING',
  anonKeyPreview: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'MISSING'
});

// Step 2: Validate API Key Format
console.log('\n🔍 [STEP 2] Validating API Key Format...');
function validateJWT(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    parts.forEach(part => Buffer.from(part, 'base64').toString('utf8'));
    return true;
  } catch (e) {
    return false;
  }
}

const anonKeyValid = validateJWT(envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const serviceKeyValid = validateJWT(envVars.SUPABASE_SERVICE_ROLE_KEY);

console.log('JWT Validation Results:', {
  anonKeyValid,
  serviceKeyValid,
  anonKeyFormat: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'JWT' : 'MISSING',
  serviceKeyFormat: envVars.SUPABASE_SERVICE_ROLE_KEY ? 'JWT' : 'MISSING'
});

// Step 3: Test API Connection with Different Clients
console.log('\n🔍 [STEP 3] Testing API Connection...');

async function testConnection(name, url, key, options = {}) {
  console.log(`\n🔍 Testing ${name} connection...`);
  try {
    const client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        ...options
      }
    });

    // Test basic connection
    const startTime = Date.now();
    const { data, error } = await client.from('_').select('*').limit(1);
    const responseTime = Date.now() - startTime;

    if (error) {
      console.log(`❌ ${name} connection FAILED:`, {
        error: error.message,
        status: error.status,
        responseTime: `${responseTime}ms`,
        isInvalidApiKey: error.message.includes('Invalid API key') || error.status === 401
      });
      return { success: false, error, responseTime, isInvalidApiKey: error.message.includes('Invalid API key') || error.status === 401 };
    } else {
      console.log(`✅ ${name} connection SUCCESS:`, {
        responseTime: `${responseTime}ms`,
        hasData: !!data
      });
      return { success: true, responseTime, data };
    }
  } catch (e) {
    console.log(`💥 ${name} connection EXCEPTION:`, {
      error: e.message,
      isInvalidApiKey: e.message.includes('Invalid API key')
    });
    return { success: false, error: e.message, isInvalidApiKey: e.message.includes('Invalid API key') };
  }
}

// Test with original client configuration
const originalResult = await testConnection(
  'Original Client',
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test with service role key
if (envVars.SUPABASE_SERVICE_ROLE_KEY) {
  const serviceResult = await testConnection(
    'Service Role Client',
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Step 4: Check File Import Issues
console.log('\n🔍 [STEP 4] Checking File Import Issues...');
const fs = require('fs');
const path = require('path');

const clientFiles = [
  'src/supabase/client.ts',
  'src/supabase/client-fixed.ts'
];

clientFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`File Check: ${file} - ${exists ? 'EXISTS' : 'MISSING'}`);
  
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasCorrectUrl = content.includes(envVars.NEXT_PUBLIC_SUPABASE_URL);
    const hasCorrectKey = content.includes(envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));
    console.log(`  Content Check:`, {
      hasCorrectUrl,
      hasCorrectKey,
      usesClientFixed: content.includes('client-fixed'),
      usesClientOriginal: content.includes('client.ts')
    });
  }
});

// Step 5: Decode and Analyze JWT Payload
console.log('\n🔍 [STEP 5] Analyzing JWT Payload...');
function decodeJWTPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload;
  } catch (e) {
    return null;
  }
}

const anonPayload = decodeJWTPayload(envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);
if (anonPayload) {
  console.log('Anonymous Key Payload:', {
    iss: anonPayload.iss,
    ref: anonPayload.ref,
    role: anonPayload.role,
    exp: anonPayload.exp,
    iat: anonPayload.iat,
    isExpired: anonPayload.exp * 1000 < Date.now(),
    expectedRef: 'bzmixuxautbmqbrqtufx'
  });
}

// Step 6: Test Authentication Flow
console.log('\n🔍 [STEP 6] Testing Authentication Flow...');
async function testAuthentication() {
  try {
    const client = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // Test sign in with known invalid credentials first
    console.log('Testing with invalid credentials...');
    const { error: invalidError } = await client.auth.signInWithPassword({
      email: 'invalid@test.com',
      password: 'invalidpassword'
    });

    if (invalidError) {
      console.log('Invalid credentials test:', {
        error: invalidError.message,
        isInvalidCredentials: invalidError.message.includes('Invalid login credentials'),
        isInvalidApiKey: invalidError.message.includes('Invalid API key')
      });
    }

    // Test sign in with potential valid credentials
    console.log('Testing with potential valid credentials...');
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });

    if (signInError) {
      console.log('Sign in test FAILED:', {
        error: signInError.message,
        isInvalidApiKey: signInError.message.includes('Invalid API key'),
        status: signInError.status
      });
      return { success: false, isInvalidApiKey: signInError.message.includes('Invalid API key') };
    } else {
      console.log('Sign in test SUCCESS:', {
        hasUser: !!signInData?.user,
        hasSession: !!signInData?.session
      });
      return { success: true, isInvalidApiKey: false };
    }
  } catch (e) {
    console.log('Authentication test EXCEPTION:', {
      error: e.message,
      isInvalidApiKey: e.message.includes('Invalid API key')
    });
    return { success: false, isInvalidApiKey: e.message.includes('Invalid API key') };
  }
}

const authResult = await testAuthentication();

// Step 7: Summary and Recommendations
console.log('\n🎯 [STEP 7] Diagnosis Summary...');
const diagnosis = {
  environmentValid: !!(envVars.NEXT_PUBLIC_SUPABASE_URL && envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  jwtFormatValid: anonKeyValid,
  connectionWorks: originalResult.success,
  authWorks: authResult.success,
  isInvalidApiKeyError: originalResult.isInvalidApiKey || authResult.isInvalidApiKey,
  keyExpired: anonPayload ? anonPayload.isExpired : null,
  projectRefMismatch: anonPayload ? anonPayload.ref !== 'bzmixuxautbmqbrqtufx' : null
};

console.log('\n📊 DIAGNOSIS RESULTS:');
console.log('==================');
Object.entries(diagnosis).forEach(([key, value]) => {
  const status = value === true ? '✅ PASS' : value === false ? '❌ FAIL' : '⚠️  UNKNOWN';
  console.log(`${key}: ${status}`);
});

console.log('\n💡 RECOMMENDATIONS:');
if (!diagnosis.environmentValid) {
  console.log('❌ Fix environment variables in .env file');
}
if (!diagnosis.jwtFormatValid) {
  console.log('❌ Update API keys with valid JWT tokens from Supabase dashboard');
}
if (diagnosis.isInvalidApiKeyError) {
  console.log('❌ CRITICAL: Invalid API key detected - Update keys in Supabase dashboard');
}
if (diagnosis.keyExpired) {
  console.log('❌ API keys have expired - Generate new keys from Supabase dashboard');
}
if (diagnosis.projectRefMismatch) {
  console.log('❌ Project reference mismatch - Keys from different Supabase project');
}
if (!diagnosis.connectionWorks) {
  console.log('❌ Network connectivity issues - Check URL and firewall settings');
}
if (!diagnosis.authWorks) {
  console.log('❌ Authentication flow broken - Check Supabase auth configuration');
}

console.log('\n🔧 NEXT STEPS:');
console.log('1. Go to https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/settings/api');
console.log('2. Verify project URL and generate new API keys');
console.log('3. Update .env file with fresh keys');
console.log('4. Restart development server');
console.log('5. Test authentication with valid credentials');

console.log('\n🏁 Diagnosis complete!');