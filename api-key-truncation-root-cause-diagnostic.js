#!/usr/bin/env node

/**
 * COMPREHENSIVE API KEY TRUNCATION ROOT CAUSE DIAGNOSTIC
 * 
 * This script identifies the exact source of the API key truncation issue
 * and determines which environment file is actually being used by Next.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 [ROOT_CAUSE_DIAGNOSTIC] Starting comprehensive API key analysis...\n');

// 1. Check all possible environment files
const envFiles = ['.env', '.env.local', '.env.fixed', '.env.example', '.env.development', '.env.production'];
const foundEnvFiles = [];
const envFileContents = {};

console.log('📁 [ENV_FILE_SCAN] Scanning for environment files...');

envFiles.forEach(filename => {
  const filePath = path.join(__dirname, filename);
  if (fs.existsSync(filePath)) {
    foundEnvFiles.push(filename);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      envFileContents[filename] = content;
      console.log(`✅ Found: ${filename}`);
    } catch (error) {
      console.log(`❌ Error reading ${filename}: ${error.message}`);
    }
  } else {
    console.log(`⚪ Not found: ${filename}`);
  }
});

// 2. Analyze API key structure in each file
console.log('\n🔑 [API_KEY_ANALYSIS] Analyzing API key structure...');

Object.keys(envFileContents).forEach(filename => {
  const content = envFileContents[filename];
  const anonKeyMatch = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
  const serviceKeyMatch = content.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  
  console.log(`\n📋 File: ${filename}`);
  console.log('=' .repeat(50));
  
  if (anonKeyMatch) {
    const key = anonKeyMatch[1].trim();
    const segments = key.split('.');
    const analysis = {
      length: key.length,
      segments: segments.length,
      segmentLengths: segments.map(s => s.length),
      headerLength: segments[0]?.length || 0,
      payloadLength: segments[1]?.length || 0,
      signatureLength: segments[2]?.length || 0,
      isValidJWT: segments.length === 3 && segments.every(s => s.length > 0),
      isTruncated: key.length < 300
    };
    
    console.log(`🔍 ANON_KEY Analysis:`);
    console.log(`   Length: ${analysis.length} characters`);
    console.log(`   Segments: ${analysis.segments}`);
    console.log(`   Segment lengths: [${analysis.segmentLengths.join(', ')}]`);
    console.log(`   JWT Structure: ${analysis.isValidJWT ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   Truncated: ${analysis.isTruncated ? '❌ YES' : '✅ NO'}`);
    
    if (analysis.isTruncated) {
      console.log(`   ⚠️  DIAGNOSIS: Key is ${300 - analysis.length} characters too short`);
      console.log(`   ⚠️  Expected signature length: 86+ chars, Actual: ${analysis.signatureLength} chars`);
    }
  } else {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found');
  }
  
  if (serviceKeyMatch) {
    const key = serviceKeyMatch[1].trim();
    const segments = key.split('.');
    console.log(`🔍 SERVICE_KEY Analysis:`);
    console.log(`   Length: ${key.length} characters`);
    console.log(`   Segments: ${segments.length}`);
    console.log(`   JWT Structure: ${segments.length === 3 ? '✅ Valid' : '❌ Invalid'}`);
  } else {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  }
});

// 3. Check Next.js environment loading priority
console.log('\n🚀 [NEXTJS_LOADING] Next.js environment file loading priority:');
console.log('1. .env.local (highest priority)');
console.log('2. .env.development (NODE_ENV=development)');
console.log('3. .env.production (NODE_ENV=production)');
console.log('4. .env (lowest priority)');

// 4. Determine which file is actually being used
console.log('\n🎯 [ACTIVE_FILE_DETECTION] Determining active environment file...');

let activeFile = '.env'; // default
if (foundEnvFiles.includes('.env.local')) {
  activeFile = '.env.local';
} else if (foundEnvFiles.includes('.env.development') && process.env.NODE_ENV === 'development') {
  activeFile = '.env.development';
} else if (foundEnvFiles.includes('.env.production') && process.env.NODE_ENV === 'production') {
  activeFile = '.env.production';
}

console.log(`📍 Active file: ${activeFile}`);
console.log(`📍 NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);

// 5. Analyze the active file's API key
if (envFileContents[activeFile]) {
  const content = envFileContents[activeFile];
  const anonKeyMatch = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
  
  if (anonKeyMatch) {
    const key = anonKeyMatch[1].trim();
    const segments = key.split('.');
    
    console.log('\n🎯 [ACTIVE_FILE_ANALYSIS] API key in active file:');
    console.log(`   File: ${activeFile}`);
    console.log(`   Length: ${key.length} characters`);
    console.log(`   Segments: ${segments.length}`);
    console.log(`   Signature length: ${segments[2]?.length || 0} characters`);
    
    if (key.length < 300) {
      console.log('\n🚨 [ROOT_CAUSE_IDENTIFIED] API KEY TRUNCATION CONFIRMED!');
      console.log(`   Problem: API key in ${activeFile} is truncated`);
      console.log(`   Current length: ${key.length} characters`);
      console.log(`   Expected length: 300+ characters`);
      console.log(`   Missing: ${300 - key.length} characters`);
      console.log(`   Signature incomplete: ${segments[2]?.length || 0} chars (should be 86+)`);
    } else {
      console.log('\n✅ [ACTIVE_FILE_ANALYSIS] API key appears complete');
    }
  }
}

// 6. Provide specific fix recommendations
console.log('\n🔧 [FIX_RECOMMENDATIONS] Recommended actions:');

const activeFileContent = envFileContents[activeFile];
if (activeFileContent) {
  const anonKeyMatch = activeFileContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
  
  if (anonKeyMatch && anonKeyMatch[1].trim().length < 300) {
    console.log('1. 🔄 IMMEDIATE FIX REQUIRED:');
    console.log(`   - Replace API key in ${activeFile} with complete key`);
    console.log('   - Get fresh key from: https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/settings/api');
    console.log('   - Ensure key has proper JWT structure (header.payload.signature)');
    console.log('   - Signature should be 86+ characters long');
    console.log('\n2. 🔄 VERIFICATION STEPS:');
    console.log('   - Restart development server after fixing');
    console.log('   - Test authentication with valid credentials');
    console.log('   - Check for 401 errors in browser console');
    console.log('\n3. 🔄 PREVENTION:');
    console.log('   - Avoid manual editing of JWT tokens');
    console.log('   - Use copy-paste from Supabase dashboard');
    console.log('   - Validate key length before saving');
  } else {
    console.log('✅ API key appears complete in active file');
    console.log('🔄 If issues persist, check:');
    console.log('   - Browser cache (hard refresh)');
    console.log('   - Development server restart');
    console.log('   - Network connectivity to Supabase');
  }
}

console.log('\n📊 [DIAGNOSTIC_COMPLETE] Root cause analysis finished.');
console.log('=' .repeat(60));