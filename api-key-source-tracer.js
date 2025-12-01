// API Key Source Tracer - Comprehensive Diagnostic Tool
// Purpose: Identify exactly which API key is being used and why it's failing

const fs = require('fs');
const path = require('path');

console.log('🔍 [API_KEY_TRACER] Starting comprehensive API key source investigation...\n');

// 1. Check all environment files
console.log('=== ENVIRONMENT FILES ANALYSIS ===');
const envFiles = ['.env', '.env.local', '.env.fixed', '.env.example'];

envFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`\n📁 ${file}:`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach(line => {
        if (line.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
          const key = line.split('=')[1]?.trim();
          if (key) {
            console.log(`  🔑 ANON_KEY: ${key.substring(0, 20)}...${key.substring(key.length - 10)} (length: ${key.length})`);
            console.log(`  📊 Segments: ${key.split('.').length}`);
            console.log(`  🎯 Starts with eyJ: ${key.startsWith('eyJ')}`);
            
            // Check for obvious truncation patterns
            if (key.includes('1234567890abcdef')) {
              console.log(`  ⚠️  WARNING: Contains placeholder pattern '1234567890abcdef'`);
            }
            if (key.length < 300) {
              console.log(`  ⚠️  WARNING: Key appears truncated (${key.length} < 300)`);
            }
          }
        }
        if (line.includes('NEXT_PUBLIC_SUPABASE_URL')) {
          const url = line.split('=')[1]?.trim();
          if (url) {
            console.log(`  🌐 URL: ${url}`);
          }
        }
      });
    } catch (error) {
      console.log(`  ❌ Error reading file: ${error.message}`);
    }
  } else {
    console.log(`\n📁 ${file}: NOT FOUND`);
  }
});

// 2. Test API key format validation
console.log('\n=== API KEY FORMAT VALIDATION ===');

function validateApiKeyFormat(key, source) {
  if (!key) {
    console.log(`❌ ${source}: No key provided`);
    return false;
  }
  
  const segments = key.split('.');
  const isValidFormat = key.startsWith('eyJ') && segments.length === 3;
  const hasValidSignature = segments[2] && segments[2].length >= 40;
  
  console.log(`🔍 ${source}:`);
  console.log(`  Length: ${key.length}`);
  console.log(`  Format: ${isValidFormat ? '✅ Valid JWT' : '❌ Invalid JWT'}`);
  console.log(`  Segments: ${segments.length} (expected: 3)`);
  console.log(`  Signature length: ${segments[2]?.length || 0} (expected: 40+)`);
  console.log(`  Overall: ${isValidFormat && hasValidSignature ? '✅ Valid' : '❌ Invalid'}`);
  
  return isValidFormat && hasValidSignature;
}

// Extract and test keys from environment files
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const match = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
  if (match) {
    const key = match[1].trim();
    validateApiKeyFormat(key, '.env.local');
  }
}

// 3. Simulate Next.js environment variable loading
console.log('\n=== NEXT.JS ENVIRONMENT LOADING SIMULATION ===');

// Next.js loads environment files in this priority order:
// 1. .env.production (if NODE_ENV=production)
// 2. .env.local
// 3. .env.development (if NODE_ENV=development)
// 4. .env

console.log('📋 Next.js environment file loading priority:');
console.log('  1. .env.production (NODE_ENV=production)');
console.log('  2. .env.local (always loaded)');
console.log('  3. .env.development (NODE_ENV=development)');
console.log('  4. .env (fallback)');

const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`\n🔧 Current NODE_ENV: ${nodeEnv}`);

// 4. Check for API key testing with actual Supabase project
console.log('\n=== SUPABASE PROJECT VERIFICATION ===');

const supabaseUrl = 'https://bzmixuxautbmqbrqtufx.supabase.co';
console.log(`🌐 Testing Supabase project: ${supabaseUrl}`);

// Extract project reference from URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
console.log(`📋 Project reference: ${projectRef}`);

// 5. Generate diagnostic report
console.log('\n=== DIAGNOSTIC SUMMARY ===');

const issues = [];
const recommendations = [];

// Check for common issues
if (fs.existsSync('.env.local') && fs.existsSync('.env')) {
  const localContent = fs.readFileSync('.env.local', 'utf8');
  const envContent = fs.readFileSync('.env', 'utf8');
  
  const localKey = localContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
  const envKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
  
  if (localKey && envKey && localKey !== envKey) {
    issues.push('Conflicting API keys between .env.local and .env');
    recommendations.push('Remove or consolidate conflicting environment files');
  }
}

// Check for placeholder patterns
if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  if (content.includes('1234567890abcdef')) {
    issues.push('API key contains placeholder patterns');
    recommendations.push('Replace placeholder with actual API key from Supabase dashboard');
  }
}

console.log('\n🚨 ISSUES FOUND:');
if (issues.length === 0) {
  console.log('  ✅ No obvious issues detected');
} else {
  issues.forEach(issue => console.log(`  ❌ ${issue}`));
}

console.log('\n💡 RECOMMENDATIONS:');
if (recommendations.length === 0) {
  console.log('  ✅ Configuration appears correct');
} else {
  recommendations.forEach(rec => console.log(`  🔧 ${rec}`));
}

console.log('\n=== NEXT STEPS ===');
console.log('1. Get fresh API keys from: https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/settings/api');
console.log('2. Update .env.local with the correct keys');
console.log('3. Remove or rename conflicting environment files');
console.log('4. Restart development server: npm run dev');
console.log('5. Test authentication with valid credentials');

console.log('\n🔍 [API_KEY_TRACER] Investigation complete.\n');