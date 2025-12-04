/** @type {import('next').NextConfig} */

const nextConfig = {
  // Basic Next.js configuration - let Next.js handle chunk generation
  reactStrictMode: true,
  
  // Proper page extensions for App Router
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Enable minification in production
  swcMinify: true,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
  
  // Fix asset serving in development
  experimental: {
    // Ensure proper asset serving in development
    serverComponentsExternalPackages: [],
  },
  
  // Configure webpack for proper chunk handling
  webpack: (config, { dev, isServer }) => {
    // Let Next.js handle asset paths automatically
    return config;
  },
  
  // Ensure proper static asset serving
  generateEtags: false,
  
  // Fix trailing slash issues
  trailingSlash: false,
};

module.exports = nextConfig;
