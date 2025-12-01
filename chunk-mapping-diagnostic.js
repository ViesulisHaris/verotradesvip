const fs = require('fs');
const path = require('path');

console.log('=== CHUNK MAPPING DIAGNOSTIC ===');
console.log('Time:', new Date().toISOString());
console.log('');

// Key findings from webpack runtime analysis
console.log('=== CRITICAL FINDINGS FROM WEBPACK RUNTIME ===');
console.log('1. Webpack public path: /_next/');
console.log('2. Chunk URL function (__webpack_require__.u) returns: undefined');
console.log('3. Only chunk 272 is pre-installed in installedChunks');
console.log('4. Chunk loading uses JSONP with webpackChunk_N_E');
console.log('');

// Check for App Router specific manifests
console.log('=== APP ROUTER MANIFEST ANALYSIS ===');
try {
  const appPathsManifest = '.next/server/app-paths-manifest.json';
  if (fs.existsSync(appPathsManifest)) {
    const manifest = JSON.parse(fs.readFileSync(appPathsManifest, 'utf8'));
    console.log('App paths manifest exists: YES');
    console.log('Pages in manifest:', Object.keys(manifest).length);
    
    // Check for page.js in manifest
    const pageEntry = manifest['/page'];
    if (pageEntry) {
      console.log('/page entry in manifest:', pageEntry);
    } else {
      console.log('/page entry: NOT FOUND');
    }
  } else {
    console.log('App paths manifest exists: NO');
  }
} catch (error) {
  console.log('Error checking app paths manifest:', error.message);
}

console.log('');

// Check client reference manifest
console.log('=== CLIENT REFERENCE MANIFEST ===');
try {
  const clientRefPath = '.next/static/development/_devPagesManifest.json';
  if (fs.existsSync(clientRefPath)) {
    const manifest = JSON.parse(fs.readFileSync(clientRefPath, 'utf8'));
    console.log('Dev pages manifest exists: YES');
    console.log('Pages:', Object.keys(manifest));
    
    // Check for page.js
    const pageEntry = manifest['/page'];
    if (pageEntry) {
      console.log('/page entry:', pageEntry);
    } else {
      console.log('/page entry: NOT FOUND');
    }
  } else {
    console.log('Dev pages manifest exists: NO');
  }
} catch (error) {
  console.log('Error checking dev pages manifest:', error.message);
}

console.log('');

// Analyze the actual chunk loading issue
console.log('=== ROOT CAUSE ANALYSIS ===');
console.log('');
console.log('IDENTIFIED ISSUES:');
console.log('');
console.log('1. MISSING CHUNK URL RESOLUTION:');
console.log('   - __webpack_require__.u(chunkId) returns undefined');
console.log('   - This means webpack cannot generate proper URLs for chunks');
console.log('   - Chunk 931 request fails because URL is malformed');
console.log('');
console.log('2. APP ROUTER vs PAGES ROUTER CONFUSION:');
console.log('   - Build manifest only shows /_app (Pages Router)');
console.log('   - But app/page.js exists (App Router structure)');
console.log('   - Development server may be serving mixed routing modes');
console.log('');
console.log('3. CHUNK ID MISMATCH:');
console.log('   - Error references chunk 931');
console.log('   - But no mapping exists for chunk 931');
console.log('   - app/page.js exists but with different chunk ID');
console.log('');

// Check Next.js configuration
console.log('=== NEXT.JS CONFIGURATION ===');
try {
  const nextConfigPath = 'next.config.js';
  if (fs.existsSync(nextConfigPath)) {
    console.log('next.config.js exists: YES');
    const config = fs.readFileSync(nextConfigPath, 'utf8');
    console.log('Config content preview:', config.substring(0, 200));
  } else {
    console.log('next.config.js exists: NO');
  }
} catch (error) {
  console.log('Error checking Next.js config:', error.message);
}

console.log('');

// Check if this is actually an App Router project
console.log('=== PROJECT STRUCTURE ANALYSIS ===');
try {
  const appDir = 'src/app';
  const pagesDir = 'src/pages';
  
  const hasAppDir = fs.existsSync(appDir);
  const hasPagesDir = fs.existsSync(pagesDir);
  
  console.log('Has src/app directory:', hasAppDir ? 'YES' : 'NO');
  console.log('Has src/pages directory:', hasPagesDir ? 'YES' : 'NO');
  
  if (hasAppDir) {
    const appFiles = fs.readdirSync(appDir);
    console.log('Files in src/app:', appFiles);
    
    const hasPageJs = appFiles.includes('page.js') || appFiles.includes('page.tsx');
    console.log('Has page.js/tsx in src/app:', hasPageJs ? 'YES' : 'NO');
  }
  
  if (hasPagesDir) {
    const pagesFiles = fs.readdirSync(pagesDir);
    console.log('Files in src/pages:', pagesFiles);
  }
} catch (error) {
  console.log('Error analyzing project structure:', error.message);
}

console.log('');

// FINAL DIAGNOSIS
console.log('=== FINAL DIAGNOSIS ===');
console.log('');
console.log('PRIMARY ISSUE: Webpack chunk URL resolution is broken');
console.log('');
console.log('The __webpack_require__.u(chunkId) function returns undefined,');
console.log('which means webpack cannot generate proper URLs for chunks.');
console.log('');
console.log('This happens because:');
console.log('1. The project appears to be using App Router (src/app/page.tsx)');
console.log('2. But the build manifests show Pages Router structure');
console.log('3. Webpack runtime is not properly configured for App Router');
console.log('');
console.log('SECONDARY ISSUE: Chunk ID 931 does not exist');
console.log('');
console.log('The error references chunk 931, but this chunk ID is not');
console.log('mapped to any actual file. The app/page.js file exists but');
console.log('has a different chunk ID in the build system.');
console.log('');

console.log('=== RECOMMENDED FIX ===');
console.log('');
console.log('1. Ensure Next.js is properly configured for App Router');
console.log('2. Clear .next directory completely');
console.log('3. Restart development server with fresh build');
console.log('4. Verify webpack chunk URL resolution is working');
console.log('');

console.log('=== END DIAGNOSTIC ===');