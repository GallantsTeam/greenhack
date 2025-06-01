
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
        hostname: 'cluster-c23mj7ubf5fxwq6nrbev4ugaxa.cloudworkstations.dev',
      },
      {
        protocol: 'https',
        hostname: 'greenhacks.ru',
      },
      {
        protocol: 'https',
        hostname: '**', // Allows all HTTPS hostnames
      },
      {
        protocol: 'http',
        hostname: '**', // Allows all HTTP hostnames
      },
    ],
  },
};

export default nextConfig;
