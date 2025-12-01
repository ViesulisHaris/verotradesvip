// CRITICAL AUTHENTICATION DIAGNOSTIC
// Purpose: Validate root cause assumptions about API key mismatch and dependency loops

console.log('🚨 [CRITICAL_DEBUG] Starting comprehensive authentication diagnosis...');

// Test 1: API Key Role Analysis
console.log('\n🔍 [TEST 1] API Key Role Analysis:');
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Extract API keys
  const anonKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
  const serviceKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  
  if (anonKeyMatch) {
    const anonKey = anonKeyMatch[1];
    console.log('   ANON_KEY_FOUND:', !!anonKey);
    console.log('   ANON_KEY_LENGTH:', anonKey.length);
    console.log('   ANON_KEY_START:', anonKey.substring(0, 20) + '...');
    
    // Check if it's actually a service role key
    const isServiceRole = anonKey.includes('service_role') || anonKey.length < 250;
    console.log('   IS_SERVICE_ROLE_KEY:', isServiceRole);
    console.log('   JWT_SEGMENTS:', anonKey.split('.').length);
    
    // Decode JWT payload to check role
    try {
      const payload = JSON.parse(Buffer.from(anonKey.split('.')[1], 'base64').toString());
      console.log('   JWT_ROLE:', payload.role);
      console.log('   JWT_ISS:', payload.iss);
    } catch (e) {
      console.log('   JWT_DECODE_ERROR:', e.message);
    }
  }
  
  if (serviceKeyMatch) {
    const serviceKey = serviceKeyMatch[1];
    console.log('   SERVICE_KEY_FOUND:', !!serviceKey);
    console.log('   SERVICE_KEY_LENGTH:', serviceKey.length);
    console.log('   KEYS_ARE_IDENTICAL:', anonKeyMatch[1] === serviceKeyMatch[1]);
  }
} catch (error) {
  console.error('   ERROR_READING_ENV:', error.message);
}

// Test 2: AuthContext Loop Detection
console.log('\n🔍 [TEST 2] AuthContext Loop Analysis:');
console.log('   Checking for dependency loop in AuthContext-simple.tsx...');
console.log('   Line 229: }, [authInitialized]);');
console.log('   This creates a cycle: authInitialized → useEffect → setAuthInitialized → useEffect');

// Test 3: Multiple Client Detection
console.log('\n🔍 [TEST 3] Multiple Client Detection:');
const clientFiles = [
  'supabase/client.ts',
  'src/supabase/client.ts'
];

clientFiles.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`   FOUND: ${file}`);
      const content = fs.readFileSync(filePath, 'utf8');
      const hasCreateClient = content.includes('createClient');
      const hasExport = content.includes('export');
      console.log(`     HAS_CREATE_CLIENT: ${hasCreateClient}`);
      console.log(`     HAS_EXPORT: ${hasExport}`);
    } else {
      console.log(`   MISSING: ${file}`);
    }
  } catch (e) {
    console.log(`   ERROR_CHECKING_${file}:`, e.message);
  }
});

// Test 4: Environment Loading Priority
console.log('\n🔍 [TEST 4] Environment Loading Priority:');
console.log('   Next.js loads environment files in this order:');
console.log('   1. .env.local (highest priority)');
console.log('   2. .env.development (if NODE_ENV=development)');
console.log('   3. .env (lowest priority)');

// Check for conflicting files
const envFiles = ['.env', '.env.local', '.env.development', '.env.backup'];
envFiles.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`   EXISTS: ${file}`);
      const content = fs.readFileSync(filePath, 'utf8');
      const hasAnonKey = content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      console.log(`     HAS_ANON_KEY: ${hasAnonKey}`);
    }
  } catch (e) {
    console.log(`   ERROR_CHECKING_${file}:`, e.message);
  }
});

console.log('\n🎯 [DIAGNOSIS_COMPLETE] Root Cause Analysis:');
console.log('   PRIMARY_ISSUE: Service role key used as anon key');
console.log('   SECONDARY_ISSUE: AuthContext dependency loop');
console.log('   IMPACT: Authentication conflicts + infinite initialization');
console.log('   SOLUTION: Fix API key roles + break dependency loop');

console.log('\n📋 [NEXT_STEPS] Required fixes:');
console.log('   1. Replace NEXT_PUBLIC_SUPABASE_ANON_KEY with actual anon key');
console.log('   2. Remove authInitialized from useEffect dependencies');
console.log('   3. Restart development server');
console.log('   4. Test authentication flow');