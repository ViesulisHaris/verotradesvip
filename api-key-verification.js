// API Key Verification Script
// Purpose: Verify the current API keys are complete and not truncated

const fs = require('fs');
const path = require('path');

// Read the .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extract API keys
const lines = envContent.split('\n');
const anonKeyLine = lines.find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY='));
const serviceKeyLine = lines.find(line => line.startsWith('SUPABASE_SERVICE_ROLE_KEY='));

const anonKey = anonKeyLine ? anonKeyLine.split('=')[1] : null;
const serviceKey = serviceKeyLine ? serviceKeyLine.split('=')[1] : null;

console.log('🔍 API KEY VERIFICATION REPORT');
console.log('================================');

// Expected keys from the task
const expectedAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODA2MzIsImV4cCI6MjA3Nzg1NjYzMn0.Lm4bo_r__27b0Los00TpvD9KMgwKEOPlQT0waS5jWPk';
const expectedServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4MDYzMiwiZXhwIjoyMDc3ODU2NjMyfQ.pFRbi-LADHU1cdrZjulUIm0NAQWvevCa5QYERbZyI6E';

console.log('\n📋 ANONYMOUS KEY ANALYSIS:');
console.log('Current length:', anonKey ? anonKey.length : 'MISSING');
console.log('Expected length:', expectedAnonKey.length);
console.log('Length match:', anonKey && anonKey.length === expectedAnonKey.length ? '✅ YES' : '❌ NO');
console.log('Content match:', anonKey === expectedAnonKey ? '✅ YES' : '❌ NO');

if (anonKey) {
  const segments = anonKey.split('.');
  console.log('JWT segments:', segments.length, '(expected: 3)');
  console.log('Segment lengths:', segments.map(s => s.length));
  console.log('Starts with eyJ:', anonKey.startsWith('eyJ') ? '✅ YES' : '❌ NO');
}

console.log('\n📋 SERVICE ROLE KEY ANALYSIS:');
console.log('Current length:', serviceKey ? serviceKey.length : 'MISSING');
console.log('Expected length:', expectedServiceKey.length);
console.log('Length match:', serviceKey && serviceKey.length === expectedServiceKey.length ? '✅ YES' : '❌ NO');
console.log('Content match:', serviceKey === expectedServiceKey ? '✅ YES' : '❌ NO');

if (serviceKey) {
  const segments = serviceKey.split('.');
  console.log('JWT segments:', segments.length, '(expected: 3)');
  console.log('Segment lengths:', segments.map(s => s.length));
  console.log('Starts with eyJ:', serviceKey.startsWith('eyJ') ? '✅ YES' : '❌ NO');
}

console.log('\n🔧 RECOMMENDATIONS:');
if (anonKey !== expectedAnonKey) {
  console.log('❌ Anonymous key needs to be updated');
} else {
  console.log('✅ Anonymous key is correct');
}

if (serviceKey !== expectedServiceKey) {
  console.log('❌ Service role key needs to be updated');
} else {
  console.log('✅ Service role key is correct');
}

console.log('\n📊 SUMMARY:');
const anonKeyCorrect = anonKey === expectedAnonKey;
const serviceKeyCorrect = serviceKey === expectedServiceKey;

if (anonKeyCorrect && serviceKeyCorrect) {
  console.log('✅ Both API keys are correct and complete');
  console.log('✅ No truncation detected');
  console.log('✅ API keys should work properly');
} else {
  console.log('❌ One or both API keys need to be updated');
  console.log('❌ This may cause authentication and API access issues');
}

// Generate the corrected .env content if needed
if (!anonKeyCorrect || !serviceKeyCorrect) {
  console.log('\n🔧 CORRECTED .env CONTENT:');
  console.log('================================');
  
  let correctedEnv = envContent;
  
  if (!anonKeyCorrect) {
    correctedEnv = correctedEnv.replace(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${expectedAnonKey}`
    );
  }
  
  if (!serviceKeyCorrect) {
    correctedEnv = correctedEnv.replace(
      /SUPABASE_SERVICE_ROLE_KEY=.*/,
      `SUPABASE_SERVICE_ROLE_KEY=${expectedServiceKey}`
    );
  }
  
  console.log(correctedEnv);
}