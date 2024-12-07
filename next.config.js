/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/teacher-planner',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
