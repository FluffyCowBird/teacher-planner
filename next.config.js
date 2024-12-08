/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/teacher-planner',
  assetPrefix: '/teacher-planner/',
  trailingSlash: true,
  output: 'export',
  images: {
    unoptimized: true
  },
  reactStrictMode: true
}

module.exports = nextConfig
