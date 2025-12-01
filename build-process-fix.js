#!/usr/bin/env node

/**
 * BUILD PROCESS FIX FOR VEROTRADE APPLICATION
 * 
 * This script addresses the recurring white screen issues caused by
 * corrupted build artifacts and missing vendor chunks.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 ===== BUILD PROCESS FIX FOR VEROTRADE =====');
console.log('🎯 Target: Fix recurring white screen and missing vendor chunks');

// Function to execute commands with error handling
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
    throw error;
  }
}

// Function to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Function to clean build artifacts thoroughly
function thoroughClean() {
  console.log('\n🧹 ===== THOROUGH BUILD CLEANUP =====');
  
  const pathsToClean = [
    '.next',
    'node_modules/.cache',
    'out',
    '.vercel'
  ];
  
  pathsToClean.forEach(pathToClean => {
    try {
      if (fileExists(pathToClean)) {
        execCommand(`rmdir /s /q "${pathToClean}"`, `Remove ${pathToClean}`);
      } else {
        console.log(`ℹ️  Path does not exist: ${pathToClean}`);
      }
    } catch (error) {
      console.log(`⚠️  Could not remove ${pathToClean}: ${error.message}`);
    }
  });
  
  // Clean package-lock.json to ensure fresh dependency resolution
  if (fileExists('package-lock.json')) {
    try {
      fs.unlinkSync('package-lock.json');
      console.log('✅ Removed package-lock.json for fresh dependency resolution');
    } catch (error) {
      console.log(`⚠️  Could not remove package-lock.json: ${error.message}`);
    }
  }
}

// Function to fix package.json for better dependency resolution
function fixPackageJson() {
  console.log('\n📦 ===== PACKAGE.JSON OPTIMIZATION =====');
  
  try {
    const packageJsonPath = 'package.json';
    if (!fileExists(packageJsonPath)) {
      throw new Error('package.json not found');
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Ensure we have proper resolutions for styled-jsx
    if (!packageJson.resolutions) {
      packageJson.resolutions = {};
    }
    
    // Force consistent styled-jsx version
    packageJson.resolutions['styled-jsx'] = '^5.1.0';
    
    // Add build optimization scripts
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    packageJson.scripts['build:clean'] = 'rmdir /s /q .next && npm run build';
    packageJson.scripts['dev:clean'] = 'rmdir /s /q .next && npm run dev';
    packageJson.scripts['dev:stable'] = 'npm run build:clean && npm run dev';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Optimized package.json for stable builds');
    
  } catch (error) {
    console.log(`❌ Error fixing package.json: ${error.message}`);
    throw error;
  }
}

// Function to create Next.js configuration optimizations
function optimizeNextConfig() {
  console.log('\n⚙️ ===== NEXT.JS CONFIGURATION OPTIMIZATION =====');
  
  const nextConfigPath = 'next.config.js';
  
  try {
    // Check if next.config.js exists
    if (fileExists(nextConfigPath)) {
      console.log('ℹ️  next.config.js already exists, checking for optimizations...');
      const existingConfig = fs.readFileSync(nextConfigPath, 'utf8');
      
      if (existingConfig.includes('experimental.swcMinify')) {
        console.log('✅ next.config.js already has optimizations');
        return;
      }
    }
    
    // Create optimized next.config.js
    const optimizedConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better stability
  experimental: {
    // Use SWC minifier for more reliable builds
    swcMinify: true,
    // Improve chunk loading reliability
    optimizeCss: true,
  },
  
  // Configure webpack for better chunk handling
  webpack: (config, { isServer }) => {
    // Ensure proper chunk loading for styled-jsx
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Optimize chunk splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\\\/]node_modules[\\\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };
    
    return config;
  },
  
  // Configure compiler for better error handling
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Enable strict mode for better error catching
  reactStrictMode: true,
  
  // Configure page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
`;
    
    fs.writeFileSync(nextConfigPath, optimizedConfig);
    console.log('✅ Created optimized next.config.js');
    
  } catch (error) {
    console.log(`❌ Error creating next.config.js: ${error.message}`);
    throw error;
  }
}

// Function to create robust error boundaries
function createErrorBoundaries() {
  console.log('\n🛡️ ===== CREATING ROBUST ERROR BOUNDARIES =====');
  
  const errorBoundaryDir = 'src/components';
  
  // Ensure directory exists
  if (!fileExists(errorBoundaryDir)) {
    fs.mkdirSync(errorBoundaryDir, { recursive: true });
  }
  
  // Create enhanced ErrorBoundary component
  const errorBoundaryContent = `'use client';

import React from 'react';
import { useEffect } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; errorInfo?: React.ErrorInfo; retry: () => void }>;
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log error to external service if needed
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} errorInfo={this.state.errorInfo} retry={this.retry} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, errorInfo, retry }: { 
  error?: Error; 
  errorInfo?: React.ErrorInfo; 
  retry: () => void;
}) {
  useEffect(() => {
    // Log the error for debugging
    console.error('Application Error:', error);
    console.error('Error Info:', errorInfo);
  }, [error, errorInfo]);

  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '1px solid #ff6b6b',
      borderRadius: '8px',
      backgroundColor: '#ffe0e0',
      color: '#d63031',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h2 style={{ margin: '0 0 16px 0', color: '#d63031' }}>
        🚨 Application Error
      </h2>
      <p style={{ margin: '0 0 16px 0' }}>
        The application encountered an unexpected error. This has been logged for investigation.
      </p>
      
      {process.env.NODE_ENV === 'development' && error && (
        <details style={{ marginBottom: '16px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            Error Details (Development Only)
          </summary>
          <pre style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {error.toString()}
            {errorInfo && errorInfo.componentStack}
          </pre>
        </details>
      )}
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={retry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0984e3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Try Again
        </button>
        
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#636e72',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
`;

  fs.writeFileSync(`${errorBoundaryDir}/ErrorBoundary.tsx`, errorBoundaryContent);
  console.log('✅ Created enhanced ErrorBoundary component');
}

// Function to create build monitoring script
function createBuildMonitor() {
  console.log('\n📊 ===== CREATING BUILD MONITOR =====');
  
  const monitorScript = `#!/usr/bin/env node

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
      issues.push(\`Missing critical path: \${checkPath}\`);
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
  
  console.log(\`📊 Build Health Score: \${healthScore}/100\`);
  
  if (issues.length > 0) {
    console.log('⚠️  Issues detected:');
    issues.forEach(issue => console.log(\`  - \${issue}\`));
    return false;
  }
  
  console.log('✅ Build is healthy');
  return true;
}

if (require.main === module) {
  checkBuildHealth();
}

module.exports = { checkBuildHealth };
`;

  fs.writeFileSync('build-monitor.js', monitorScript);
  console.log('✅ Created build monitoring script');
}

// Main execution
async function main() {
  try {
    console.log('\n🚀 Starting comprehensive build process fix...');
    
    // Step 1: Thorough cleanup
    thoroughClean();
    
    // Step 2: Fix package.json
    fixPackageJson();
    
    // Step 3: Optimize Next.js config
    optimizeNextConfig();
    
    // Step 4: Create error boundaries
    createErrorBoundaries();
    
    // Step 5: Create build monitor
    createBuildMonitor();
    
    // Step 6: Fresh dependency installation
    console.log('\n📦 Installing fresh dependencies...');
    execCommand('npm install --force', 'Fresh dependency installation');
    
    // Step 7: Build verification
    console.log('\n🔍 Verifying build process...');
    execCommand('npm run build', 'Build verification');
    
    console.log('\n🎉 ===== BUILD PROCESS FIX COMPLETED =====');
    console.log('✅ All optimizations applied successfully');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Run: npm run dev:stable');
    console.log('2. Monitor with: node build-monitor.js');
    console.log('3. Use build:clean script for fresh builds');
    
  } catch (error) {
    console.error('\n❌ BUILD PROCESS FIX FAILED:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  thoroughClean,
  fixPackageJson,
  optimizeNextConfig,
  createErrorBoundaries,
  createBuildMonitor
};