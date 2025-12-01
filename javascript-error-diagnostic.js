/**
 * JAVASCRIPT ERROR DIAGNOSTIC SCRIPT
 * 
 * This script diagnoses the "Cannot read properties of undefined (reading 'call')" error
 * and hydration failures causing gray screens.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 [DIAGNOSTIC] Starting JavaScript Error Diagnosis...\n');

// 1. Check for potential undefined imports/exports
function checkImportExportIssues() {
  console.log('🔍 [DIAGNOSTIC] Checking for import/export issues...');
  
  const criticalFiles = [
    'src/supabase/client.ts',
    'src/contexts/AuthContext-simple.tsx',
    'src/app/(auth)/login/page.tsx',
    'src/components/AuthGuard.tsx'
  ];
  
  const issues = [];
  
  criticalFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for potential undefined imports
      const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
      if (importMatches) {
        importMatches.forEach(importLine => {
          const match = importLine.match(/from\s+['"]([^'"]+)['"]/);
          if (match) {
            const importPath = match[1];
            
            // Check for relative imports that might be undefined
            if (importPath.startsWith('@/')) {
              const actualPath = importPath.replace('@', './src');
              const resolvedPath = path.resolve(actualPath);
              if (!fs.existsSync(resolvedPath) && !fs.existsSync(resolvedPath + '.ts') && !fs.existsSync(resolvedPath + '.tsx')) {
                issues.push({
                  file: filePath,
                  type: 'MISSING_IMPORT',
                  details: `Cannot resolve import: ${importPath}`
                });
              }
            }
          }
        });
      }
      
      // Check for potential undefined function calls
      const callMatches = content.match(/(\w+)\.call\(/g);
      if (callMatches) {
        callMatches.forEach(call => {
          const objectName = call.split('.')[0];
          // Check if the object might be undefined
          if (!content.includes(`const ${objectName}`) && !content.includes(`let ${objectName}`) && !content.includes(`var ${objectName}`)) {
            // Check if it's imported
            const importMatch = content.match(new RegExp(`import.*{[^}]*${objectName}[^}]*}`));
            if (!importMatch) {
              issues.push({
                file: filePath,
                type: 'POTENTIAL_UNDEFINED_CALL',
                details: `Potential undefined object in call: ${objectName}.call()`
              });
            }
          }
        });
      }
    } else {
      issues.push({
        file: filePath,
        type: 'MISSING_FILE',
        details: 'Critical file does not exist'
      });
    }
  });
  
  return issues;
}

// 2. Check for race conditions in AuthContext
function checkAuthRaceConditions() {
  console.log('🔍 [DIAGNOSTIC] Checking for AuthContext race conditions...');
  
  const authContextPath = 'src/contexts/AuthContext-simple.tsx';
  const issues = [];
  
  if (fs.existsSync(authContextPath)) {
    const content = fs.readFileSync(authContextPath, 'utf8');
    
    // Check for potential race conditions
    if (content.includes('useEffect') && content.includes('async')) {
      // Check if there are proper cleanup mechanisms
      if (!content.includes('isComponentMounted') && !content.includes('mountedRef')) {
        issues.push({
          file: authContextPath,
          type: 'RACE_CONDITION',
          details: 'Async operations in useEffect without proper cleanup'
        });
      }
    }
    
    // Check if getSupabaseClient is called before proper initialization
    if (content.includes('getSupabaseClient()')) {
      const supabaseClientPath = 'src/supabase/client.ts';
      if (fs.existsSync(supabaseClientPath)) {
        const supabaseContent = fs.readFileSync(supabaseClientPath, 'utf8');
        
        // Check if Supabase client might throw during initialization
        if (supabaseContent.includes('throw new Error')) {
          issues.push({
            file: authContextPath,
            type: 'SUPABASE_INIT_ERROR',
            details: 'Supabase client might throw during initialization, causing undefined errors'
          });
        }
      }
    }
    
    // Check if useAuth hook properly handles undefined context
    if (content.includes('useContext(AuthContext)')) {
      const contextCheck = content.includes('if (context === undefined)');
      if (!contextCheck) {
        issues.push({
          file: authContextPath,
          type: 'UNDEFINED_CONTEXT',
          details: 'useAuth hook does not properly handle undefined context'
        });
      }
    }
  }
  
  return issues;
}

// 3. Check for hydration issues
function checkHydrationIssues() {
  console.log('🔍 [DIAGNOSTIC] Checking for hydration issues...');
  
  const loginPagePath = 'src/app/(auth)/login/page.tsx';
  const issues = [];
  
  if (fs.existsSync(loginPagePath)) {
    const content = fs.readFileSync(loginPagePath, 'utf8');
    
    // Check for client-only code that might cause hydration mismatches
    if (content.includes('useEffect') && content.includes('document.')) {
      // Check if there are proper client-side checks
      if (!content.includes('typeof window !== \'undefined\'')) {
        issues.push({
          file: loginPagePath,
          type: 'HYDRATION_MISMATCH',
          details: 'Client-side DOM access without proper window check'
        });
      }
    }
    
    // Check for server/client state mismatches
    if (content.includes('useState') && content.includes('useAuth')) {
      // Check if auth state is properly handled during hydration
      const authCheck = content.includes('authInitialized');
      if (!authCheck) {
        issues.push({
          file: loginPagePath,
          type: 'AUTH_HYDRATION',
          details: 'Auth state not properly handled during hydration'
        });
      }
    }
  }
  
  return issues;
}

// 4. Check webpack configuration for potential issues
function checkWebpackIssues() {
  console.log('🔍 [DIAGNOSTIC] Checking webpack configuration...');
  
  const nextConfigPath = 'next.config.js';
  const issues = [];
  
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Check for potential webpack issues
    if (content.includes('webpack:')) {
      // Check if there are proper fallback configurations
      if (!content.includes('resolve.fallback')) {
        issues.push({
          file: nextConfigPath,
          type: 'WEBPACK_FALLBACK',
          details: 'Missing webpack fallback configuration'
        });
      }
      
      // Check for proper alias configuration
      if (!content.includes('resolve.alias')) {
        issues.push({
          file: nextConfigPath,
          type: 'WEBPACK_ALIAS',
          details: 'Missing webpack alias configuration'
        });
      }
    }
    
    // Check for experimental features that might cause issues
    if (content.includes('experimental:')) {
      if (content.includes('serverComponentsExternalPackages')) {
        issues.push({
          file: nextConfigPath,
          type: 'EXPERIMENTAL_FEATURE',
          details: 'Experimental serverComponentsExternalPackages might cause module resolution issues'
        });
      }
    }
  }
  
  return issues;
}

// 5. Check environment variables
function checkEnvironmentVariables() {
  console.log('🔍 [DIAGNOSTIC] Checking environment variables...');
  
  const envPath = '.env';
  const issues = [];
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    
    // Check for required Supabase variables
    if (!content.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      issues.push({
        file: envPath,
        type: 'MISSING_ENV_VAR',
        details: 'NEXT_PUBLIC_SUPABASE_URL is not defined'
      });
    }
    
    if (!content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
      issues.push({
        file: envPath,
        type: 'MISSING_ENV_VAR',
        details: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined'
      });
    }
  } else {
    issues.push({
      file: envPath,
      type: 'MISSING_FILE',
      details: '.env file does not exist'
    });
  }
  
  return issues;
}

// Run all diagnostics
function runDiagnostics() {
  console.log('🔍 [DIAGNOSTIC] Running comprehensive JavaScript error diagnosis...\n');
  
  const allIssues = [
    ...checkImportExportIssues(),
    ...checkAuthRaceConditions(),
    ...checkHydrationIssues(),
    ...checkWebpackIssues(),
    ...checkEnvironmentVariables()
  ];
  
  console.log('\n📊 [DIAGNOSTIC RESULTS] Summary:');
  console.log('=====================================');
  
  if (allIssues.length === 0) {
    console.log('✅ No critical issues found in static analysis');
  } else {
    console.log(`❌ Found ${allIssues.length} potential issues:\n`);
    
    allIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.type} in ${issue.file}`);
      console.log(`   Details: ${issue.details}\n`);
    });
    
    // Categorize issues by severity
    const criticalIssues = allIssues.filter(issue => 
      issue.type === 'MISSING_FILE' || 
      issue.type === 'MISSING_IMPORT' || 
      issue.type === 'SUPABASE_INIT_ERROR'
    );
    
    const highIssues = allIssues.filter(issue => 
      issue.type === 'RACE_CONDITION' || 
      issue.type === 'UNDEFINED_CONTEXT' || 
      issue.type === 'HYDRATION_MISMATCH'
    );
    
    const mediumIssues = allIssues.filter(issue => 
      issue.type === 'POTENTIAL_UNDEFINED_CALL' || 
      issue.type === 'WEBPACK_FALLBACK' || 
      issue.type === 'WEBPACK_ALIAS' ||
      issue.type === 'AUTH_HYDRATION' ||
      issue.type === 'MISSING_ENV_VAR'
    );
    
    console.log('🚨 CRITICAL ISSUES (Immediate attention required):');
    criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.file}: ${issue.details}`);
    });
    
    console.log('\n⚠️  HIGH PRIORITY ISSUES:');
    highIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.file}: ${issue.details}`);
    });
    
    console.log('\n📝 MEDIUM PRIORITY ISSUES:');
    mediumIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.file}: ${issue.details}`);
    });
  }
  
  // Generate recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('==================');
  
  if (allIssues.some(issue => issue.type === 'RACE_CONDITION' || issue.type === 'UNDEFINED_CONTEXT')) {
    console.log('1. Add proper null checks and initialization guards in AuthContext');
    console.log('2. Implement proper cleanup mechanisms in useEffect hooks');
    console.log('3. Add defensive programming for undefined objects');
  }
  
  if (allIssues.some(issue => issue.type === 'HYDRATION_MISMATCH' || issue.type === 'AUTH_HYDRATION')) {
    console.log('4. Add proper client-side checks (typeof window !== "undefined")');
    console.log('5. Ensure auth state is properly handled during hydration');
    console.log('6. Add loading states to prevent premature rendering');
  }
  
  if (allIssues.some(issue => issue.type === 'SUPABASE_INIT_ERROR' || issue.type === 'MISSING_ENV_VAR')) {
    console.log('7. Verify Supabase environment variables are properly set');
    console.log('8. Add error handling for Supabase client initialization');
  }
  
  if (allIssues.some(issue => issue.type === 'WEBPACK_FALLBACK' || issue.type === 'WEBPACK_ALIAS')) {
    console.log('9. Review webpack configuration for proper module resolution');
    console.log('10. Consider disabling experimental features that cause issues');
  }
  
  return allIssues;
}

// Export for use in other scripts
module.exports = {
  runDiagnostics,
  checkImportExportIssues,
  checkAuthRaceConditions,
  checkHydrationIssues,
  checkWebpackIssues,
  checkEnvironmentVariables
};

// Run diagnostics if this script is executed directly
if (require.main === module) {
  runDiagnostics();
}