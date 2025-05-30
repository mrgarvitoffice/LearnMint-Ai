
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.mktw.net', // Added for MarketWatch news images
        port: '',
        pathname: '/**',
      },
      // Add other news image hostnames here as they appear
      // For example, if you see errors for cdn.cnn.com, add:
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.cnn.com',
      //   port: '',
      //   pathname: '/**',
      // },
    ],
  },
};

export default nextConfig;
