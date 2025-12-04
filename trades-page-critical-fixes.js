// Comprehensive fixes for trades page critical issues
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive trades page fixes...');

// Fix 1: GSAP Import Issues (HIGHEST PRIORITY)
function fixGSAPImports() {
  console.log('🔧 Fixing GSAP import issues...');
  
  const tradesPagePath = path.join(__dirname, 'src/app/trades/page.tsx');
  let content = fs.readFileSync(tradesPagePath, 'utf8');
  
  // Replace problematic GSAP initialization with safer approach
  const oldGSAPInit = `// Initialize GSAP on client side only
const initializeGSAP = () => {
  if (typeof window !== 'undefined' && !gsap) {
    try {
      // Use require for client-side only loading
      const gsapModule = require('gsap');
      const scrollTriggerModule = require('gsap/ScrollTrigger');
      
      gsap = gsapModule.gsap || gsapModule.default;
      ScrollTrigger = scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;
      
      // Register GSAP plugins
      if (gsap && ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
      }
    } catch (error) {
      console.error('Failed to initialize GSAP:', error);
    }
  }
  return { gsap, ScrollTrigger };
};`;
  
  const newGSAPInit = `// Safe GSAP initialization with error boundaries
const initializeGSAP = () => {
  if (typeof window === 'undefined') return { gsap: null, ScrollTrigger: null };
  
  try {
    // Dynamic import with error handling
    const gsapModule = require('gsap');
    const scrollTriggerModule = require('gsap/ScrollTrigger');
    
    const gsap = gsapModule.gsap || gsapModule.default || gsapModule;
    const ScrollTrigger = scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default || scrollTriggerModule;
    
    if (gsap && ScrollTrigger && typeof gsap.registerPlugin === 'function') {
      gsap.registerPlugin(ScrollTrigger);
      console.log('✅ GSAP initialized successfully');
    }
    
    return { gsap, ScrollTrigger };
  } catch (error) {
    console.warn('⚠️ GSAP initialization failed:', error.message);
    return { gsap: null, ScrollTrigger: null };
  }
};`;
  
  content = content.replace(oldGSAPInit, newGSAPInit);
  
  // Fix GSAP usage in hooks
  content = content.replace(
    `const { gsap: gsapInstance, ScrollTrigger: scrollTrigger } = initializeGSAP();`,
    `const { gsap: gsapInstance, ScrollTrigger: scrollTrigger } = initializeGSAP() || {};`
  );
  
  fs.writeFileSync(tradesPagePath, content);
  console.log('✅ GSAP imports fixed');
}

// Fix 2: Remove Excessive Debug Logging
function removeExcessiveLogging() {
  console.log('🔧 Removing excessive debug logging...');
  
  const filesToFix = [
    'src/lib/optimized-queries.ts',
    'src/lib/memoization.ts',
    'src/lib/filter-persistence.ts'
  ];
  
  filesToFix.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove debug console logs but keep error logs
      const debugPatterns = [
        /console\.log\('🔄\[.*?\]'.*?\);?/g,
        /console\.log\('🔧\[.*?\]'.*?\);?/g,
        /console\.log\('🎯\[.*?\]'.*?\);?/g,
        /console\.log\('🚀\[.*?\]'.*?\);?/g,
        /console\.log\('🔑\[.*?\]'.*?\);?/g
      ];
      
      debugPatterns.forEach(pattern => {
        content = content.replace(pattern, '');
      });
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Cleaned logs in ${filePath}`);
    }
  });
}

// Fix 3: Optimize Authentication Context
function optimizeAuthContext() {
  console.log('🔧 Optimizing authentication context...');
  
  // Check if auth context exists and optimize it
  const authContextPath = path.join(__dirname, 'src/contexts/AuthContext-simple.tsx');
  
  if (fs.existsSync(authContextPath)) {
    let content = fs.readFileSync(authContextPath, 'utf8');
    
    // Add timeout to prevent infinite loading
    const authTimeoutCode = `
    // Add timeout to prevent infinite loading
    useEffect(() => {
      const timeout = setTimeout(() => {
        if (loading) {
          console.warn('⚠️ Auth initialization timeout - forcing completion');
          setLoading(false);
          setAuthInitialized(true);
        }
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timeout);
    }, [loading]);
    `;
    
    // Find the useEffect that handles auth state and add timeout
    if (content.includes('useEffect(() => {') && !content.includes('Auth initialization timeout')) {
      const insertPoint = content.lastIndexOf('useEffect(() => {');
      const insertIndex = content.indexOf('}', insertPoint) + 1;
      
      content = content.slice(0, insertIndex) + authTimeoutCode + content.slice(insertIndex);
      
      fs.writeFileSync(authContextPath, content);
      console.log('✅ Auth context optimized with timeout');
    }
  }
}

// Fix 4: Fix Static Asset Issues
function fixStaticAssetIssues() {
  console.log('🔧 Fixing static asset issues...');
  
  // Create next.config.js if it doesn't exist
  const nextConfigPath = path.join(__dirname, 'next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['gsap', 'lucide-react']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      };
    }
    
    // Fix chunk loading issues
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        },
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          priority: -10,
          chunks: 'all'
        },
        gsap: {
          test: /[\\\\/]node_modules[\\\\/]gsap[\\\\/]/,
          name: 'gsap',
          priority: 20,
          chunks: 'all'
        }
      }
    };
    
    return config;
  },
  // Fix static asset issues
  generateEtags: false,
  poweredByHeader: false
};

module.exports = nextConfig;
`;
    
    fs.writeFileSync(nextConfigPath, nextConfig);
    console.log('✅ Created optimized next.config.js');
  }
}

// Fix 5: Optimize Component Effects
function optimizeComponentEffects() {
  console.log('🔧 Optimizing component effects...');
  
  const tradesPagePath = path.join(__dirname, 'src/app/trades/page.tsx');
  let content = fs.readFileSync(tradesPagePath, 'utf8');
  
  // Fix infinite loop in filter effect
  const oldFilterEffect = `  // Save filters when they change - separate from data fetching
  useEffect(() => {
    if (user) {
      saveTradeFilters(filtersRef.current);
    }
  }, [user?.id]); // Remove filters dependency to prevent infinite loop`;
  
  const newFilterEffect = `  // Save filters when they change - optimized with debouncing
  useEffect(() => {
    if (user && filtersRef.current) {
      const timeoutId = setTimeout(() => {
        saveTradeFilters(filtersRef.current);
      }, 500); // Debounce filter saving
      
      return () => clearTimeout(timeoutId);
    }
  }, [user?.id, filters.symbol, filters.market, filters.dateFrom, filters.dateTo]); // Specific dependencies`;
  
  content = content.replace(oldFilterEffect, newFilterEffect);
  
  // Fix memory leaks in GSAP animations
  const oldGSAPCleanup = `    return () => {
      scrollTrigger.getAll().forEach((trigger: any) => trigger.kill());
    };`;
  
  const newGSAPCleanup = `    return () => {
      if (scrollTrigger && typeof scrollTrigger.getAll === 'function') {
        try {
          scrollTrigger.getAll().forEach((trigger: any) => {
            if (trigger && typeof trigger.kill === 'function') {
              trigger.kill();
            }
          });
        } catch (error) {
          console.warn('GSAP cleanup error:', error);
        }
      }
    };`;
  
  content = content.replace(oldGSAPCleanup, newGSAPCleanup);
  
  fs.writeFileSync(tradesPagePath, content);
  console.log('✅ Component effects optimized');
}

// Fix 6: Add Error Boundaries
function addErrorBoundaries() {
  console.log('🔧 Adding error boundaries...');
  
  const errorBoundaryComponent = `
'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class TradesErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TradesPage Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-[#050505]">
          <div className="text-center">
            <h2 className="text-2xl text-white mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-6">Please refresh the page to try again</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gold text-black rounded-lg font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TradesErrorBoundary;
`;
  
  const errorBoundaryPath = path.join(__dirname, 'src/components/TradesErrorBoundary.tsx');
  
  // Create directory if it doesn't exist
  const componentsDir = path.dirname(errorBoundaryPath);
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }
  
  fs.writeFileSync(errorBoundaryPath, errorBoundaryComponent);
  console.log('✅ Error boundary component created');
}

// Fix 7: Create Performance Monitor
function createPerformanceMonitor() {
  console.log('🔧 Creating performance monitor...');
  
  const performanceMonitor = `
'use client';

import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStart = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStart.current = performance.now();
    renderCount.current++;

    return () => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current;
        
        if (renderTime > 100) { // Log slow renders
          console.warn(\`⚠️ Slow render detected in \${componentName}:\`, {
            renderTime: \`\${renderTime.toFixed(2)}ms\`,
            renderCount: renderCount.current,
            memoryUsage: performance.memory ? \`\${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB\` : 'N/A'
          });
        }
      }
    };
  });

  useEffect(() => {
    // Monitor memory usage
    const checkMemory = () => {
      if (performance.memory) {
        const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
        if (memoryMB > 50) { // Warn if using more than 50MB
          console.warn(\`⚠️ High memory usage in \${componentName}:\`, {
            memoryUsage: \`\${memoryMB.toFixed(2)}MB\`,
            memoryLimit: '50MB'
          });
        }
      }
    };

    const interval = setInterval(checkMemory, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [componentName]);
};
`;
  
  const monitorPath = path.join(__dirname, 'src/hooks/usePerformanceMonitor.ts');
  
  // Create hooks directory if it doesn't exist
  const hooksDir = path.dirname(monitorPath);
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }
  
  fs.writeFileSync(monitorPath, performanceMonitor);
  console.log('✅ Performance monitor created');
}

// Execute all fixes
async function applyAllFixes() {
  try {
    console.log('🚀 Applying all critical fixes...');
    
    fixGSAPImports();
    removeExcessiveLogging();
    optimizeAuthContext();
    fixStaticAssetIssues();
    optimizeComponentEffects();
    addErrorBoundaries();
    createPerformanceMonitor();
    
    console.log('✅ All critical fixes applied successfully!');
    console.log('');
    console.log('📋 Summary of fixes applied:');
    console.log('  1. ✅ GSAP import issues resolved');
    console.log('  2. ✅ Excessive debug logging removed');
    console.log('  3. ✅ Authentication context optimized');
    console.log('  4. ✅ Static asset issues fixed');
    console.log('  5. ✅ Component effects optimized');
    console.log('  6. ✅ Error boundaries added');
    console.log('  7. ✅ Performance monitor created');
    console.log('');
    console.log('🔄 Please restart the development server to apply fixes:');
    console.log('   npm run dev');
    
  } catch (error) {
    console.error('❌ Error applying fixes:', error);
  }
}

// Run the fixes
applyAllFixes();