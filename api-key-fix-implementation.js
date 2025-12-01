// API Key Fix Implementation
// Purpose: Replace placeholder API keys with real ones and verify the fix

const fs = require('fs');
const path = require('path');

console.log('🔧 [API_KEY_FIX] Starting API key fix implementation...\n');

// Function to update .env.local with real API keys
function updateEnvWithRealKeys(anonKey, serviceRoleKey) {
  const envLocalPath = path.join(__dirname, '.env.local');
  
  // Backup current .env.local
  if (fs.existsSync(envLocalPath)) {
    const backupPath = path.join(__dirname, '.env.local.backup');
    fs.copyFileSync(envLocalPath, backupPath);
    console.log('✅ Backed up current .env.local to .env.local.backup');
  }
  
  // Create new .env.local with real keys
  const newEnvContent = `# Supabase Configuration - FIXED VERSION
# Replaced placeholder API keys with real ones

# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://bzmixuxautbmqbrqtufx.supabase.co

# Anonymous/Public Key - REAL KEY (no placeholders)
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}

# Service Role Key - REAL KEY (no placeholders)
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}

# Fix applied: ${new Date().toISOString()}
# Previous placeholder keys replaced with real cryptographic signatures
`;

  fs.writeFileSync(envLocalPath, newEnvContent);
  console.log('✅ Updated .env.local with real API keys');
  
  return newEnvContent;
}

// Function to validate the new API key format
function validateNewApiKey(apiKey, keyType) {
  if (!apiKey) {
    console.log(`❌ ${keyType}: No key provided`);
    return false;
  }
  
  const segments = apiKey.split('.');
  const hasPlaceholders = apiKey.includes('1234567890abcdef') || apiKey.includes('PASTE_YOUR');
  
  console.log(`🔍 ${keyType} validation:`);
  console.log(`  Length: ${apiKey.length}`);
  console.log(`  Segments: ${segments.length}`);
  console.log(`  Starts with eyJ: ${apiKey.startsWith('eyJ')}`);
  console.log(`  Contains placeholders: ${hasPlaceholders}`);
  
  if (hasPlaceholders) {
    console.log(`❌ ${keyType}: Still contains placeholder patterns`);
    return false;
  }
  
  if (segments.length !== 3) {
    console.log(`❌ ${keyType}: Invalid JWT structure (expected 3 segments)`);
    return false;
  }
  
  if (!apiKey.startsWith('eyJ')) {
    console.log(`❌ ${keyType}: Invalid JWT format (should start with eyJ)`);
    return false;
  }
  
  console.log(`✅ ${keyType}: Format validation passed`);
  return true;
}

// Function to clean up conflicting environment files
function cleanupConflictingFiles() {
  const conflictingFiles = ['.env', '.env.fixed'];
  
  conflictingFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const backupPath = path.join(__dirname, `${file}.backup`);
      fs.copyFileSync(filePath, backupPath);
      fs.unlinkSync(filePath);
      console.log(`✅ Moved ${file} to ${file}.backup (to prevent conflicts)`);
    }
  });
}

// Main implementation
async function implementFix() {
  console.log('=== API KEY FIX IMPLEMENTATION ===\n');
  
  // Step 1: Get real API keys from user
  console.log('📋 To fix the "Invalid API key" error, I need your real API keys:');
  console.log('1. Go to: https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/settings/api');
  console.log('2. Copy the "anon" key');
  console.log('3. Copy the "service_role" key');
  console.log('');
  
  // For automation purposes, you would replace these with actual keys
  const realAnonKey = 'PASTE_YOUR_REAL_ANON_KEY_HERE';
  const realServiceRoleKey = 'PASTE_YOUR_REAL_SERVICE_ROLE_KEY_HERE';
  
  console.log('⚠️  AUTOMATION NOTE:');
  console.log('Replace the placeholder values above with your actual API keys');
  console.log('Then run this script again to apply the fix automatically');
  console.log('');
  
  // Step 2: Validate the keys
  console.log('=== KEY VALIDATION ===');
  const anonValid = validateNewApiKey(realAnonKey, 'ANON_KEY');
  const serviceValid = validateNewApiKey(realServiceRoleKey, 'SERVICE_ROLE_KEY');
  
  if (!anonValid || !serviceValid) {
    console.log('\n❌ Validation failed. Please check your API keys and try again.');
    return false;
  }
  
  // Step 3: Update environment file
  console.log('\n=== UPDATING ENVIRONMENT ===');
  updateEnvWithRealKeys(realAnonKey, realServiceRoleKey);
  
  // Step 4: Clean up conflicting files
  console.log('\n=== CLEANING UP CONFLICTS ===');
  cleanupConflictingFiles();
  
  // Step 5: Instructions for next steps
  console.log('\n=== NEXT STEPS ===');
  console.log('1. Restart your development server:');
  console.log('   - Stop current server (Ctrl+C)');
  console.log('   - Run: npm run dev');
  console.log('');
  console.log('2. Test the authentication:');
  console.log('   - Go to http://localhost:3000/login');
  console.log('   - Try to log in with valid credentials');
  console.log('   - Check for "Invalid API key" errors');
  console.log('');
  console.log('3. Verify the fix:');
  console.log('   - Run: node api-key-direct-test.js');
  console.log('   - Should return 200 OK instead of 401 Unauthorized');
  
  console.log('\n✅ API key fix implementation complete!');
  return true;
}

// Manual fix instructions
function showManualFixInstructions() {
  console.log(`
=== MANUAL FIX INSTRUCTIONS ===

If you prefer to fix manually instead of running this script:

1. GET REAL API KEYS:
   - Go to: https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/settings/api
   - Copy the "anon" key (starts with eyJhbGciOiJIUzI1NiIs...)
   - Copy the "service_role" key (starts with eyJhbGciOiJIUzI1NiIs...)

2. UPDATE .env.local:
   - Open: verotradesvip/.env.local
   - Replace NEXT_PUBLIC_SUPABASE_ANON_KEY with the real anon key
   - Replace SUPABASE_SERVICE_ROLE_KEY with the real service role key
   - Ensure no "1234567890abcdef" patterns remain

3. CLEAN UP CONFLICTS:
   - Rename .env to .env.backup
   - Rename .env.fixed to .env.fixed.backup
   - Keep only .env.local with real keys

4. RESTART SERVER:
   - Stop: Ctrl+C
   - Start: npm run dev

5. TEST:
   - Try logging in at http://localhost:3000/login
   - Should work without "Invalid API key" errors

=== EXPECTED RESULT ===
✅ Authentication works
✅ No "Invalid API key" errors
✅ Users can access dashboard
✅ All Supabase operations function normally
`);
}

// Check if this is being run with real keys or for instructions
const args = process.argv.slice(2);
if (args.includes('--manual')) {
  showManualFixInstructions();
} else if (args.includes('--auto')) {
  implementFix();
} else {
  console.log('🔧 [API_KEY_FIX] API Key Fix Implementation Tool\n');
  console.log('Usage:');
  console.log('  node api-key-fix-implementation.js --manual  # Show manual instructions');
  console.log('  node api-key-fix-implementation.js --auto     # Run automated fix');
  console.log('\nFor automated fix, edit the script and replace placeholder keys with real ones first.');
}