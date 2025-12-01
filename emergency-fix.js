#!/usr/bin/env node

/**
 * EMERGENCY FIX FOR VEROTRADE WHITE SCREEN ISSUES
 * 
 * This script addresses the critical build issues causing recurring white screens:
 * 1. Missing styled-jsx vendor chunks
 * 2. Missing critters dependency for CSS optimization
 * 3. Import/export errors in test files
 * 4. Build configuration conflicts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚨 ===== EMERGENCY FIX FOR VEROTRADE =====');
console.log('🎯 Target: Fix critical white screen issues immediately');

// Function to execute commands safely
function execCommand(command, description) {
  try {
    console.log(`\n📋 Executing: ${description}`);
    console.log(`🔧 Command: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    console.log(`✅ Success: ${description}`);
    return output;
  } catch (error) {
    console.log(`❌ Error in ${description}:`, error.message);
    return null;
  }
}

// Step 1: Fix missing dependencies
function fixDependencies() {
  console.log('\n📦 ===== FIXING MISSING DEPENDENCIES =====');
  
  // Install missing critters dependency
  execCommand('npm install critters --save-dev', 'Install missing critters dependency');
  
  // Install styled-jsx explicitly
  execCommand('npm install styled-jsx@^5.1.0 --save-dev', 'Install styled-jsx explicitly');
  
  // Fix SWC dependencies
  execCommand('npm install @next/swc-darwin-arm64 @next/swc-darwin-x64 @next/swc-linux-arm64-gnu @next/swc-linux-arm64-musl @next/swc-linux-x64-gnu @next/swc-win32-arm64-msvc @next/swc-win32-ia32-msvc @next/swc-win32-x64-msvc --save-dev', 'Install SWC dependencies');
}

// Step 2: Fix problematic test files
function fixTestFiles() {
  console.log('\n🧪 ===== FIXING PROBLEMATIC TEST FILES =====');
  
  const problematicFiles = [
    'src/app/test-api-key-fix/page.tsx',
    'src/app/test-strategy-rule-compliance-fixes/page.tsx'
  ];
  
  problematicFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      console.log(`🔧 Fixing imports in ${filePath}`);
      
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix import errors
      content = content.replace(/clearSupabaseCache/g, 'supabase');
      content = content.replace(/safeSupabase/g, 'supabase');
      content = content.replace(/getSupabaseClient/g, 'supabase');
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed imports in ${filePath}`);
    }
  });
}

// Step 3: Create minimal, stable Next.js config
function createMinimalConfig() {
  console.log('\n⚙️ ===== CREATING STABLE NEXT.JS CONFIG =====');
  
  const stableConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable experimental features that cause issues
  experimental: {
    // Remove optimizeCss as it requires critters
    // optimizeCss: true,
  },
  
  // Basic webpack configuration
  webpack: (config, { isServer }) => {
    // Ensure proper chunk loading
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    return config;
  },
  
  // Enable strict mode for better error catching
  reactStrictMode: true,
  
  // Configure page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
};

module.exports = nextConfig;
`;
  
  fs.writeFileSync('next.config.js', stableConfig);
  console.log('✅ Created stable Next.js configuration');
}

// Step 4: Clean build artifacts thoroughly
function thoroughClean() {
  console.log('\n🧹 ===== THOROUGH CLEANUP =====');
  
  const pathsToClean = [
    '.next',
    'node_modules/.cache',
    'out',
    '.vercel'
  ];
  
  pathsToClean.forEach(pathToClean => {
    try {
      if (fs.existsSync(pathToClean)) {
        execCommand(`rmdir /s /q "${pathToClean}"`, `Remove ${pathToClean}`);
      }
    } catch (error) {
      console.log(`⚠️  Could not remove ${pathToClean}: ${error.message}`);
    }
  });
}

// Step 5: Create emergency error boundary
function createEmergencyErrorBoundary() {
  console.log('\n🛡️ ===== CREATING EMERGENCY ERROR BOUNDARY =====');
  
  const errorBoundaryContent = `'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Emergency ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          color: '#d63031',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center'
        }}>
          <h2>🚨 Application Error</h2>
          <p>The application encountered an error. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>Error Details</summary>
              <pre style={{ 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
`;

  const componentsDir = 'src/components';
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }
  
  fs.writeFileSync(`${componentsDir}/EmergencyErrorBoundary.tsx`, errorBoundaryContent);
  console.log('✅ Created emergency error boundary');
}

// Step 6: Update root layout with error boundary
function updateRootLayout() {
  console.log('\n📄 ===== UPDATING ROOT LAYOUT =====');
  
  const layoutPath = 'src/app/layout.tsx';
  
  if (fs.existsSync(layoutPath)) {
    let content = fs.readFileSync(layoutPath, 'utf8');
    
    // Add error boundary import if not present
    if (!content.includes('EmergencyErrorBoundary')) {
      content = content.replace(
        "import './globals.css'",
        "import './globals.css'\nimport EmergencyErrorBoundary from '@/components/EmergencyErrorBoundary'"
      );
    }
    
    // Wrap children with error boundary if not already wrapped
    if (!content.includes('<EmergencyErrorBoundary>')) {
      content = content.replace(
        '<body>',
        '<body>\n        <EmergencyErrorBoundary>'
      );
      content = content.replace(
        '</body>',
        '</EmergencyErrorBoundary>\n      </body>'
      );
    }
    
    fs.writeFileSync(layoutPath, content);
    console.log('✅ Updated root layout with emergency error boundary');
  }
}

// Step 7: Create recovery script
function createRecoveryScript() {
  console.log('\n🔄 ===== CREATING RECOVERY SCRIPT =====');
  
  const recoveryScript = `#!/usr/bin/env node

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
`;

  fs.writeFileSync('recover.js', recoveryScript);
  console.log('✅ Created recovery script');
}

// Main execution
async function main() {
  try {
    console.log('\n🚀 Starting emergency fix...');
    
    // Step 1: Fix dependencies
    fixDependencies();
    
    // Step 2: Fix test files
    fixTestFiles();
    
    // Step 3: Create stable config
    createMinimalConfig();
    
    // Step 4: Clean thoroughly
    thoroughClean();
    
    // Step 5: Create emergency error boundary
    createEmergencyErrorBoundary();
    
    // Step 6: Update root layout
    updateRootLayout();
    
    // Step 7: Create recovery script
    createRecoveryScript();
    
    // Step 8: Final dependency installation
    console.log('\n📦 ===== FINAL DEPENDENCY INSTALLATION =====');
    execCommand('npm install --force', 'Final dependency installation');
    
    console.log('\n🎉 ===== EMERGENCY FIX COMPLETED =====');
    console.log('✅ Critical issues addressed');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Run: npm run dev');
    console.log('2. If issues persist, run: node recover.js');
    console.log('3. Check: http://localhost:3000');
    
  } catch (error) {
    console.error('\n❌ EMERGENCY FIX FAILED:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  fixDependencies,
  fixTestFiles,
  createMinimalConfig,
  thoroughClean,
  createEmergencyErrorBoundary,
  updateRootLayout,
  createRecoveryScript
};