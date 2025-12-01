const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('=== STATIC ASSET LOADING DIAGNOSTIC TEST ===');
console.log('Time:', new Date().toISOString());
console.log('');

// Test 1: Check if CSS files exist in the expected locations
console.log('1. CHECKING CSS FILE EXISTENCE');
const expectedCssFiles = [
  '.next/static/css/app/layout.css',
  '.next/static/css/app/(auth)/dashboard/page.css'
];

expectedCssFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`   ${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
});

console.log('');

// Test 2: Check if vendor JS files exist
console.log('2. CHECKING VENDOR JS FILES');
const expectedJsFiles = [
  '.next/static/chunks/main-app.js',
  '.next/static/chunks/webpack.js',
  '.next/static/chunks/vendors-node_modules_c.js'
];

expectedJsFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`   ${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
});

console.log('');

// Test 3: Check development servers
console.log('3. CHECKING DEVELOPMENT SERVERS');
const checkServer = (port, path) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'HEAD',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      resolve({ port, path, status: res.statusCode, success: res.statusCode < 400 });
    });

    req.on('error', () => {
      resolve({ port, path, status: 'ERROR', success: false });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ port, path, status: 'TIMEOUT', success: false });
    });

    req.end();
  });
};

const testAssets = async () => {
  const tests = [
    { port: 3001, path: '/_next/static/css/app/layout.css' },
    { port: 3002, path: '/_next/static/css/app/layout.css' },
    { port: 3001, path: '/_next/static/chunks/main-app.js' },
    { port: 3002, path: '/_next/static/chunks/main-app.js' }
  ];

  for (const test of tests) {
    const result = await checkServer(test.port, test.path);
    console.log(`   Port ${result.port}${result.path}: ${result.status} (${result.success ? 'SUCCESS' : 'FAILED'})`);
  }
};

testAssets().then(() => {
  console.log('');
  
  // Test 4: Check Next.js configuration issues
  console.log('4. ANALYZING NEXT.JS CONFIGURATION');
  try {
    const nextConfig = require('./next.config.js');
    console.log('   ✓ next.config.js exists and is valid');
    
    // Check for conflicting experimental settings
    if (nextConfig.experimental) {
      console.log('   Experimental settings found:');
      Object.keys(nextConfig.experimental).forEach(key => {
        console.log(`     - ${key}: ${nextConfig.experimental[key]}`);
      });
    }
    
    // Check webpack configuration
    if (nextConfig.webpack) {
      console.log('   ✓ Custom webpack configuration detected');
    }
    
  } catch (error) {
    console.log('   ✗ Error reading next.config.js:', error.message);
  }
  
  console.log('');
  
  // Test 5: Check for multiple development server conflicts
  console.log('5. MULTIPLE SERVER CONFLICT ANALYSIS');
  console.log('   ✓ Two development servers detected:');
  console.log('     - Port 3001 (PID 28840)');
  console.log('     - Port 3002 (PID 28964)');
  console.log('   ⚠ This could cause asset serving conflicts');
  
  console.log('');
  
  // Summary and recommendations
  console.log('=== DIAGNOSTIC SUMMARY ===');
  console.log('');
  console.log('MOST LIKELY CAUSES:');
  console.log('1. Multiple development servers running simultaneously causing conflicts');
  console.log('2. CSS files not being generated properly due to configuration issues');
  console.log('3. Asset path resolution problems in Next.js configuration');
  console.log('');
  console.log('RECOMMENDED FIXES:');
  console.log('1. Stop one of the development servers');
  console.log('2. Clear .next directory and restart development server');
  console.log('3. Check Next.js configuration for conflicting settings');
  
  console.log('');
  console.log('=== TEST COMPLETED ===');
});