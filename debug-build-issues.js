const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSING NEXT.JS BUILD ISSUES...\n');

// 1. Check if layout.css exists where expected
const expectedLayoutCss = path.join('.next/static/css/app/layout.css');
const layoutCssExists = fs.existsSync(expectedLayoutCss);
console.log(`1. Layout CSS Check:`);
console.log(`   Expected: ${expectedLayoutCss}`);
console.log(`   Exists: ${layoutCssExists ? '✅ YES' : '❌ NO'}`);

// 2. Check what CSS files actually exist
const cssDir = path.join('.next/static/css/app');
if (fs.existsSync(cssDir)) {
  const cssFiles = fs.readdirSync(cssDir, { recursive: true });
  console.log(`\n2. Actual CSS Files Found:`);
  cssFiles.forEach(file => console.log(`   - ${file}`));
} else {
  console.log(`\n2. CSS Directory: ${cssDir} - ❌ NOT FOUND`);
}

// 3. Check for missing JavaScript chunks
const expectedJsFiles = [
  '.next/static/chunks/main-app.js',
  '.next/static/chunks/app-pages-internals.js'
];

console.log(`\n3. JavaScript Chunks Check:`);
expectedJsFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${file}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
});

// 4. Check Supabase import path in layout.tsx
const layoutPath = path.join('src/app/layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  const supabaseImport = layoutContent.match(/import.*supabase.*from.*/);
  console.log(`\n4. Supabase Import in layout.tsx:`);
  console.log(`   ${supabaseImport ? supabaseImport[0] : '❌ NO SUPABASE IMPORT FOUND'}`);
}

// 5. Check which Supabase client files exist
const supabaseClientPaths = [
  'src/supabase/client.ts',
  'supabase/client.ts',
  'src/lib/supabase.ts'
];

console.log(`\n5. Supabase Client Files:`);
supabaseClientPaths.forEach(filePath => {
  const exists = fs.existsSync(filePath);
  console.log(`   ${filePath}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
});

// 6. Check if .next build is corrupted
const nextBuildManifest = path.join('.next/app-build-manifest.json');
if (fs.existsSync(nextBuildManifest)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(nextBuildManifest, 'utf8'));
    console.log(`\n6. Build Manifest Status: ✅ READABLE`);
    console.log(`   Pages in manifest: ${Object.keys(manifest.pages || {}).length}`);
  } catch (error) {
    console.log(`\n6. Build Manifest Status: ❌ CORRUPTED (${error.message})`);
  }
} else {
  console.log(`\n6. Build Manifest: ❌ MISSING`);
}

// 7. Check environment variables
console.log(`\n7. Environment Variables:`);
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log(`   .env.local exists: ✅`);
  console.log(`   Has SUPABASE_URL: ${hasUrl ? '✅' : '❌'}`);
  console.log(`   Has SUPABASE_ANON_KEY: ${hasKey ? '✅' : '❌'}`);
} else {
  console.log(`   .env.local: ❌ MISSING`);
}

console.log(`\n=== DIAGNOSIS COMPLETE ===`);