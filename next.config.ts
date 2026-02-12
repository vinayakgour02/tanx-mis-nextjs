import type { NextConfig } from "next";

/**
 * Next.js configuration with linting and type checking disabled for builds
 */
const nextConfig: NextConfig = {
  
  // Disable ESLint during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Bypass TypeScript build errors
  typescript: {
    ignoreBuildErrors: true,
  },

  // Add other Next.js config options below
  reactStrictMode: true,

  experimental: {
    // Enable optimistic client cache for faster navigation
    optimisticClientCache: true,
    
    // Enable partial pre-rendering for improved performance
    ppr: false, // Set to true when ready for experimental features
    
    // Enable React compiler for better optimization
    reactCompiler: false, // Enable when React Compiler is stable

    // Enable turbo mode for faster development
     turbo: {
      rules: {
        '*.svg': ['@svgr/webpack'],
      },
    },
 },

  // Enable compression
  compress: true,

  // ========================================
  // WEBPACK CUSTOMIZATION
  // ========================================

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.module.rules.push({
      test: /\.map$/,
      loader: 'ignore-loader'
    });
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          chunks: 'all',
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      };
    }

    // Add custom webpack plugins
    config.plugins.push(
      new webpack.DefinePlugin({
        __BUILD_ID__: JSON.stringify(buildId),
        __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      })
    );

    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Optimize for production
    if (!dev) {
      // Remove console logs in production
      config.optimization.minimizer.forEach((minimizer: any) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions.compress.drop_console = true;
        }
      });
    }

    return config;
  },
};

export default nextConfig;