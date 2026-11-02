import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream', 'ioredis'],
  webpack: (config) => {
    config.infrastructureLogging = {
      level: 'error',
    };
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /next-intl/ },
      { message: /PackFileCacheStrategy/ },
      { message: /Build dependencies behind this expression are ignored/ },
    ];
    return config;
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
