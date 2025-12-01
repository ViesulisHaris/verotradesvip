const fs = require('fs');
const path = require('path');

// Performance Analysis Script for Next.js Webpack Optimization
// Analyzes module count reduction and vendor chunk optimization

console.log('🔍 Next.js Webpack Performance Analysis');
console.log('=====================================\n');

// 1. Analyze current build files
function analyzeBuildFiles() {
  console.log('📁 Current Build Files Analysis:');
  
  const chunksDir = '.next/static/chunks';
  const appChunksDir = '.next/static/chunks/app';
  
  if (fs.existsSync(chunksDir)) {
    const files = fs.readdirSync(chunksDir);
    let totalSize = 0;
    
    console.log('\nMain chunks directory:');
    files.forEach(file => {
      const filePath = path.join(chunksDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalSize += stats.size;
      console.log(`  ${file}: ${sizeKB} KB`);
    });
    
    console.log(`\nTotal main chunks size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  }
  
  if (fs.existsSync(appChunksDir)) {
    const files = fs.readdirSync(appChunksDir);
    let totalSize = 0;
    
    console.log('\nApp chunks directory:');
    files.forEach(file => {
      const filePath = path.join(appChunksDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalSize += stats.size;
      console.log(`  ${file}: ${sizeKB} KB`);
    });
    
    console.log(`\nTotal app chunks size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  }
}

// 2. Check for vendor chunks
function checkVendorChunks() {
  console.log('\n🎯 Vendor Chunk Analysis:');
  
  const chunksDir = '.next/static/chunks';
  const vendorPatterns = ['vendor', 'framework', 'supabase', 'recharts', 'lucide', 'lib'];
  
  if (fs.existsSync(chunksDir)) {
    const files = fs.readdirSync(chunksDir);
    const vendorChunks = files.filter(file => 
      vendorPatterns.some(pattern => file.toLowerCase().includes(pattern))
    );
    
    if (vendorChunks.length > 0) {
      console.log('✅ Vendor chunks found:');
      vendorChunks.forEach(chunk => {
        const filePath = path.join(chunksDir, chunk);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`  ${chunk}: ${sizeKB} KB`);
      });
    } else {
      console.log('❌ No vendor chunks found');
      console.log('⚠️  This indicates that splitChunks optimization is not active');
    }
  }
}

// 3. Analyze build manifests
function analyzeBuildManifests() {
  console.log('\n📋 Build Manifest Analysis:');
  
  try {
    const buildManifest = JSON.parse(fs.readFileSync('.next/build-manifest.json', 'utf8'));
    const appBuildManifest = JSON.parse(fs.readFileSync('.next/app-build-manifest.json', 'utf8'));
    
    console.log('\nBuild Manifest Structure:');
    console.log(`  Polyfill files: ${buildManifest.polyfillFiles.length}`);
    console.log(`  Root main files: ${buildManifest.rootMainFiles.length}`);
    console.log(`  Low priority files: ${buildManifest.lowPriorityFiles.length}`);
    
    console.log('\nApp Build Manifest Pages:');
    Object.keys(appBuildManifest.pages).forEach(page => {
      const chunks = appBuildManifest.pages[page];
      console.log(`  ${page}: ${chunks.length} chunks`);
    });
    
    // Count total unique chunks referenced
    const allChunks = new Set();
    Object.values(appBuildManifest.pages).forEach(chunks => {
      chunks.forEach(chunk => allChunks.add(chunk));
    });
    
    console.log(`\nTotal unique chunks referenced: ${allChunks.size}`);
    
    return { buildManifest, appBuildManifest, totalChunks: allChunks.size };
  } catch (error) {
    console.log('❌ Error reading build manifests:', error.message);
    return null;
  }
}

// 4. Analyze webpack configuration
function analyzeWebpackConfig() {
  console.log('\n⚙️  Webpack Configuration Analysis:');
  
  try {
    const nextConfig = require('./next.config.js');
    
    // Check if splitChunks is deleted
    if (nextConfig.webpack) {
      const mockConfig = { optimization: { splitChunks: {} } };
      const result = nextConfig.webpack(mockConfig, { isServer: false });
      
      if (result.optimization && result.optimization.splitChunks === undefined) {
        console.log('❌ splitChunks configuration has been removed');
        console.log('⚠️  This means vendor chunk optimization is NOT active');
      } else if (result.optimization && result.optimization.splitChunks) {
        console.log('✅ splitChunks configuration is present');
      }
    }
    
    // Check experimental optimizations
    if (nextConfig.experimental && nextConfig.experimental.optimizePackageImports) {
      console.log(`✅ Package optimization enabled for: ${nextConfig.experimental.optimizePackageImports.join(', ')}`);
    }
    
  } catch (error) {
    console.log('❌ Error analyzing webpack config:', error.message);
  }
}

// 5. Calculate bundle sizes
function calculateBundleSizes() {
  console.log('\n📊 Bundle Size Analysis:');
  
  const totalSize = { main: 0, app: 0 };
  
  // Calculate main chunks size
  const chunksDir = '.next/static/chunks';
  if (fs.existsSync(chunksDir)) {
    const files = fs.readdirSync(chunksDir);
    files.forEach(file => {
      const filePath = path.join(chunksDir, file);
      if (fs.statSync(filePath).isFile()) {
        totalSize.main += fs.statSync(filePath).size;
      }
    });
  }
  
  // Calculate app chunks size
  const appChunksDir = '.next/static/chunks/app';
  if (fs.existsSync(appChunksDir)) {
    const files = fs.readdirSync(appChunksDir);
    files.forEach(file => {
      const filePath = path.join(appChunksDir, file);
      if (fs.statSync(filePath).isFile()) {
        totalSize.app += fs.statSync(filePath).size;
      }
    });
  }
  
  console.log(`Main chunks: ${(totalSize.main / 1024 / 1024).toFixed(2)} MB`);
  console.log(`App chunks: ${(totalSize.app / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total bundle: ${((totalSize.main + totalSize.app) / 1024 / 1024).toFixed(2)} MB`);
  
  return totalSize;
}

// 6. Main analysis function
function runAnalysis() {
  console.log('Starting comprehensive webpack performance analysis...\n');
  
  analyzeBuildFiles();
  checkVendorChunks();
  const manifestData = analyzeBuildManifests();
  analyzeWebpackConfig();
  const bundleSizes = calculateBundleSizes();
  
  console.log('\n🎯 Summary & Recommendations:');
  console.log('================================');
  
  if (manifestData) {
    console.log(`Total chunks referenced: ${manifestData.totalChunks}`);
  }
  
  console.log(`Total bundle size: ${((bundleSizes.main + bundleSizes.app) / 1024 / 1024).toFixed(2)} MB`);
  
  // Check if vendor optimization is missing
  const hasVendorChunks = fs.existsSync('.next/static/chunks') && 
    fs.readdirSync('.next/static/chunks').some(file => 
      ['vendor', 'framework', 'supabase', 'recharts', 'lucide'].some(pattern => 
        file.toLowerCase().includes(pattern)
      )
    );
  
  if (!hasVendorChunks) {
    console.log('\n⚠️  CRITICAL FINDING:');
    console.log('❌ Vendor chunk optimization is NOT active');
    console.log('❌ splitChunks configuration has been removed from next.config.js');
    console.log('❌ No vendor chunks (framework, supabase, recharts, lucide-react) found');
    
    console.log('\n📝 RECOMMENDATIONS:');
    console.log('1. Implement proper splitChunks configuration for vendor optimization');
    console.log('2. Create separate chunks for framework, supabase, recharts, lucide-react');
    console.log('3. Enable deterministic module IDs for better caching');
    console.log('4. Configure proper cache groups for vendor libraries');
  } else {
    console.log('✅ Vendor chunk optimization appears to be active');
  }
  
  console.log('\n🏁 Analysis completed!');
}

// Run the analysis
runAnalysis();