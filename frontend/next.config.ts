import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Compiler for better performance
  reactCompiler: true,

  // Standalone output for Docker deployment
  output: 'standalone',

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Compression
  compress: true,

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Enable webpack cache for faster rebuilds
    config.cache = {
      type: 'filesystem',
    };

    // Code splitting optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor code (node_modules)
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            // UI components
            ui: {
              test: /[\\/]components[\\/]ui[\\/]/,
              name: 'ui',
              priority: 5,
              reuseExistingChunk: true,
            },
            // Common code shared between pages
            common: {
              minChunks: 2,
              priority: 3,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },

  // Experimental features
  experimental: {
    // Enable optimistic UI updates
    optimisticClientCache: true,
  },

  // Turbopack configuration (Next.js 16+)
  // Empty config to acknowledge Turbopack usage and silence warnings
  turbopack: {},
};

export default nextConfig;
