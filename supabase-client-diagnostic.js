// Supabase Client Diagnostic Tool
// This script will help identify multiple client instances and configuration conflicts

const fs = require('fs');
const path = require('path');

console.log('🔍 SUPABASE CLIENT DIAGNOSTIC TOOL');
console.log('=====================================\n');

// 1. Check for multiple client files
console.log('1. CHECKING FOR MULTIPLE CLIENT FILES:');
const clientFiles = [
  'src/supabase/client.ts',
  'src/supabase/client-fixed.ts'
];

clientFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ Found: ${file}`);
    const content = fs.readFileSync(file, 'utf8');
    
    // Extract flowType configuration
    const flowTypeMatch = content.match(/flowType:\s*['"]([^'"]+)['"]/);
    const flowType = flowTypeMatch ? flowTypeMatch[1] : 'NOT_FOUND';
    
    // Extract client info header
    const headerMatch = content.match(/X-Client-Info['"]:\s*['"]([^'"]+)['"]/);
    const header = headerMatch ? headerMatch[1] : 'NOT_FOUND';
    
    // Extract autoRefreshToken setting
    const autoRefreshMatch = content.match(/autoRefreshToken:\s*(true|false)/);
    const autoRefresh = autoRefreshMatch ? autoRefreshMatch[1] : 'NOT_FOUND';
    
    console.log(`   flowType: ${flowType}`);
    console.log(`   X-Client-Info: ${header}`);
    console.log(`   autoRefreshToken: ${autoRefresh}`);
  } else {
    console.log(`❌ Missing: ${file}`);
  }
});

// 2. Check import patterns across the codebase
console.log('\n2. ANALYZING IMPORT PATTERNS:');

function findSupabaseImports(dir) {
  const results = {
    '@/supabase/client': [],
    '@/supabase/client-fixed': [],
    'relative': [],
    'other': []
  };
  
  function scanDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Look for Supabase client imports
          const importMatches = content.matchAll(/import.*from\s+['"]([^'"]+)['"]/g);
          
          for (const match of importMatches) {
            const importPath = match[1];
            
            if (importPath.includes('supabase') && importPath.includes('client')) {
              if (importPath === '@/supabase/client') {
                results['@/supabase/client'].push(filePath);
              } else if (importPath === '@/supabase/client-fixed') {
                results['@/supabase/client-fixed'].push(filePath);
              } else if (importPath.startsWith('../') || importPath.startsWith('./')) {
                results['relative'].push({ file: filePath, import: importPath });
              } else {
                results['other'].push({ file: filePath, import: importPath });
              }
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }
  
  scanDirectory(dir);
  return results;
}

const importResults = findSupabaseImports('src');

console.log(`Files importing '@/supabase/client': ${importResults['@/supabase/client'].length}`);
if (importResults['@/supabase/client'].length > 0) {
  importResults['@/supabase/client'].slice(0, 5).forEach(file => {
    console.log(`   - ${file}`);
  });
  if (importResults['@/supabase/client'].length > 5) {
    console.log(`   ... and ${importResults['@/supabase/client'].length - 5} more`);
  }
}

console.log(`\nFiles importing '@/supabase/client-fixed': ${importResults['@/supabase/client-fixed'].length}`);
if (importResults['@/supabase/client-fixed'].length > 0) {
  importResults['@/supabase/client-fixed'].forEach(file => {
    console.log(`   - ${file}`);
  });
}

console.log(`\nFiles using relative imports: ${importResults['relative'].length}`);
if (importResults['relative'].length > 0) {
  importResults['relative'].slice(0, 3).forEach(item => {
    console.log(`   - ${item.file} imports ${item.import}`);
  });
}

// 3. Check environment variables
console.log('\n3. CHECKING ENVIRONMENT VARIABLES:');

try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
  
  if (urlMatch) {
    const url = urlMatch[1].trim();
    console.log(`NEXT_PUBLIC_SUPABASE_URL: ${url}`);
    console.log(`URL format: ${url.startsWith('https://') ? '✅ Correct' : '❌ Missing https://'}`);
  } else {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL not found');
  }
  
  if (keyMatch) {
    const key = keyMatch[1].trim();
    console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${key.substring(0, 20)}...`);
    console.log(`Key format: ${key.startsWith('eyJ') ? '✅ JWT format' : '❌ Invalid format'}`);
  } else {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found');
  }
} catch (error) {
  console.log('❌ Could not read .env file');
}

// 4. Diagnosis Summary
console.log('\n4. DIAGNOSIS SUMMARY:');
console.log('====================');

const hasMultipleClients = importResults['@/supabase/client'].length > 0 && importResults['@/supabase/client-fixed'].length > 0;
const hasMixedImports = importResults['relative'].length > 0 || importResults['other'].length > 0;

console.log(`Multiple client files in use: ${hasMultipleClients ? '❌ YES' : '✅ NO'}`);
console.log(`Mixed import patterns: ${hasMixedImports ? '❌ YES' : '✅ NO'}`);
console.log(`Total files importing Supabase: ${
  importResults['@/supabase/client'].length + 
  importResults['@/supabase/client-fixed'].length + 
  importResults['relative'].length + 
  importResults['other'].length
}`);

console.log('\n🎯 ROOT CAUSE ANALYSIS:');
if (hasMultipleClients) {
  console.log('❌ MULTIPLE CLIENT INSTANCES DETECTED');
  console.log('   This is the primary cause of authentication conflicts');
  console.log('   Multiple GoTrueClient instances with same storage key');
}

if (hasMixedImports) {
  console.log('❌ INCONSISTENT IMPORT PATTERNS');
  console.log('   Some files use relative imports, others use absolute');
  console.log('   This can cause different client instances to be loaded');
}

console.log('\n💡 RECOMMENDED FIXES:');
console.log('1. Standardize all imports to use a single client file');
console.log('2. Fix flowType from "pkce" to "implicit" in the client');
console.log('3. Ensure consistent URL format with https://');
console.log('4. Remove duplicate client files');
console.log('5. Clear browser localStorage to remove conflicting auth data');

console.log('\n🔧 NEXT STEPS:');
console.log('1. Update the main client file with correct configuration');
console.log('2. Replace all imports to use the standardized client');
console.log('3. Remove the duplicate client-fixed.ts file');
console.log('4. Test authentication with single client instance');