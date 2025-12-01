/** @type {import('next').NextConfig} */

const nextConfig = {
  // MINIMAL CONFIGURATION - Remove experimental features that may cause CSS generation issues
  experimental: {
    // DISABLED: Remove optimizePackageImports to prevent CSS processing conflicts
  },
  
  // Simplified compiler configuration
  compiler: {
    styledComponents: true,
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // SIMPLIFIED WEBPACK: Remove complex optimization that may interfere with CSS generation
  webpack: (config, { isServer, dev }) => {
    // Minimal webpack configuration to ensure CSS generation works
    if (dev) {
      console.log('🔍 [CSS_DEBUG] Webpack config for CSS generation:', {
        isServer,
        isDev: dev,
        timestamp: new Date().toISOString()
      });
    }
    
    // Simple path resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    };
    
    // REMOVED: All complex optimization that could interfere with CSS processing
    // Let Next.js handle CSS generation with default settings
    
    return config;
  },
  
  // Enable strict mode
  reactStrictMode: true,
  
  // Proper page extensions for App Router
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Simple build ID generation
  generateBuildId: async () => {
    return 'build-' + Date.now().toString(36);
  },
  
  // Proper static file handling
  trailingSlash: false,
  
  // Enable minification in production
  swcMinify: true,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
};

module.exports = nextConfig;
