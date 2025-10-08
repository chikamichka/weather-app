import { NextConfig } from 'next';

const nextConfig: NextConfig = {

  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add the images configuration here:
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'openweathermap.org',
        port: '',
        pathname: '/img/wn/**',
      },
    ],
  },
  
  // You might have other settings here (e.g., experimental features)
  // ... other configurations
};

export default nextConfig;

