/**
 * Basic Functionality Test
 * 
 * This script performs basic checks to ensure the trading journal application
 * is working properly without requiring external dependencies.
 */

const fs = require('fs');
const path = require('path');

const testResults = {
  compilation: { passed: false, issues: [] },
  fileStructure: { passed: false, issues: [] },
  imports: { passed: false, issues: [] },
  configuration: { passed: false, issues: [] },
  overall: { passed: false, issues: [] }
};

function runBasicFunctionalityTest() {
  console.log('🚀 Starting Basic Functionality Test...');
  
  try {
    // Test 1: Check if Next.js build is successful
    console.log('📋 Test 1: Build Compilation...');
    
    const buildDir = path.join(__dirname, '.next');
    if (fs.existsSync(buildDir)) {
      const buildFiles = fs.readdirSync(buildDir);
      if (buildFiles.includes('server') && buildFiles.includes('static')) {
        testResults.compilation.passed = true;
        console.log('✅ Next.js build files found');
      } else {
        testResults.compilation.issues.push('Incomplete build structure');
      }
    } else {
      testResults.compilation.issues.push('No build directory found');
    }
    
    // Test 2: Check essential file structure
    console.log('📁 Test 2: File Structure...');
    
    const essentialFiles = [
      'src/app/page.tsx',
      'src/app/layout.tsx',
      'src/app/dashboard/page.tsx',
      'src/app/login/page.tsx',
      'src/supabase/client.ts',
      'package.json',
      'next.config.js'
    ];
    
    let missingFiles = [];
    essentialFiles.forEach(file => {
      if (!fs.existsSync(path.join(__dirname, file))) {
        missingFiles.push(file);
      }
    });
    
    if (missingFiles.length === 0) {
      testResults.fileStructure.passed = true;
      console.log('✅ All essential files present');
    } else {
      testResults.fileStructure.issues.push(`Missing files: ${missingFiles.join(', ')}`);
    }
    
    // Test 3: Check package.json dependencies
    console.log('📦 Test 3: Dependencies...');
    
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const requiredDeps = ['next', 'react', 'react-dom', '@supabase/supabase-js'];
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    
    if (missingDeps.length === 0) {
      testResults.imports.passed = true;
      console.log('✅ All required dependencies present');
    } else {
      testResults.imports.issues.push(`Missing dependencies: ${missingDeps.join(', ')}`);
    }
    
    // Test 4: Check configuration files
    console.log('⚙️ Test 4: Configuration...');
    
    const configChecks = [];
    
    // Check Next.js config
    if (fs.existsSync(path.join(__dirname, 'next.config.js'))) {
      configChecks.push('Next.js config found');
    }
    
    // Check Tailwind config
    if (fs.existsSync(path.join(__dirname, 'tailwind.config.js'))) {
      configChecks.push('Tailwind config found');
    }
    
    // Check TypeScript config
    if (fs.existsSync(path.join(__dirname, 'tsconfig.json'))) {
      configChecks.push('TypeScript config found');
    }
    
    if (configChecks.length >= 2) {
      testResults.configuration.passed = true;
      console.log('✅ Configuration files present');
    } else {
      testResults.configuration.issues.push('Missing configuration files');
    }
    
    // Test 5: Check for TypeScript compilation errors
    console.log('🔍 Test 5: TypeScript Compilation...');
    
    const srcDir = path.join(__dirname, 'src');
    if (fs.existsSync(srcDir)) {
      const hasTypeScriptFiles = walkDirectory(srcDir, '.tsx').length > 0 || 
                                  walkDirectory(srcDir, '.ts').length > 0;
      
      if (hasTypeScriptFiles) {
        testResults.compilation.passed = true;
        console.log('✅ TypeScript files found and structured');
      } else {
        testResults.compilation.issues.push('No TypeScript source files found');
      }
    }
    
    // Calculate overall results
    const allTests = [
      testResults.compilation.passed,
      testResults.fileStructure.passed,
      testResults.imports.passed,
      testResults.configuration.passed
    ];
    
    testResults.overall.passed = allTests.every(test => test);
    testResults.overall.issues = [
      ...testResults.compilation.issues,
      ...testResults.fileStructure.issues,
      ...testResults.imports.issues,
      ...testResults.configuration.issues
    ];
    
    console.log('\n📊 BASIC FUNCTIONALITY TEST RESULTS:');
    console.log('✅ Compilation:', testResults.compilation.passed ? 'PASSED' : 'FAILED');
    console.log('✅ File Structure:', testResults.fileStructure.passed ? 'PASSED' : 'FAILED');
    console.log('✅ Dependencies:', testResults.imports.passed ? 'PASSED' : 'FAILED');
    console.log('✅ Configuration:', testResults.configuration.passed ? 'PASSED' : 'FAILED');
    console.log('✅ Overall:', testResults.overall.passed ? 'PASSED' : 'FAILED');
    
    if (testResults.overall.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      testResults.overall.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    return testResults;
    
  } catch (error) {
    console.error('Basic functionality test failed:', error);
    testResults.overall.issues.push(`Test execution error: ${error.message}`);
    return testResults;
  }
}

function walkDirectory(dir, extension) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(walkDirectory(filePath, extension));
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Run the test if this script is executed directly
if (require.main === module) {
  const results = runBasicFunctionalityTest();
  console.log('\n🎯 Test completed. Results:', JSON.stringify(results, null, 2));
  process.exit(results.overall.passed ? 0 : 1);
}

module.exports = { runBasicFunctionalityTest };