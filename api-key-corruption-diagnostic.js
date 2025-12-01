// CRITICAL API KEY CORRUPTION DIAGNOSTIC
// Purpose: Identify exact root cause of API key corruption

const fs = require('fs');
const path = require('path');

console.log('🔍 [CRITICAL DIAGNOSTIC] Starting API Key Corruption Analysis');
console.log('=' .repeat(80));

// 1. Read current .env.local file
const envPath = path.join(__dirname, '.env.local');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Successfully read .env.local file');
} catch (error) {
  console.error('❌ Failed to read .env.local:', error.message);
  process.exit(1);
}

// 2. Extract and analyze the API key
const anonKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
const serviceKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

console.log('\n🔍 [API KEY ANALYSIS]');
console.log('-'.repeat(50));

if (anonKeyMatch) {
  const anonKey = anonKeyMatch[1].trim();
  const segments = anonKey.split('.');
  
  console.log('ANON KEY ANALYSIS:');
  console.log(`  Length: ${anonKey.length} characters`);
  console.log(`  Segments: ${segments.length}`);
  console.log(`  Segment lengths: [${segments.map(s => s.length).join(', ')}]`);
  console.log(`  Starts with eyJ: ${anonKey.startsWith('eyJ')}`);
  console.log(`  Has 3 segments: ${segments.length === 3}`);
  console.log(`  Has signature: ${segments.length >= 3 ? (segments[2].length > 0) : false}`);
  
  if (segments.length < 3) {
    console.log('❌ CRITICAL: Missing JWT signature segment!');
    console.log(`   Expected: header.payload.signature`);
    console.log(`   Actual: ${segments.join('.')}`);
  } else if (segments[2].length < 43) {
    console.log('❌ CRITICAL: Signature segment too short!');
    console.log(`   Expected: 43+ characters for HS256`);
    console.log(`   Actual: ${segments[2].length} characters`);
  }
  
  // Show first and last parts for comparison
  console.log(`  Key preview: ${anonKey.substring(0, 50)}...${anonKey.substring(anonKey.length - 10)}`);
  
} else {
  console.log('❌ ANON KEY NOT FOUND in .env.local');
}

if (serviceKeyMatch) {
  const serviceKey = serviceKeyMatch[1].trim();
  const segments = serviceKey.split('.');
  
  console.log('\nSERVICE KEY ANALYSIS:');
  console.log(`  Length: ${serviceKey.length} characters`);
  console.log(`  Segments: ${segments.length}`);
  console.log(`  Has 3 segments: ${segments.length === 3}`);
  console.log(`  Key preview: ${serviceKey.substring(0, 50)}...${serviceKey.substring(serviceKey.length - 10)}`);
}

// 3. Compare with backup files
console.log('\n🔍 [BACKUP COMPARISON]');
console.log('-'.repeat(50));

const backupFiles = [
  { name: '.env.backup', path: '.env.backup' },
  { name: '.env.fixed.backup', path: '.env.fixed.backup' }
];

backupFiles.forEach(({ name, path: backupPath }) => {
  try {
    const backupContent = fs.readFileSync(path.join(__dirname, backupPath), 'utf8');
    const backupAnonMatch = backupContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
    
    if (backupAnonMatch) {
      const backupKey = backupAnonMatch[1].trim();
      const backupSegments = backupKey.split('.');
      
      console.log(`\n${name}:`);
      console.log(`  Length: ${backupKey.length} characters`);
      console.log(`  Segments: ${backupSegments.length}`);
      console.log(`  Has 3 segments: ${backupSegments.length === 3}`);
      
      if (backupSegments.length === 3 && backupSegments[2].length > 0) {
        console.log('  ✅ Backup has valid JWT structure');
        
        // Compare with current key
        if (anonKeyMatch) {
          const currentKey = anonKeyMatch[1].trim();
          if (backupKey !== currentKey) {
            console.log('  ⚠️  Backup differs from current key');
            console.log(`    Current: ${currentKey.substring(0, 50)}...`);
            console.log(`    Backup:  ${backupKey.substring(0, 50)}...`);
          } else {
            console.log('  ✅ Backup matches current key');
          }
        }
      } else {
        console.log('  ❌ Backup also has invalid JWT structure');
      }
    }
  } catch (error) {
    console.log(`❌ Could not read ${name}:`, error.message);
  }
});

// 4. Root Cause Analysis
console.log('\n🔍 [ROOT CAUSE ANALYSIS]');
console.log('-'.repeat(50));

console.log('\nPOTENTIAL CAUSES OF CORRUPTION:');
console.log('1. File truncation during save operation');
console.log('2. Text editor/IDE corruption');
console.log('3. Copy-paste truncation');
console.log('4. Environment variable processing bug');
console.log('5. Backup/restore operation error');

if (anonKeyMatch) {
  const anonKey = anonKeyMatch[1].trim();
  const segments = anonKey.split('.');
  
  if (segments.length === 2) {
    console.log('\n❌ DIAGNOSIS: API KEY IS MISSING SIGNATURE SEGMENT');
    console.log('   This is classic file truncation - the key was cut off');
    console.log('   during a save/copy operation.');
    console.log('\n   MOST LIKELY CAUSE:');
    console.log('   1. Manual editing that accidentally truncated the key');
    console.log('   2. Copy-paste operation that didn\'t capture the full key');
    console.log('   3. File save operation that was interrupted');
  } else if (segments.length === 3 && segments[2].length < 43) {
    console.log('\n❌ DIAGNOSIS: API KEY SIGNATURE IS TRUNCATED');
    console.log('   The signature segment is incomplete.');
    console.log('\n   MOST LIKELY CAUSE:');
    console.log('   1. Partial copy-paste operation');
    console.log('   2. Text editor line wrapping issue');
    console.log('   3. File encoding problem');
  }
}

// 5. Recommended Fix
console.log('\n🔧 [RECOMMENDED FIX]');
console.log('-'.repeat(50));
console.log('1. Get fresh API keys from Supabase dashboard');
console.log('2. Replace the corrupted key in .env.local');
console.log('3. Restart the development server');
console.log('4. Test authentication functionality');

console.log('\n🌐 Supabase Dashboard: https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/settings/api');

console.log('\n' + '='.repeat(80));
console.log('🔍 [CRITICAL DIAGNOSTIC] Analysis Complete');