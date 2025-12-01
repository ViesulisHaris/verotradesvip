// CSS Compilation Diagnostic Script
// This script will help diagnose the Tailwind CSS PostCSS issue

const fs = require('fs');
const path = require('path');

console.log('=== CSS Compilation Diagnostic ===\n');

// 1. Check Tailwind CSS version and configuration
console.log('1. Checking Tailwind CSS configuration...');
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  console.log('Tailwind CSS version:', packageJson.devDependencies.tailwindcss);
  console.log('@tailwindcss/postcss version:', packageJson.devDependencies['@tailwindcss/postcss']);
  console.log('PostCSS version:', packageJson.devDependencies.postcss);
} catch (error) {
  console.error('Error reading package.json:', error.message);
}

// 2. Check PostCSS configuration
console.log('\n2. Checking PostCSS configuration...');
try {
  const postcssConfig = require('./postcss.config.js');
  console.log('PostCSS plugins:', postcssConfig.plugins.map(p => typeof p === 'string' ? p : p.name || 'unknown'));
} catch (error) {
  console.error('Error reading postcss.config.js:', error.message);
}

// 3. Check Tailwind configuration
console.log('\n3. Checking Tailwind configuration...');
try {
  const tailwindConfig = require('./tailwind.config.js');
  console.log('Tailwind content paths:', tailwindConfig.content);
  console.log('Tailwind darkMode:', tailwindConfig.darkMode);
} catch (error) {
  console.error('Error reading tailwind.config.js:', error.message);
}

// 4. Check CSS files
console.log('\n4. Checking CSS files...');
try {
  const globalsCss = fs.readFileSync('./src/app/globals.css', 'utf8');
  console.log('globals.css contains @tailwind directives:', globalsCss.includes('@tailwind'));
  console.log('globals.css imports verotrade-design-system:', globalsCss.includes('verotrade-design-system'));
  
  // Check if the imported file exists
  const designSystemPath = './src/styles/verotrade-design-system.css';
  if (fs.existsSync(designSystemPath)) {
    console.log('verotrade-design-system.css exists: YES');
  } else {
    console.log('verotrade-design-system.css exists: NO');
    console.log('Expected path:', path.resolve(designSystemPath));
  }
} catch (error) {
  console.error('Error reading CSS files:', error.message);
}

// 5. Check for version conflicts
console.log('\n5. Checking for version conflicts...');
try {
  const { execSync } = require('child_process');
  const npmList = execSync('npm list postcss', { encoding: 'utf8' });
  console.log('PostCSS versions installed:');
  console.log(npmList);
} catch (error) {
  console.error('Error checking PostCSS versions:', error.message);
}

console.log('\n=== Diagnostic Complete ===');