const fs = require('fs');
const path = require('path');

console.log('🔍 [DEBUG] CSS Compilation Diagnosis');
console.log('=====================================');

// Check if critical CSS files exist
const criticalFiles = [
  'src/app/globals.css',
  'src/styles/unified-menu.css',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/dashboard/page.tsx'
];

console.log('\n📁 Checking critical source files:');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Check .next directory structure
console.log('\n📦 Checking .next build output:');
const nextFiles = [
  '.next/static/css/app/layout.css',
  '.next/static/chunks/app/layout.js',
  '.next/static/chunks/main-app.js',
  '.next/static/chunks/app-pages-internals.js',
  '.next/static/chunks/app/dashboard/page.js'
];

nextFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Check if layout.css specifically exists (this is the 404 error)
console.log('\n🎯 Checking specific layout.css file:');
const layoutCssPath = '.next/static/css/app/layout.css';
if (fs.existsSync(layoutCssPath)) {
  const stats = fs.statSync(layoutCssPath);
  console.log(`  ✅ ${layoutCssPath} exists (${stats.size} bytes)`);
  
  // Check if file is empty
  if (stats.size === 0) {
    console.log('  ⚠️  File is empty - this could be the issue!');
  }
} else {
  console.log(`  ❌ ${layoutCssPath} is missing - this is the root cause!`);
}

// Check what CSS files do exist
console.log('\n📋 All CSS files in .next/static/css/app/:');
try {
  const cssDir = '.next/static/css/app';
  if (fs.existsSync(cssDir)) {
    const files = fs.readdirSync(cssDir, { recursive: true });
    files.forEach(file => {
      const fullPath = path.join(cssDir, file);
      const stats = fs.statSync(fullPath);
      if (stats.isFile()) {
        console.log(`  📄 ${file} (${stats.size} bytes)`);
      }
    });
  } else {
    console.log('  ❌ CSS directory does not exist');
  }
} catch (error) {
  console.log(`  ❌ Error reading CSS directory: ${error.message}`);
}

console.log('\n🔍 Diagnosis Summary:');
console.log('=====================');
console.log('The main issue appears to be that layout.css is missing from .next/static/css/app/');
console.log('This suggests a CSS compilation problem during the build process.');
console.log('Possible causes:');
console.log('1. CSS import errors in layout.tsx or components');
console.log('2. PostCSS/Tailwind configuration issues');
console.log('3. Missing or corrupted CSS dependencies');
console.log('4. Build process interruption');