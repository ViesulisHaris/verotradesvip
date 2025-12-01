const fs = require('fs');
const path = require('path');

console.log('=== WEBPACK CHUNK LOADING DIAGNOSTIC ===');
console.log('Time:', new Date().toISOString());
console.log('');

// 1. Check if main-app.js exists in the build
console.log('=== MAIN-APP.JS EXISTENCE CHECK ===');
const mainAppPaths = [
  '.next/static/chunks/main-app.js',
  '.next/static/chunks/app/main-app.js',
  '.next/static/chunks/app/page.js',
  '.next/server/app/page.js'
];

let mainAppFound = false;
mainAppPaths.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`✅ FOUND: ${filePath}`);
    mainAppFound = true;
  } else {
    console.log(`❌ MISSING: ${filePath}`);
  }
});

console.log('');
console.log('Main-app.js found:', mainAppFound ? 'YES' : 'NO');
console.log('');

// 2. Check webpack runtime for chunk URL resolution
console.log('=== WEBPACK RUNTIME ANALYSIS ===');
try {
  const webpackPath = '.next/static/chunks/webpack.js';
  if (fs.existsSync(webpackPath)) {
    const webpackContent = fs.readFileSync(webpackPath, 'utf8');
    
    // Look for chunk URL function
    const hasChunkUrlFunction = webpackContent.includes('__webpack_require__.u');
    const hasPublicPath = webpackContent.includes('__webpack_require__.p');
    const hasJsonpScriptSrc = webpackContent.includes('jsonpScriptSrc');
    
    console.log('Webpack runtime analysis:');
    console.log(`- Has __webpack_require__.u: ${hasChunkUrlFunction ? 'YES' : 'NO'}`);
    console.log(`- Has __webpack_require__.p: ${hasPublicPath ? 'YES' : 'NO'}`);
    console.log(`- Has jsonpScriptSrc: ${hasJsonpScriptSrc ? 'YES' : 'NO'}`);
    
    // Extract public path if available
    const publicPathMatch = webpackContent.match(/__webpack_require__\.p\s*=\s*["']([^"']+)["']/);
    if (publicPathMatch) {
      console.log(`- Public path: ${publicPathMatch[1]}`);
    } else {
      console.log('- Public path: NOT FOUND');
    }
    
    // Look for chunk URL function definition
    const chunkUrlMatch = webpackContent.match(/__webpack_require__\.u\s*=\s*function\(chunkId\)\s*\{[^}]+\}/);
    if (chunkUrlMatch) {
      console.log('- Chunk URL function: FOUND');
      console.log(`  Function: ${chunkUrlMatch[0].substring(0, 100)}...`);
    } else {
      console.log('- Chunk URL function: NOT FOUND');
    }
  } else {
    console.log('❌ Webpack runtime file not found');
  }
} catch (error) {
  console.log('Error analyzing webpack runtime:', error.message);
}

console.log('');

// 3. Check build manifests
console.log('=== BUILD MANIFEST ANALYSIS ===');
try {
  const buildManifestPath = '.next/build-manifest.json';
  if (fs.existsSync(buildManifestPath)) {
    const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
    console.log('Build manifest entries:');
    Object.keys(buildManifest).forEach(key => {
      console.log(`- ${key}: ${buildManifest[key].join(', ')}`);
    });
  } else {
    console.log('❌ Build manifest not found');
  }
} catch (error) {
  console.log('Error reading build manifest:', error.message);
}

console.log('');

try {
  const appBuildManifestPath = '.next/app-build-manifest.json';
  if (fs.existsSync(appBuildManifestPath)) {
    const appBuildManifest = JSON.parse(fs.readFileSync(appBuildManifestPath, 'utf8'));
    console.log('App build manifest entries:');
    Object.keys(appBuildManifest).forEach(key => {
      console.log(`- ${key}: ${appBuildManifest[key]}`);
    });
  } else {
    console.log('❌ App build manifest not found');
  }
} catch (error) {
  console.log('Error reading app build manifest:', error.message);
}

console.log('');

// 4. Check for development server chunks
console.log('=== DEVELOPMENT SERVER CHUNKS ===');
try {
  const devManifestPath = '.next/static/development/_devPagesManifest.json';
  if (fs.existsSync(devManifestPath)) {
    const devManifest = JSON.parse(fs.readFileSync(devManifestPath, 'utf8'));
    console.log('Development manifest entries:');
    Object.keys(devManifest).forEach(key => {
      console.log(`- ${key}: ${devManifest[key]}`);
    });
  } else {
    console.log('❌ Development manifest not found');
  }
} catch (error) {
  console.log('Error reading development manifest:', error.message);
}

console.log('');

// 5. Analyze project structure
console.log('=== PROJECT STRUCTURE ANALYSIS ===');
try {
  const appDir = 'src/app';
  const pagesDir = 'src/pages';
  
  const hasAppDir = fs.existsSync(appDir);
  const hasPagesDir = fs.existsSync(pagesDir);
  
  console.log(`Has src/app directory: ${hasAppDir ? 'YES' : 'NO'}`);
  console.log(`Has src/pages directory: ${hasPagesDir ? 'YES' : 'NO'}`);
  
  if (hasAppDir) {
    const appFiles = fs.readdirSync(appDir);
    console.log('Files in src/app:', appFiles);
    
    const hasPageJs = appFiles.includes('page.js') || appFiles.includes('page.tsx');
    console.log(`Has page.js/tsx in src/app: ${hasPageJs ? 'YES' : 'NO'}`);
    
    if (hasPageJs) {
      const pageFile = appFiles.find(f => f === 'page.js' || f === 'page.tsx');
      console.log(`Page file: ${pageFile}`);
    }
  }
} catch (error) {
  console.log('Error analyzing project structure:', error.message);
}

console.log('');

// 6. Check for any chunk loading errors in recent logs
console.log('=== CHUNK LOADING ERROR ANALYSIS ===');
console.log('Looking for patterns that indicate chunk loading issues...');
console.log('');
console.log('DIAGNOSTIC SUMMARY:');
console.log('');

// Determine the most likely issues
if (!mainAppFound) {
  console.log('🔴 CRITICAL: main-app.js is missing from build output');
  console.log('   This explains the 404 error for main-app.js');
  console.log('   The application cannot load without this critical chunk');
} else {
  console.log('✅ main-app.js exists in build output');
}

console.log('');
console.log('NEXT STEPS:');
console.log('1. If main-app.js is missing, rebuild the application');
console.log('2. Check webpack runtime for proper chunk URL resolution');
console.log('3. Verify development server is serving chunks correctly');
console.log('4. Test application loading in browser');

console.log('');
console.log('=== END DIAGNOSTIC ===');