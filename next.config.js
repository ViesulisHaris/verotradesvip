/** @type {import('next').NextConfig} */

const nextConfig = {
  // Basic Next.js configuration
  reactStrictMode: true,
  
  // Proper page extensions for App Router
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Enable minification in production
  swcMinify: true,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Fix trailing slash issues
  trailingSlash: false,
};

module.exports = nextConfig;
