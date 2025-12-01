// ChunkLoadError Diagnostic Script
// This script helps identify the root cause of the ChunkLoadError

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 [CHUNKLOAD_ERROR_DIAGNOSTIC] Starting diagnostic...\n');

// 1. Check for multiple development servers
console.log('📊 [DIAGNOSTIC] Checking for multiple development servers...');
try {
  const netstat3000 = execSync('netstat -ano | findstr :3000', { encoding: 'utf8' });
  const netstat3003 = execSync('netstat -ano | findstr :3003', { encoding: 'utf8' });
  
  console.log('✅ Port 3000 processes:', netstat3000.trim().split('\n').length);
  console.log('✅ Port 3003 processes:', netstat3003.trim().split('\n').length);
  
  if (netstat3000.includes('LISTENING') && netstat3003.includes('LISTENING')) {
    console.log('🚨 [ISSUE_FOUND] Multiple Next.js servers detected!');
    console.log('   - This is likely causing the port mismatch in chunk loading');
  }
} catch (error) {
  console.log('❌ Error checking ports:', error.message);
}

// 2. Check dashboard component
console.log('\n📊 [DIAGNOSTIC] Checking dashboard component...');
const dashboardPath = path.join(__dirname, 'src/app/dashboard/page.tsx');
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  if (dashboardContent.trim() === '') {
    console.log('🚨 [ISSUE_FOUND] Dashboard component is empty!');
    console.log('   - This could cause routing/chunk loading issues');
  } else {
    console.log('✅ Dashboard component has content');
  }
} else {
  console.log('❌ Dashboard component not found');
}

// 3. Check layout chunk
console.log('\n📊 [DIAGNOSTIC] Checking layout chunk...');
const layoutChunkPath = path.join(__dirname, '.next/static/chunks/app/layout.js');
if (fs.existsSync(layoutChunkPath)) {
  const stats = fs.statSync(layoutChunkPath);
  console.log('✅ Layout chunk exists, size:', stats.size, 'bytes');
  if (stats.size === 0) {
    console.log('🚨 [ISSUE_FOUND] Layout chunk is empty!');
  }
} else {
  console.log('❌ Layout chunk not found');
}

// 4. Check for UnifiedLayout import
console.log('\n📊 [DIAGNOSTIC] Checking for UnifiedLayout import...');
try {
  const layoutContent = fs.readFileSync(path.join(__dirname, 'src/app/layout.tsx'), 'utf8');
  if (layoutContent.includes('UnifiedLayout')) {
    console.log('✅ UnifiedLayout import found in layout.tsx');
  } else {
    console.log('ℹ️  No UnifiedLayout import found in layout.tsx');
  }
} catch (error) {
  console.log('❌ Error reading layout.tsx:', error.message);
}

// 5. Check Next.js configuration
console.log('\n📊 [DIAGNOSTIC] Checking Next.js configuration...');
try {
  const nextConfig = require(path.join(__dirname, 'next.config.js'));
  console.log('✅ Next.js config loaded successfully');
  console.log('   - React strict mode:', nextConfig.reactStrictMode);
  console.log('   - Page extensions:', nextConfig.pageExtensions);
} catch (error) {
  console.log('❌ Error loading Next.js config:', error.message);
}

console.log('\n🎯 [DIAGNOSTIC_COMPLETE] Diagnostic finished');
console.log('\n💡 [RECOMMENDATIONS]');
console.log('1. Kill the development server on port 3003');
console.log('2. Add content to the empty dashboard component');
console.log('3. Clear .next cache and restart development server');
console.log('4. Ensure only one development server is running on port 3000');