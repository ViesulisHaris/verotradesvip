// API Key Truncation Diagnostic Script
// Purpose: Identify why the API key is still being detected as truncated

const fs = require('fs');
const path = require('path');

console.log('🔍 [DIAGNOSTIC] Starting API Key Truncation Analysis...\n');

// 1. Read and analyze .env file
console.log('1️⃣ Analyzing .env file:');
try {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  let anonKeyLine = null;
  let urlLine = null;
  
  lines.forEach((line, index) => {
    if (line.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
      anonKeyLine = line;
      const key = line.split('=')[1];
      if (key) {
        console.log(`   ✅ Found ANON_KEY at line ${index + 1}:`);
        console.log(`   📏 Length: ${key.length} characters`);
        console.log(`   🔑 Starts with: ${key.substring(0, 20)}...`);
        console.log(`   🏁 Ends with: ...${key.substring(key.length - 20)}`);
        console.log(`   🔍 Format check: ${key.startsWith('eyJ') ? 'VALID JWT' : 'INVALID'}`);
        console.log(`   ⚠️  Length check: ${key.length >= 300 ? 'VALID (300+)' : 'TOO SHORT'}`);
      }
    }
    if (line.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      urlLine = line;
      const url = line.split('=')[1];
      if (url) {
        console.log(`   ✅ Found URL: ${url}`);
      }
    }
  });
  
  if (!anonKeyLine) {
    console.log('   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env');
  }
  if (!urlLine) {
    console.log('   ❌ NEXT_PUBLIC_SUPABASE_URL not found in .env');
  }
  
} catch (error) {
  console.log('   ❌ Error reading .env file:', error.message);
}

console.log('\n2️⃣ Analyzing .env.fixed file:');
try {
  const envFixedPath = path.join(__dirname, '.env.fixed');
  const envFixedContent = fs.readFileSync(envFixedPath, 'utf8');
  const lines = envFixedContent.split('\n');
  
  let anonKeyLine = null;
  
  lines.forEach((line, index) => {
    if (line.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
      anonKeyLine = line;
      const key = line.split('=')[1];
      if (key) {
        console.log(`   ✅ Found ANON_KEY at line ${index + 1}:`);
        console.log(`   📏 Length: ${key.length} characters`);
        console.log(`   🔑 Starts with: ${key.substring(0, 20)}...`);
        console.log(`   🏁 Ends with: ...${key.substring(key.length - 20)}`);
        console.log(`   🔍 Format check: ${key.startsWith('eyJ') ? 'VALID JWT' : 'INVALID'}`);
        console.log(`   ⚠️  Length check: ${key.length >= 300 ? 'VALID (300+)' : 'TOO SHORT'}`);
      }
    }
  });
  
} catch (error) {
  console.log('   ❌ Error reading .env.fixed file:', error.message);
}

console.log('\n3️⃣ Checking for potential truncation sources:');

// Check for any files that might be truncating the API key
const srcDir = path.join(__dirname, 'src');
function checkFileForTruncation(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Look for hardcoded API keys or substring operations
      if (line.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY') && 
          (line.includes('substring') || line.includes('slice') || line.includes('.substr'))) {
        console.log(`   ⚠️  Potential truncation found in ${filePath} line ${index + 1}:`);
        console.log(`      ${line.trim()}`);
      }
      
      // Look for hardcoded short API keys
      if (line.includes('eyJ') && line.length < 300 && line.includes('=')) {
        console.log(`   ⚠️  Short hardcoded API key found in ${filePath} line ${index + 1}:`);
        console.log(`      Length: ${line.length} characters`);
        console.log(`      ${line.substring(0, 50)}...`);
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
}

function searchDirectory(dir, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return;
  
  try {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        searchDirectory(itemPath, maxDepth, currentDepth + 1);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.js') || item.endsWith('.tsx') || item.endsWith('.jsx'))) {
        checkFileForTruncation(itemPath);
      }
    });
  } catch (error) {
    // Skip directories that can't be read
  }
}

if (fs.existsSync(srcDir)) {
  searchDirectory(srcDir);
} else {
  console.log('   ❌ src directory not found');
}

console.log('\n4️⃣ Environment variable loading analysis:');

// Check Next.js configuration
try {
  const nextConfigPath = path.join(__dirname, 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    console.log('   ✅ next.config.js found');
    if (nextConfig.includes('env')) {
      console.log('   ⚠️  next.config.js contains environment variable configuration');
    }
  }
} catch (error) {
  console.log('   ❌ Error reading next.config.js:', error.message);
}

console.log('\n5️⃣ Package.json analysis:');
try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`   ✅ Next.js version: ${packageJson.dependencies?.next || 'not found'}`);
  console.log(`   ✅ Supabase version: ${packageJson.dependencies?.['@supabase/supabase-js'] || 'not found'}`);
} catch (error) {
  console.log('   ❌ Error reading package.json:', error.message);
}

console.log('\n🎯 [DIAGNOSTIC COMPLETE] Analysis Summary:');
console.log('   - Check if .env contains the complete 350+ character API key');
console.log('   - Verify Next.js is loading environment variables correctly');
console.log('   - Look for any code that might be truncating the API key');
console.log('   - Ensure no hardcoded short API keys exist in the codebase');
console.log('   - Verify the API key format is correct JWT (starts with eyJ)');