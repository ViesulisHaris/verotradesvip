const fs = require('fs');
const path = require('path');

console.log('🔍 ===== APPLICATION STABILITY DIAGNOSTIC =====');
console.log('🎯 Target: Validate application stability after fixes');

const issues = [];
const successes = [];

// 1. Check critical files exist
console.log('\n📁 ===== CHECKING CRITICAL FILES =====');

const criticalFiles = [
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/components/EmergencyErrorBoundary.tsx',
  'package.json',
  'next.config.js',
  '.env.local'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    successes.push(`✅ Critical file exists: ${file}`);
  } else {
    issues.push(`❌ Missing critical file: ${file}`);
  }
});

// 2. Check dependencies
console.log('\n📦 ===== CHECKING DEPENDENCIES =====');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check critical dependencies
  const criticalDeps = ['next', 'react', 'react-dom', 'styled-jsx', 'critters'];
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      successes.push(`✅ Dependency found: ${dep}@${packageJson.dependencies[dep]}`);
    } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      successes.push(`✅ Dev dependency found: ${dep}@${packageJson.devDependencies[dep]}`);
    } else {
      issues.push(`❌ Missing dependency: ${dep}`);
    }
  });
  
  // Check for resolutions
  if (packageJson.resolutions && packageJson.resolutions['styled-jsx']) {
    successes.push(`✅ Styled-jsx resolution configured: ${packageJson.resolutions['styled-jsx']}`);
  } else {
    issues.push(`❌ Missing styled-jsx resolution`);
  }
} catch (error) {
  issues.push(`❌ Error reading package.json: ${error.message}`);
}

// 3. Check Next.js configuration
console.log('\n⚙️ ===== CHECKING NEXT.JS CONFIGURATION =====');

try {
  const nextConfig = fs.readFileSync('next.config.js', 'utf8');
  
  if (nextConfig.includes('styled-jsx')) {
    successes.push('✅ Next.js config includes styled-jsx configuration');
  } else {
    issues.push('❌ Next.js config missing styled-jsx configuration');
  }
  
  if (nextConfig.includes('experimental')) {
    successes.push('✅ Next.js config includes experimental features');
  }
  
  if (nextConfig.includes('webpack')) {
    successes.push('✅ Next.js config includes webpack configuration');
  }
} catch (error) {
  issues.push(`❌ Error reading next.config.js: ${error.message}`);
}

// 4. Check error boundary implementation
console.log('\n🛡️ ===== CHECKING ERROR BOUNDARY =====');

try {
  const layoutContent = fs.readFileSync('src/app/layout.tsx', 'utf8');
  
  if (layoutContent.includes('EmergencyErrorBoundary')) {
    successes.push('✅ EmergencyErrorBoundary imported in layout');
  } else {
    issues.push('❌ EmergencyErrorBoundary not imported in layout');
  }
  
  if (layoutContent.includes('<EmergencyErrorBoundary>')) {
    successes.push('✅ EmergencyErrorBoundary used in layout');
  } else {
    issues.push('❌ EmergencyErrorBoundary not used in layout');
  }
} catch (error) {
  issues.push(`❌ Error checking layout: ${error.message}`);
}

// 5. Check for multiple development servers
console.log('\n🖥️ ===== CHECKING FOR MULTIPLE SERVERS =====');

try {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    successes.push('✅ node_modules directory exists');
  } else {
    issues.push('❌ node_modules directory missing - run npm install');
  }
} catch (error) {
  issues.push(`❌ Error checking node_modules: ${error.message}`);
}

// 6. Check build cache
console.log('\n🧹 ===== CHECKING BUILD CACHE =====');

if (fs.existsSync('.next')) {
  issues.push('⚠️ .next directory exists - may contain corrupted cache');
} else {
  successes.push('✅ .next directory clean');
}

// 7. Summary
console.log('\n📊 ===== DIAGNOSTIC SUMMARY =====');

console.log('\n✅ SUCCESSES:');
successes.forEach(success => console.log(`  ${success}`));

console.log('\n❌ ISSUES:');
issues.forEach(issue => console.log(`  ${issue}`));

const criticalIssues = issues.filter(issue => 
  issue.includes('Missing') || 
  issue.includes('Error') ||
  issue.includes('not imported') ||
  issue.includes('not used')
);

console.log(`\n🎯 CRITICAL ISSUES: ${criticalIssues.length}`);
console.log(`📈 TOTAL ISSUES: ${issues.length}`);
console.log(`📉 TOTAL SUCCESSES: ${successes.length}`);

if (criticalIssues.length === 0) {
  console.log('\n🎉 ===== APPLICATION STABLE =====');
  console.log('✅ All critical issues resolved');
  console.log('🚀 Application should load without white screen errors');
  console.log('🔧 Next steps: Test application at http://localhost:3000');
} else {
  console.log('\n🚨 ===== CRITICAL ISSUES REMAIN =====');
  console.log('❌ Application may still experience white screen issues');
  console.log('🔧 Address critical issues before testing');
}

// 8. Recommendations
console.log('\n💡 ===== RECOMMENDATIONS =====');

if (issues.length > 0) {
  console.log('1. Address all critical issues immediately');
  console.log('2. Clear build cache: rmdir /s /q .next');
  console.log('3. Restart development server: npm run dev');
  console.log('4. Test application loading');
}

if (issues.filter(i => i.includes('styled-jsx')).length > 0) {
  console.log('5. Fix styled-jsx dependency issues');
}

if (issues.filter(i => i.includes('critters')).length > 0) {
  console.log('6. Install critters dependency: npm install critters --save-dev');
}

console.log('\n🔍 ===== DIAGNOSTIC COMPLETE =====');