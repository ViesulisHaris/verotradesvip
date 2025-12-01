#!/usr/bin/env node

/**
 * BUILD MONITOR FOR VEROTRADE
 * Monitors build health and detects issues early
 */

const fs = require('fs');
const path = require('path');

function checkBuildHealth() {
  console.log('🔍 Checking build health...');
  
  // Check for critical build artifacts
  const criticalPaths = [
    '.next/static/chunks',
    '.next/server/pages',
    '.next/server/app'
  ];
  
  let healthScore = 100;
  const issues = [];
  
  criticalPaths.forEach(checkPath => {
    if (!fs.existsSync(checkPath)) {
      healthScore -= 25;
      issues.push(`Missing critical path: ${checkPath}`);
    }
  });
  
  // Check for vendor chunks
  if (fs.existsSync('.next')) {
    const vendorChunks = fs.readdirSync('.next')
      .filter(file => file.includes('vendor'));
    
    if (vendorChunks.length === 0) {
      healthScore -= 30;
      issues.push('No vendor chunks found');
    }
  }
  
  console.log(`📊 Build Health Score: ${healthScore}/100`);
  
  if (issues.length > 0) {
    console.log('⚠️  Issues detected:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    return false;
  }
  
  console.log('✅ Build is healthy');
  return true;
}

if (require.main === module) {
  checkBuildHealth();
}

module.exports = { checkBuildHealth };
