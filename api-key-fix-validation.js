#!/usr/bin/env node

/**
 * API KEY FIX VALIDATION
 * 
 * Validates that the API key fix is working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 [FIX_VALIDATION] Validating API key fix...\n');

// Read the updated .env.local file
const envLocalPath = path.join(__dirname, '.env.local');
const content = fs.readFileSync(envLocalPath, 'utf8');

const anonKeyMatch = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
const urlMatch = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);

if (anonKeyMatch && urlMatch) {
  const key = anonKeyMatch[1].trim();
  const url = urlMatch[1].trim();
  const segments = key.split('.');
  
  console.log('🔑 [API_KEY_ANALYSIS] Updated API key validation:');
  console.log(`   URL: ${url}`);
  console.log(`   Length: ${key.length} characters`);
  console.log(`   Expected: 300+ characters`);
  console.log(`   Status: ${key.length >= 300 ? '✅ COMPLETE' : '❌ STILL TRUNCATED'}`);
  console.log(`   Segments: ${segments.length}`);
  console.log(`   Header: ${segments[0]?.length || 0} chars`);
  console.log(`   Payload: ${segments[1]?.length || 0} chars`);
  console.log(`   Signature: ${segments[2]?.length || 0} chars`);
  
  if (key.length >= 300 && segments.length === 3) {
    console.log('\n✅ [FIX_SUCCESS] API key appears to be complete!');
    console.log('   JWT structure is valid');
    console.log('   Signature length is sufficient');
    console.log('   Should resolve 401 authentication errors');
  } else {
    console.log('\n❌ [FIX_FAILED] API key still has issues');
    console.log(`   Length issue: ${key.length < 300 ? `${300 - key.length} chars missing` : 'None'}`);
    console.log(`   Structure issue: ${segments.length !== 3 ? 'Invalid JWT format' : 'None'}`);
  }
} else {
  console.log('❌ Could not find API key or URL in .env.local');
}

console.log('\n🏁 [FIX_VALIDATION_COMPLETE] Validation finished.');
console.log('=' .repeat(50));