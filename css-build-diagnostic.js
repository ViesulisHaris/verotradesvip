const fs = require('fs');
const path = require('path');

console.log('=== CSS Build Diagnostic ===');

// Check PostCSS config
console.log('\n1. PostCSS Configuration:');
try {
  const postcssConfig = require('./postcss.config.js');
  console.log('PostCSS config loaded:', JSON.stringify(postcssConfig, null, 2));
} catch (error) {
  console.error('Error loading PostCSS config:', error.message);
}

// Check Tailwind config
console.log('\n2. Tailwind Configuration:');
try {
  const tailwindConfig = require('./tailwind.config.js');
  console.log('Tailwind content paths:', tailwindConfig.content);
  console.log('Tailwind plugins:', tailwindConfig.plugins);
} catch (error) {
  console.error('Error loading Tailwind config:', error.message);
}

// Check CSS files existence
console.log('\n3. CSS Files Check:');
const cssFiles = [
  './src/app/globals.css',
  './src/styles/verotrade-design-system.css'
];

cssFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
});

// Check .next static CSS directory
console.log('\n4. .next Static CSS Directory:');
const nextCssDir = './.next/static/css';
if (fs.existsSync(nextCssDir)) {
  const files = fs.readdirSync(nextCssDir, { recursive: true });
  console.log('CSS files in .next:', files.length > 0 ? files : 'NO FILES FOUND');
} else {
  console.log('.next/static/css directory does not exist');
}

// Check package.json versions
console.log('\n5. Package Versions:');
try {
  const packageJson = require('./package.json');
  console.log('Next.js version:', packageJson.dependencies.next);
  console.log('Tailwind CSS version:', packageJson.devDependencies.tailwindcss);
  console.log('PostCSS version:', packageJson.devDependencies.postcss);
} catch (error) {
  console.error('Error reading package.json:', error.message);
}

console.log('\n=== End Diagnostic ===');