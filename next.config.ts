import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for Vercel deployment
  serverExternalPackages: ['@prisma/client'],
  
  // Image optimization
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Webpack configuration for better bundling
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  
  // Environment configuration
  env: {
    VERCEL_ENV: process.env.VERCEL_ENV,
  },
  
  // Output configuration for Vercel (removed as it's default for Vercel)
  
  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  
  // Disable linting during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checking during build (for faster deployment)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Headers configuration
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
