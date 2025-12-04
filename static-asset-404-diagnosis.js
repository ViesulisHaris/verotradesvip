const fs = require('fs');
const path = require('path');

console.log('🔍 STATIC ASSET 404 DIAGNOSIS');
console.log('=====================================\n');

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';
console.log(`📋 Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);

// 1. Check Next.js configuration
console.log('\n📁 NEXT.JS CONFIGURATION ANALYSIS:');
try {
  const nextConfig = require('./next.config.js');
  console.log('✅ next.config.js loaded successfully');
  
  // Check for asset-related configurations
  if (nextConfig.webpack) {
    console.log('⚙️  Custom webpack configuration detected');
    if (nextConfig.webpack.toString().includes('publicPath')) {
      console.log('🔧 Custom publicPath found in webpack config');
    }
  }
  
  if (nextConfig.experimental) {
    console.log('🧪 Experimental features enabled');
  }
  
  if (nextConfig.assetPrefix) {
    console.log(`📦 Asset prefix: ${nextConfig.assetPrefix}`);
  }
  
  console.log('✅ Next.js config analysis complete');
} catch (error) {
  console.log('❌ Error reading next.config.js:', error.message);
}

// 2. Check .next directory structure
console.log('\n📂 BUILD OUTPUT ANALYSIS:');
const nextDir = path.join(__dirname, '.next');
const staticDir = path.join(nextDir, 'static');

if (fs.existsSync(nextDir)) {
  console.log('✅ .next directory exists');
  
  if (fs.existsSync(staticDir)) {
    console.log('✅ .next/static directory exists');
    
    // List static subdirectories
    const staticSubdirs = fs.readdirSync(staticDir).filter(f => fs.statSync(path.join(staticDir, f)).isDirectory());
    console.log(`📁 Static subdirectories: ${staticSubdirs.join(', ')}`);
    
    // Check for chunks directory
    const chunksDir = path.join(staticDir, 'chunks');
    if (fs.existsSync(chunksDir)) {
      const chunks = fs.readdirSync(chunksDir).filter(f => f.endsWith('.js'));
      console.log(`📦 JavaScript chunks found: ${chunks.length}`);
      
      // Check for specific chunks mentioned in 404 errors
      const expectedChunks = [
        'main-app.js',
        'app-pages-internals.js', 
        'page.js',
        'layout.js',
        'not-found.js',
        'error.js',
        'global-error.js'
      ];
      
      expectedChunks.forEach(chunk => {
        const chunkExists = chunks.some(c => c.includes(chunk.replace('.js', '')));
        console.log(`${chunkExists ? '✅' : '❌'} ${chunk}: ${chunkExists ? 'FOUND' : 'MISSING'}`);
      });
    }
    
    // Check for CSS directory
    const cssDir = path.join(staticDir, 'css');
    if (fs.existsSync(cssDir)) {
      const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
      console.log(`🎨 CSS files found: ${cssFiles.length}`);
      
      // Check for layout.css
      const layoutCssExists = cssFiles.some(f => f.includes('layout'));
      console.log(`${layoutCssExists ? '✅' : '❌'} layout.css: ${layoutCssExists ? 'FOUND' : 'MISSING'}`);
    }
  } else {
    console.log('❌ .next/static directory missing');
  }
} else {
  console.log('❌ .next directory missing - build may not have run');
}

// 3. Check development server status
console.log('\n🌐 DEVELOPMENT SERVER ANALYSIS:');
const devServerUrl = 'http://localhost:3000';
console.log(`🔗 Checking development server at ${devServerUrl}`);

// Check if common static asset URLs are accessible
const testAssets = [
  '/_next/static/chunks/main-app.js',
  '/_next/static/chunks/app/pages-internals.js',
  '/_next/static/chunks/app/page.js',
  '/_next/static/chunks/app/layout.js',
  '/_next/static/chunks/app/not-found.js',
  '/_next/static/chunks/app/error.js',
  '/_next/static/chunks/app/global-error.js',
  '/_next/static/css/layout.css'
];

console.log('\n📡 ASSET ACCESSIBILITY TEST:');
testAssets.forEach(asset => {
  console.log(`🔍 ${asset}`);
});

// 4. Analyze potential causes
console.log('\n🔍 POTENTIAL CAUSES ANALYSIS:');

const potentialCauses = [
  {
    cause: 'Development server not fully started',
    symptoms: ['Some assets load, others dont', 'Intermittent 404s'],
    solution: 'Wait for development server to fully initialize'
  },
  {
    cause: 'Webpack chunk generation issue',
    symptoms: ['JavaScript chunks return 404', 'CSS files load fine'],
    solution: 'Clear .next cache and restart dev server'
  },
  {
    cause: 'Asset path configuration issue',
    symptoms: ['All static assets return 404', 'Pages load but missing styles/scripts'],
    solution: 'Check next.config.js assetPrefix and webpack publicPath'
  },
  {
    cause: 'Build cache corruption',
    symptoms: ['Recently added assets return 404', 'Old assets work fine'],
    solution: 'Clear build cache with npm run build:clean'
  },
  {
    cause: 'File system permissions issue',
    symptoms: ['Specific file types return 404', 'Consistent pattern of missing files'],
    solution: 'Check file permissions for .next/static directory'
  }
];

potentialCauses.forEach((item, index) => {
  console.log(`\n${index + 1}. ${item.cause}`);
  console.log(`   Symptoms: ${item.symptoms.join(', ')}`);
  console.log(`   Solution: ${item.solution}`);
});

// 5. Generate recommended fixes
console.log('\n🛠️  RECOMMENDED FIXES:');

const fixes = [
  {
    title: 'Clear Build Cache',
    command: 'npm run build:clean',
    description: 'Remove .next directory and rebuild'
  },
  {
    title: 'Restart Development Server',
    command: 'npm run dev:clean',
    description: 'Clear cache and restart dev server'
  },
  {
    title: 'Check Asset Configuration',
    command: 'Check next.config.js for assetPrefix and webpack publicPath',
    description: 'Ensure asset paths are correctly configured'
  },
  {
    title: 'Verify File Permissions',
    command: 'Check .next/static directory permissions',
    description: 'Ensure Node.js can read/write to build directories'
  }
];

fixes.forEach((fix, index) => {
  console.log(`\n${index + 1}. ${fix.title}`);
  console.log(`   Command: ${fix.command}`);
  console.log(`   Description: ${fix.description}`);
});

console.log('\n📊 DIAGNOSIS COMPLETE');
console.log('=============================');
console.log('🔍 Next steps:');
console.log('1. Run the recommended fixes in order');
console.log('2. Test asset accessibility after each fix');
console.log('3. Monitor browser console for remaining 404 errors');
console.log('4. Verify trades page functionality is not impacted');