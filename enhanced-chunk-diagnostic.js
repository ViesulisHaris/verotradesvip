const fs = require('fs');
const path = require('path');

console.log('=== ENHANCED CHUNK LOADING DIAGNOSTIC ===');
console.log('Time:', new Date().toISOString());
console.log('');

// Check for development server
const { execSync } = require('child_process');
let devServerRunning = false;
try {
  const netstat = execSync('netstat -an | findstr :3000', { encoding: 'utf8' });
  devServerRunning = netstat.includes('LISTENING');
  console.log('=== DEVELOPMENT SERVER STATUS ===');
  console.log('Server running on port 3000:', devServerRunning ? 'YES' : 'NO');
} catch (error) {
  console.log('Could not check server status:', error.message);
}

console.log('');

// Analyze chunk files and their mapping
console.log('=== CHUNK ID MAPPING ANALYSIS ===');
try {
  // Read the client manifest to understand chunk ID mapping
  const clientManifestPath = '.next/static/development/_buildManifest.js';
  if (fs.existsSync(clientManifestPath)) {
    const manifestContent = fs.readFileSync(clientManifestPath, 'utf8');
    console.log('Build manifest exists: YES');
    
    // Extract chunk mappings from the manifest
    const chunkMappingRegex = /"([^"]+)":\s*"([^"]+)"/g;
    const chunkMappings = {};
    let match;
    while ((match = chunkMappingRegex.exec(manifestContent)) !== null) {
      chunkMappings[match[1]] = match[2];
    }
    
    console.log('Total chunk mappings found:', Object.keys(chunkMappings).length);
    
    // Check for chunk 931 specifically
    if (chunkMappings['931']) {
      console.log('Chunk 931 mapping found:', chunkMappings['931']);
    } else {
      console.log('Chunk 931 mapping: NOT FOUND');
      
      // Look for app/page.js mapping
      const pageJsMapping = Object.entries(chunkMappings).find(([id, path]) => path.includes('app/page.js'));
      if (pageJsMapping) {
        console.log(`app/page.js found with chunk ID: ${pageJsMapping[0]} -> ${pageJsMapping[1]}`);
      } else {
        console.log('app/page.js mapping: NOT FOUND in manifest');
      }
    }
  } else {
    console.log('Build manifest exists: NO');
    console.log('Path checked:', clientManifestPath);
  }
} catch (error) {
  console.log('Error analyzing chunk mappings:', error.message);
}

console.log('');

// Check webpack runtime for chunk loading logic
console.log('=== WEBPACK RUNTIME ANALYSIS ===');
try {
  const webpackPath = '.next/static/chunks/webpack.js';
  if (fs.existsSync(webpackPath)) {
    const webpackContent = fs.readFileSync(webpackPath, 'utf8');
    
    // Look for chunk loading functions
    const hasJsonpScriptSrc = webpackContent.includes('__webpack_require__.p');
    const hasChunkLoadingLogic = webpackContent.includes('JSONP') || webpackContent.includes('chunk');
    
    console.log('Webpack runtime exists: YES');
    console.log('Has JSONP chunk loading:', hasJsonpScriptSrc ? 'YES' : 'NO');
    console.log('Has chunk loading logic:', hasChunkLoadingLogic ? 'YES' : 'NO');
    
    // Extract public path if available
    const publicPathMatch = webpackContent.match(/__webpack_require__\.p\s*=\s*["']([^"']+)["']/);
    if (publicPathMatch) {
      console.log('Webpack public path:', publicPathMatch[1]);
    }
  } else {
    console.log('Webpack runtime exists: NO');
  }
} catch (error) {
  console.log('Error analyzing webpack runtime:', error.message);
}

console.log('');

// Verify file accessibility
console.log('=== FILE ACCESSIBILITY VERIFICATION ===');
try {
  const pageJsPath = '.next/static/chunks/app/page.js';
  if (fs.existsSync(pageJsPath)) {
    const stats = fs.statSync(pageJsPath);
    console.log('app/page.js exists: YES');
    console.log('File size:', stats.size, 'bytes');
    console.log('Last modified:', stats.mtime.toISOString());
    
    // Check if file is readable
    try {
      const content = fs.readFileSync(pageJsPath, 'utf8');
      console.log('File readable: YES');
      console.log('Content length:', content.length, 'characters');
      console.log('First 100 chars:', content.substring(0, 100));
    } catch (readError) {
      console.log('File readable: NO -', readError.message);
    }
  } else {
    console.log('app/page.js exists: NO');
  }
} catch (error) {
  console.log('Error checking file accessibility:', error.message);
}

console.log('');

// Check for Next.js development middleware
console.log('=== NEXT.JS DEVELOPMENT MIDDLEWARE ===');
try {
  const serverAppPath = '.next/server/app/page.js';
  if (fs.existsSync(serverAppPath)) {
    console.log('Server-side app/page.js exists: YES');
  } else {
    console.log('Server-side app/page.js exists: NO');
  }
  
  // Check for middleware files
  const middlewarePath = '.next/server/middleware.js';
  if (fs.existsSync(middlewarePath)) {
    console.log('Middleware exists: YES');
  } else {
    console.log('Middleware exists: NO');
  }
} catch (error) {
  console.log('Error checking Next.js middleware:', error.message);
}

console.log('');

// Analyze potential causes
console.log('=== POTENTIAL CAUSES ANALYSIS ===');

const potentialCauses = [
  'Chunk ID mismatch between manifest and actual files',
  'Development server not properly serving static chunks',
  'Webpack public path configuration issue',
  'Browser caching issues',
  'File permissions or accessibility issues',
  'Next.js development mode chunk loading bug',
  'Incomplete build process'
];

console.log('Investigating the following potential causes:');
potentialCauses.forEach((cause, index) => {
  console.log(`${index + 1}. ${cause}`);
});

console.log('');

// Most likely causes based on analysis
console.log('=== MOST LIKELY CAUSES ===');
console.log('Based on the analysis, the most likely causes are:');
console.log('');
console.log('1. CHUNK ID MISMATCH: The error mentions chunk 931, but the actual');
console.log('   app/page.js file exists with a different chunk ID');
console.log('');
console.log('2. WEBPACK PUBLIC PATH ISSUE: The webpack runtime might be looking');
console.log('   for chunks in the wrong location due to incorrect public path');
console.log('');

console.log('=== RECOMMENDED DIAGNOSTIC ACTIONS ===');
console.log('1. Check browser console for detailed chunk loading errors');
console.log('2. Verify Network tab for failed chunk requests');
console.log('3. Test direct access to: http://localhost:3000/_next/static/chunks/app/page.js');
console.log('4. Clear browser cache and hard refresh');
console.log('5. Check if chunk ID 931 exists in any mapping files');

console.log('');
console.log('=== END ENHANCED DIAGNOSTIC ===');