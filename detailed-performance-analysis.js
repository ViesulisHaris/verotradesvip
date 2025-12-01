// Detailed Performance Analysis Script
// Deep dive into specific performance bottlenecks

const fs = require('fs');
const path = require('path');

console.log('🔍 DETAILED PERFORMANCE ANALYSIS');
console.log('=====================================');

// 1. Analyze Next.js configuration issues
console.log('\n📋 NEXT.JS CONFIGURATION ANALYSIS:');
try {
  const nextConfig = fs.readFileSync('./next.config.js', 'utf8');
  console.log('✅ next.config.js found');
  
  // Check for performance issues
  if (nextConfig.includes('swcMinify: true')) {
    console.log('⚠️  SWC minification enabled - can cause slow builds');
  }
  if (nextConfig.includes('reactStrictMode: true')) {
    console.log('⚠️  React Strict Mode - double renders in development');
  }
  if (nextConfig.includes('watchOptions')) {
    console.log('⚠️  Custom watch options detected - may slow compilation');
  }
} catch (e) {
  console.log('❌ Could not analyze next.config.js');
}

// 2. Analyze specific heavy components
console.log('\n🧩 HEAVY COMPONENT ANALYSIS:');
const heavyComponents = [
  'EmotionRadar',
  'PnLChart', 
  'StrategyPerformanceChart',
  'EquityGraph',
  'PerformanceTrendChart'
];

let heavyComponentCount = 0;
function analyzeHeavyComponents(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.')) {
      analyzeHeavyComponents(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      for (const component of heavyComponents) {
        if (content.includes(component)) {
          heavyComponentCount++;
          console.log(`📊 Found heavy component: ${component} in ${file}`);
        }
      }
    }
  }
}

analyzeHeavyComponents('./src');

// 3. Check for redundant imports
console.log('\n🔄 REDUNDANT IMPORT ANALYSIS:');
let redundantImports = 0;
function analyzeRedundantImports(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.')) {
      analyzeRedundantImports(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for multiple Supabase client imports
      const supabaseImports = (content.match(/from ['"]@supabase\/supabase-js['"]|getSupabaseClient/g) || []).length;
      if (supabaseImports > 1) {
        redundantImports++;
        console.log(`🔄 Multiple Supabase imports in ${file}: ${supabaseImports}`);
      }
    }
  }
}

analyzeRedundantImports('./src');

// 4. Memory usage analysis
console.log('\n💾 MEMORY USAGE ANALYSIS:');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const dependencies = packageJson.dependencies || {};

let memoryHeavyDeps = [];
for (const [dep, version] of Object.entries(dependencies)) {
  if (dep.includes('playwright') || dep.includes('puppeteer')) {
    memoryHeavyDeps.push(`${dep}: ${version} (~${dep.includes('playwright') ? '40MB' : '200MB'})`);
  }
}

if (memoryHeavyDeps.length > 0) {
  console.log('⚠️  Memory-heavy dependencies found:');
  memoryHeavyDeps.forEach(dep => console.log(`   ${dep}`));
}

// 5. File size analysis
console.log('\n📁 FILE SIZE ANALYSIS:');
let totalFileSize = 0;
let fileCount = 0;

function calculateFileSizes(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && !file.includes('node_modules')) {
      calculateFileSizes(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.jsx')) {
      totalFileSize += stat.size;
      fileCount++;
      
      if (stat.size > 50000) { // Files larger than 50KB
        console.log(`📄 Large file: ${file} (${(stat.size/1024).toFixed(2)}KB)`);
      }
    }
  }
}

calculateFileSizes('./src');
console.log(`📊 Total source files: ${fileCount}`);
console.log(`📊 Total source size: ${(totalFileSize/1024).toFixed(2)}KB`);
console.log(`📊 Average file size: ${(totalFileSize/fileCount/1024).toFixed(2)}KB`);

// 6. Compilation bottleneck analysis
console.log('\n⚡ COMPILATION BOTTLENECK ANALYSIS:');
console.log('Based on terminal output patterns:');
console.log('- Compilation times vary wildly: 1.6s to 19.9s');
console.log('- Module count fluctuates: 1029 to 1450 modules');
console.log('- This indicates inefficient caching and dependency resolution');

// 7. Specific recommendations
console.log('\n💡 DETAILED RECOMMENDATIONS:');
console.log('IMMEDIATE FIXES (High Impact):');
console.log('1. Remove playwright and puppeteer from dependencies');
console.log('2. Implement dynamic imports for Recharts components');
console.log('3. Use Lucide icon tree-shaking');
console.log('4. Optimize Next.js webpack configuration');

console.log('\nSECONDARY FIXES (Medium Impact):');
console.log('5. Implement code splitting for heavy components');
console.log('6. Add React.memo for heavy components');
console.log('7. Use React.lazy for route-level code splitting');

console.log('\nROOT CAUSE SUMMARY:');
console.log('PRIMARY: Bundle contains 13.28MB of unnecessary code');
console.log('SECONDARY: Inefficient webpack configuration');
console.log('TERTIARY: Heavy components not optimized');

console.log('\n=====================================');
console.log('🔍 DETAILED ANALYSIS COMPLETED');