import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'example.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.example.com', port: '', pathname: '/**' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: false,
    minimumCacheTTL: 60,
  },

  async redirects() {
    return [
      { source: '/old-path', destination: '/new-path', permanent: true },
      { source: '/temporary-redirect', destination: '/new-destination', permanent: false },
    ];
  },

  async rewrites() {
    return [
      { source: '/api/:path*', destination: '/api/:path*' },
      { source: '/external/:path*', destination: 'https://external-api.com/:path*' },
    ];
  },

  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    API_URL: process.env.API_URL,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },

  serverExternalPackages: [],

  // Important: DO NOT set Content-Security-Policy here; it's centralized in middleware.ts.
  // Optional: keep API-specific headers or remove this block entirely.
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [{ key: 'X-API-Version', value: '1.0.0' }],
      },
    ];
  },

  output: 'standalone',
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
