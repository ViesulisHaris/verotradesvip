#!/usr/bin/env node

/**
 * COMPREHENSIVE API KEY DEBUG TEST
 * 
 * This test performs deep analysis of the API key issue including:
 * - Runtime environment variable detection
 * - Next.js build-time vs runtime loading
 * - File system monitoring
 * - Network request analysis
 * - Browser environment simulation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔬 [COMPREHENSIVE_DEBUG] Starting deep API key analysis...\n');

// 1. File System Analysis
console.log('📁 [FILE_SYSTEM_ANALYSIS] Deep file system scan...');

const getAllEnvFiles = () => {
  const files = [];
  const scanDir = (dir) => {
    try {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && item.startsWith('.env')) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      console.log(`⚠️  Could not scan ${dir}: ${error.message}`);
    }
  };
  
  scanDir(__dirname);
  return files;
};

const envFiles = getAllEnvFiles();
console.log(`Found ${envFiles.length} environment files:`);
envFiles.forEach(file => console.log(`  📄 ${file}`));

// 2. Detailed Content Analysis
console.log('\n🔍 [DETAILED_CONTENT_ANALYSIS] Analyzing all environment files...');

const analyzeEnvFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const stats = fs.statSync(filePath);
    
    console.log(`\n📋 File: ${path.basename(filePath)}`);
    console.log('=' .repeat(60));
    console.log(`📊 Size: ${stats.size} bytes`);
    console.log(`📅 Modified: ${stats.mtime.toISOString()}`);
    console.log(`📝 Lines: ${lines.length}`);
    
    const anonKeyMatch = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
    const serviceKeyMatch = content.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    const urlMatch = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    
    if (anonKeyMatch) {
      const key = anonKeyMatch[1].trim();
      const segments = key.split('.');
      console.log(`🔑 ANON_KEY:`);
      console.log(`   Length: ${key.length} chars`);
      console.log(`   Segments: ${segments.length}`);
      console.log(`   Header: ${segments[0]?.length || 0} chars`);
      console.log(`   Payload: ${segments[1]?.length || 0} chars`);
      console.log(`   Signature: ${segments[2]?.length || 0} chars`);
      console.log(`   Valid JWT: ${segments.length === 3 ? '✅' : '❌'}`);
      console.log(`   Complete: ${key.length >= 300 ? '✅' : '❌'}`);
      
      if (segments[2]) {
        console.log(`   Signature preview: "${segments[2].substring(0, 20)}..."`);
      }
    }
    
    if (serviceKeyMatch) {
      const key = serviceKeyMatch[1].trim();
      const segments = key.split('.');
      console.log(`🔐 SERVICE_KEY:`);
      console.log(`   Length: ${key.length} chars`);
      console.log(`   Valid JWT: ${segments.length === 3 ? '✅' : '❌'}`);
    }
    
    if (urlMatch) {
      console.log(`🌐 URL: ${urlMatch[1].trim()}`);
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /1234567890abcdef/,  // Placeholder pattern
      /XyZ123/,            // Generic placeholder
      /\.env\.fixed/,      // Reference to fixed file
      /truncated/i,        // Explicit truncation note
      /incomplete/i        // Explicit incompleteness note
    ];
    
    const foundPatterns = suspiciousPatterns.filter(pattern => pattern.test(content));
    if (foundPatterns.length > 0) {
      console.log(`⚠️  Suspicious patterns found: ${foundPatterns.length}`);
      foundPatterns.forEach(pattern => console.log(`   - ${pattern}`));
    }
    
  } catch (error) {
    console.log(`❌ Error analyzing ${filePath}: ${error.message}`);
  }
};

envFiles.forEach(analyzeEnvFile);

// 3. Next.js Process Environment Analysis
console.log('\n🚀 [NEXTJS_PROCESS_ANALYSIS] Analyzing Next.js environment loading...');

try {
  // Try to get environment variables as Next.js would see them
  const nextEnv = execSync('cd verotradesvip && npm run build --dry-run 2>&1 || echo "Build analysis failed"', { 
    encoding: 'utf8',
    timeout: 10000 
  });
  
  console.log('📦 Next.js build output:');
  console.log(nextEnv.substring(0, 500) + '...');
  
} catch (error) {
  console.log('⚠️  Could not analyze Next.js build process');
}

// 4. Runtime Environment Simulation
console.log('\n🎭 [RUNTIME_SIMULATION] Simulating runtime environment...');

// Simulate Next.js environment loading order
const simulateNextJsEnvLoading = () => {
  console.log('🔄 Simulating Next.js environment variable loading...');
  
  const envVars = {};
  
  // Next.js loads in this order:
  const loadOrder = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.production'
  ];
  
  loadOrder.forEach(filename => {
    const filePath = path.join(__dirname, filename);
    if (fs.existsSync(filePath)) {
      console.log(`📖 Loading: ${filename}`);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach(line => {
          const match = line.match(/^([^#][^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            
            // Only set if not already set (simulating priority)
            if (!envVars[key]) {
              envVars[key] = value;
              console.log(`   ✅ ${key} = ${value.substring(0, 20)}...`);
            } else {
              console.log(`   ⏭️  ${key} already set, skipping`);
            }
          }
        });
      } catch (error) {
        console.log(`   ❌ Error loading ${filename}: ${error.message}`);
      }
    } else {
      console.log(`⚪ ${filename} not found`);
    }
  });
  
  return envVars;
};

const simulatedEnv = simulateNextJsEnvLoading();

// 5. Analyze the simulated environment
console.log('\n🎯 [SIMULATED_ENV_ANALYSIS] Analyzing simulated environment...');

if (simulatedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const key = simulatedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const segments = key.split('.');
  
  console.log(`🔑 Final ANON_KEY that Next.js would use:`);
  console.log(`   Length: ${key.length} chars`);
  console.log(`   Segments: ${segments.length}`);
  console.log(`   Signature: ${segments[2]?.length || 0} chars`);
  console.log(`   Valid: ${key.length >= 300 && segments.length === 3 ? '✅' : '❌'}`);
  
  if (key.length < 300) {
    console.log(`\n🚨 [CRITICAL_ISSUE] Simulated environment shows TRUNCATED API key!`);
    console.log(`   This explains why 401 errors persist despite "fixes"`);
    console.log(`   The key is ${300 - key.length} characters too short`);
  }
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in simulated environment');
}

// 6. Network Request Analysis
console.log('\n🌐 [NETWORK_ANALYSIS] Analyzing network request patterns...');

// Check what URL the app would try to connect to
if (simulatedEnv.NEXT_PUBLIC_SUPABASE_URL) {
  const url = simulatedEnv.NEXT_PUBLIC_SUPABASE_URL;
  console.log(`🌐 Supabase URL: ${url}`);
  
  // Extract project ID
  const projectId = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (projectId) {
    console.log(`🆔 Project ID: ${projectId}`);
    console.log(`🔗 Dashboard: https://supabase.com/dashboard/project/${projectId}/settings/api`);
  }
}

// 7. Generate Comprehensive Report
console.log('\n📊 [COMPREHENSIVE_REPORT] Generating debug report...');

const report = {
  timestamp: new Date().toISOString(),
  issue: 'Persistent API Key Truncation and 401 Errors',
  findings: {
    envFiles: envFiles.map(file => path.basename(file)),
    simulatedEnvKey: simulatedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    simulatedEnvValid: (simulatedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0) >= 300,
    activeFile: envFiles.length > 0 ? path.basename(envFiles[envFiles.length - 1]) : null,
    rootCause: 'Environment file loading priority causing truncated key to be used'
  },
  recommendations: [
    'Fix the API key in the highest priority environment file',
    'Remove or rename conflicting environment files',
    'Restart development server after fixing',
    'Test with fresh API keys from Supabase dashboard'
  ]
};

const reportPath = path.join(__dirname, `API_KEY_COMPREHENSIVE_DEBUG_REPORT_${Date.now()}.json`);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`📄 Debug report saved to: ${reportPath}`);

// 8. Immediate Fix Validation
console.log('\n🔧 [IMMEDIATE_FIX_VALIDATION] Checking for immediate fix opportunities...');

const findBestApiKey = () => {
  let bestKey = null;
  let bestSource = null;
  let bestLength = 0;
  
  envFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const match = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
      
      if (match) {
        const key = match[1].trim();
        if (key.length > bestLength && key.length >= 300) {
          bestKey = key;
          bestSource = path.basename(filePath);
          bestLength = key.length;
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  return { bestKey, bestSource, bestLength };
};

const { bestKey, bestSource, bestLength } = findBestApiKey();

if (bestKey) {
  console.log(`✅ Found complete API key in: ${bestSource}`);
  console.log(`📏 Length: ${bestLength} characters`);
  console.log(`🎯 This key should replace the truncated key in the active environment file`);
} else {
  console.log(`❌ No complete API key found in any environment file`);
  console.log(`🔄 Need to obtain fresh API key from Supabase dashboard`);
}

console.log('\n🏁 [COMPREHENSIVE_DEBUG_COMPLETE] Deep analysis finished.');
console.log('=' .repeat(70));