
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
        hostname: 'i.ytimg.com', // Added for YouTube thumbnails
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http', // Google Books thumbnails can be http
        hostname: 'books.google.com',
        port: '',
        pathname: '/books/content/**',
      },
      {
        protocol: 'https', // Also allow https for Google Books thumbnails
        hostname: 'books.google.com',
        port: '',
        pathname: '/books/content/**',
      },
      // News API image hostnames - more may need to be added as new sources appear
      {
        protocol: 'https',
        hostname: 'images.mktw.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.mos.cms.futurecdn.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets3.cbsnewsstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i2-prod.dailyrecord.co.uk',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'kubrick.htvapps.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.zdnet.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bloximages.newyork1.vip.townnews.com',
        port: '',
        pathname: '/**',
      },
      { // Added for newsdata.io itself, if it ever serves images directly
        protocol: 'https',
        hostname: 'newsdata.io',
        port: '',
        pathname: '/**',
      },
      { // Added for potential subdomains of newsdata.io
        protocol: 'https',
        hostname: '*.newsdata.io',
        port: '',
        pathname: '/**',
      },
      // Add other news image hostnames here as they appear. For example:
      // {
      //   protocol: 'https',
      //   hostname: 'some.other-news-image-domain.com',
      //   port: '',
      //   pathname: '/**',
      // },
    ],
  },
};

export default nextConfig;
