#!/usr/bin/env node

/**
 * VEROTRADE RECOVERY SCRIPT
 * Run this script if white screen issues persist
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔄 Starting Verotrade recovery...');

// Step 1: Clean everything
console.log('🧹 Cleaning build artifacts...');
try {
  if (fs.existsSync('.next')) {
    execSync('rmdir /s /q .next', { stdio: 'inherit' });
  }
  if (fs.existsSync('node_modules/.cache')) {
    execSync('rmdir /s /q node_modules/.cache', { stdio: 'inherit' });
  }
} catch (error) {
  console.log('⚠️  Cleanup error:', error.message);
}

// Step 2: Reinstall dependencies
console.log('📦 Reinstalling dependencies...');
try {
  execSync('npm install --force', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  Install error:', error.message);
}

// Step 3: Start development server
console.log('🚀 Starting development server...');
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  Dev server error:', error.message);
}

console.log('✅ Recovery completed');
