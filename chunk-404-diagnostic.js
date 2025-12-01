const fs = require('fs');
const path = require('path');

console.log('=== CHUNK 404 DIAGNOSTIC REPORT ===');
console.log('Time:', new Date().toISOString());
console.log('');

// Check if build is still running
const { execSync } = require('child_process');
try {
  const nodeProcesses = execSync('tasklist | findstr node', { encoding: 'utf8' });
  const buildProcesses = nodeProcesses.split('\n').filter(line => line.includes('build'));
  console.log('=== BUILD PROCESSES ===');
  if (buildProcesses.length > 0) {
    console.log('Build processes are still running:');
    buildProcesses.forEach(process => console.log(process.trim()));
  } else {
    console.log('No build processes found');
  }
} catch (error) {
  console.log('Error checking build processes:', error.message);
}

console.log('');

// Read build manifests
console.log('=== BUILD MANIFEST ANALYSIS ===');
try {
  const buildManifest = JSON.parse(fs.readFileSync('.next/build-manifest.json', 'utf8'));
  const appBuildManifest = JSON.parse(fs.readFileSync('.next/app-build-manifest.json', 'utf8'));
  
  // Extract all expected chunk files from manifests
  const expectedChunks = new Set();
  
  // From build-manifest.json
  buildManifest.rootMainFiles.forEach(file => {
    if (file.startsWith('static/chunks/')) {
      expectedChunks.add(file.replace('static/chunks/', ''));
    }
  });
  
  // From app-build-manifest.json
  Object.values(appBuildManifest.pages).forEach(chunks => {
    chunks.forEach(file => {
      if (file.startsWith('static/chunks/')) {
        expectedChunks.add(file.replace('static/chunks/', ''));
      }
    });
  });
  
  console.log('Expected chunk files from manifests:', expectedChunks.size);
  
  // Check actual files in .next/static/chunks/
  const actualChunks = new Set();
  
  function scanChunksDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach(item => {
      if (item.isFile() && item.name.endsWith('.js')) {
        actualChunks.add(item.name);
      } else if (item.isDirectory()) {
        scanChunksDir(path.join(dir, item.name));
      }
    });
  }
  
  scanChunksDir('.next/static/chunks');
  
  console.log('Actual chunk files found:', actualChunks.size);
  
  // Find missing chunks
  const missingChunks = [];
  expectedChunks.forEach(chunk => {
    if (!actualChunks.has(chunk)) {
      missingChunks.push(chunk);
    }
  });
  
  console.log('');
  console.log('=== MISSING CHUNK FILES ===');
  console.log('Total missing chunks:', missingChunks.length);
  
  // Group missing chunks by type
  const frameworkChunks = missingChunks.filter(chunk => chunk.startsWith('framework-'));
  const vendorChunks = missingChunks.filter(chunk => chunk.includes('vendor'));
  const mainAppChunks = missingChunks.filter(chunk => chunk.includes('main-app'));
  const otherChunks = missingChunks.filter(chunk => 
    !chunk.startsWith('framework-') && 
    !chunk.includes('vendor') && 
    !chunk.includes('main-app')
  );
  
  console.log('');
  console.log('Framework chunks missing:', frameworkChunks.length);
  if (frameworkChunks.length > 0) {
    console.log('First 10 framework chunks:');
    frameworkChunks.slice(0, 10).forEach(chunk => console.log('  -', chunk));
  }
  
  console.log('');
  console.log('Vendor chunks missing:', vendorChunks.length);
  vendorChunks.forEach(chunk => console.log('  -', chunk));
  
  console.log('');
  console.log('Main app chunks missing:', mainAppChunks.length);
  mainAppChunks.forEach(chunk => console.log('  -', chunk));
  
  console.log('');
  console.log('Other chunks missing:', otherChunks.length);
  if (otherChunks.length > 0) {
    console.log('First 10 other chunks:');
    otherChunks.slice(0, 10).forEach(chunk => console.log('  -', chunk));
  }
  
  console.log('');
  console.log('=== ROOT CAUSE ANALYSIS ===');
  console.log('1. Build process status:', buildProcesses.length > 0 ? 'STILL RUNNING' : 'COMPLETED');
  console.log('2. Expected vs Actual chunks:', `${expectedChunks.size} vs ${actualChunks.size}`);
  console.log('3. Missing critical chunks:', 
    (vendorChunks.length > 0 || mainAppChunks.length > 0) ? 'YES' : 'NO');
  
  if (buildProcesses && buildProcesses.length > 0 && missingChunks.length > 0) {
    console.log('');
    console.log('=== DIAGNOSIS ===');
    console.log('PRIMARY CAUSE: Build process is incomplete');
    console.log('The build is still running and chunk files are not fully generated.');
    console.log('This explains why the application shows 404 errors for chunk files.');
    console.log('');
    console.log('RECOMMENDED ACTION:');
    console.log('1. Wait for the build process to complete');
    console.log('2. Stop the development server');
    console.log('3. Clear .next directory');
    console.log('4. Restart with fresh build');
  } else if ((!buildProcesses || buildProcesses.length === 0) && missingChunks.length > 0) {
    console.log('');
    console.log('=== DIAGNOSIS ===');
    console.log('PRIMARY CAUSE: Build corruption or incomplete build');
    console.log('The build completed but critical chunks are missing.');
    console.log('');
    console.log('RECOMMENDED ACTION:');
    console.log('1. Clear .next directory');
    console.log('2. Run fresh build');
    console.log('3. Check webpack configuration');
  }
  
} catch (error) {
  console.log('Error reading build manifests:', error.message);
}

console.log('');
console.log('=== END DIAGNOSTIC REPORT ===');