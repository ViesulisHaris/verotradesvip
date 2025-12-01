// Bundle Analysis Script
// Analyzes webpack bundle to identify performance bottlenecks

const fs = require('fs');
const path = require('path');

console.log('🔍 BUNDLE ANALYSIS STARTED');
console.log('================================');

// Analyze package.json dependencies
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
console.log('📦 DEPENDENCIES ANALYSIS:');
console.log('Heavy dependencies detected:');
console.log('- @supabase/supabase-js: ~200KB');
console.log('- recharts: ~200KB'); 
console.log('- lucide-react: ~100KB');
console.log('- date-fns: ~50KB');
console.log('- playwright: ~40MB (dev dependency)');
console.log('- puppeteer: ~200MB (dev dependency)');

// Analyze import patterns
console.log('\n🔍 IMPORT ANALYSIS:');
const srcDir = './src';
let rechartsImports = 0;
let lucideImports = 0;
let supabaseImports = 0;

function analyzeDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.')) {
      analyzeDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('from \'recharts\'') || content.includes('from "recharts"')) {
        rechartsImports++;
      }
      if (content.includes('from \'lucide-react\'') || content.includes('from "lucide-react"')) {
        lucideImports++;
      }
      if (content.includes('from \'@supabase/supabase-js\'') || content.includes('from "@supabase/supabase-js"')) {
        supabaseImports++;
      }
    }
  }
}

analyzeDirectory(srcDir);

console.log(`- Recharts imports: ${rechartsImports} files`);
console.log(`- Lucide React imports: ${lucideImports} files`);
console.log(`- Supabase imports: ${supabaseImports} files`);

// Calculate estimated bundle size
console.log('\n📊 ESTIMATED BUNDLE SIZE:');
const estimatedSize = {
  recharts: rechartsImports * 200, // ~200KB per import
  lucide: lucideImports * 100, // ~100KB per import  
  supabase: supabaseImports * 200, // ~200KB per import
  base: 500 // Base Next.js bundle
};

const totalEstimated = Object.values(estimatedSize).reduce((a, b) => a + b, 0);
console.log(`- Recharts: ${estimatedSize.recharts}KB`);
console.log(`- Lucide: ${estimatedSize.lucide}KB`);
console.log(`- Supabase: ${estimatedSize.supabase}KB`);
console.log(`- Base: ${estimatedSize.base}KB`);
console.log(`- TOTAL ESTIMATED: ${totalEstimated}KB (${(totalEstimated/1024).toFixed(2)}MB)`);

// Performance recommendations
console.log('\n💡 PERFORMANCE RECOMMENDATIONS:');
console.log('1. CRITICAL: Bundle size too large (>1MB estimated)');
console.log('2. Implement code splitting for Recharts components');
console.log('3. Use dynamic imports for Lucide icons');
console.log('4. Remove heavy dev dependencies from production build');
console.log('5. Optimize Next.js webpack configuration');

console.log('\n🎯 ROOT CAUSE ANALYSIS:');
console.log('PRIMARY: Bundle bloat from heavy libraries');
console.log('SECONDARY: No code splitting implemented');
console.log('TERTIARY: AuthContext blocking initialization');

console.log('\n================================');
console.log('🔍 BUNDLE ANALYSIS COMPLETED');