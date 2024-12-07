/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/teacher-planner',
  images: {
    unoptimized: true,
  },
  webpack: (config) => { 
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    };
    return config;
  },
}
