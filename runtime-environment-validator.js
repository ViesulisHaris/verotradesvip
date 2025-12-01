#!/usr/bin/env node

/**
 * RUNTIME ENVIRONMENT VALIDATOR
 * 
 * This script validates the actual runtime environment that Next.js is using
 * by checking the exact same environment loading mechanism as Next.js
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 [RUNTIME_VALIDATOR] Validating actual Next.js runtime environment...\n');

// Simulate Next.js exact environment loading order
const validateNextJsRuntime = () => {
  console.log('🔄 [NEXTJS_SIMULATION] Simulating exact Next.js environment loading...\n');
  
  const envVars = {};
  const loadOrder = [
    '.env',
    '.env.local',  // This has highest priority and overwrites .env
    '.env.development',
    '.env.production'
  ];
  
  console.log('📋 Loading order (Next.js specification):');
  loadOrder.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  console.log('');
  
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
            
            if (!envVars[key]) {
              envVars[key] = value;
              console.log(`   ✅ SET ${key} = ${value.substring(0, 30)}...`);
            } else {
              console.log(`   ⏭️  SKIP ${key} (already set by higher priority file)`);
            }
          }
        });
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    } else {
      console.log(`⚪ Not found: ${filename}`);
    }
  });
  
  return envVars;
};

const runtimeEnv = validateNextJsRuntime();

// Analyze the critical API key
console.log('\n🔍 [CRITICAL_ANALYSIS] Analyzing the API key that Next.js will actually use...');

if (runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const key = runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const segments = key.split('.');
  
  console.log(`🔑 FINAL API KEY ANALYSIS:`);
  console.log(`   Source: Determined by Next.js priority loading`);
  console.log(`   Length: ${key.length} characters`);
  console.log(`   Expected: 300+ characters`);
  console.log(`   Status: ${key.length >= 300 ? '✅ COMPLETE' : '❌ TRUNCATED'}`);
  console.log(`   Segments: ${segments.length}`);
  console.log(`   Header: ${segments[0]?.length || 0} chars`);
  console.log(`   Payload: ${segments[1]?.length || 0} chars`);
  console.log(`   Signature: ${segments[2]?.length || 0} chars`);
  
  if (key.length < 300) {
    console.log(`\n🚨 [ROOT_CAUSE_CONFIRMED] TRUNCATED API KEY DETECTED!`);
    console.log(`   Problem: ${300 - key.length} characters missing`);
    console.log(`   Impact: Supabase will reject with 401 "Invalid API key"`);
    console.log(`   Reason: Environment file priority loading issue`);
    
    // Determine which file is causing the problem
    const envFiles = ['.env', '.env.local', '.env.fixed'];
    let problematicFile = null;
    
    for (const file of envFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const match = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
          if (match && match[1].trim() === key) {
            problematicFile = file;
            break;
          }
        } catch (error) {
          // Skip
        }
      }
    }
    
    if (problematicFile) {
      console.log(`   Problematic file: ${problematicFile}`);
      console.log(`   Priority: ${problematicFile === '.env.local' ? 'HIGHEST (overwrites others)' : 'Lower'}`);
    }
  }
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in runtime environment');
}

// Find the best available key
console.log('\n🔧 [SOLUTION_ANALYSIS] Finding the best available API key...');

const findBestKey = () => {
  const candidates = [];
  
  ['.env', '.env.local', '.env.fixed'].forEach(filename => {
    const filePath = path.join(__dirname, filename);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
        if (match) {
          const key = match[1].trim();
          candidates.push({
            file: filename,
            key: key,
            length: key.length,
            isValid: key.length >= 300 && key.split('.').length === 3
          });
        }
      } catch (error) {
        // Skip
      }
    }
  });
  
  return candidates.sort((a, b) => b.length - a.length);
};

const candidates = findBestKey();

console.log(`📊 Found ${candidates.length} API key candidates:`);
candidates.forEach((candidate, index) => {
  console.log(`   ${index + 1}. ${candidate.file}: ${candidate.length} chars ${candidate.isValid ? '✅' : '❌'}`);
});

const bestCandidate = candidates.find(c => c.isValid);
if (bestCandidate) {
  console.log(`\n✅ [SOLUTION_FOUND] Best key available in: ${bestCandidate.file}`);
  console.log(`   Length: ${bestCandidate.length} characters`);
  console.log(`   Status: Valid and complete`);
  
  // Determine which file needs to be fixed
  const activeFile = candidates.find(c => c.key === runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (activeFile && activeFile.file !== bestCandidate.file) {
    console.log(`\n🎯 [FIX_REQUIRED] Replace key in ${activeFile.file} with key from ${bestCandidate.file}`);
  }
} else {
  console.log(`\n❌ [NO_SOLUTION] No valid API key found in any environment file`);
  console.log(`   Action required: Get fresh API key from Supabase dashboard`);
}

console.log('\n🏁 [RUNTIME_VALIDATION_COMPLETE] Runtime environment analysis finished.');
console.log('=' .repeat(70));