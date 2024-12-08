const isGithubActions = process.env.GITHUB_ACTIONS || false

let assetPrefix = ''
let basePath = ''

if (isGithubActions) {
  const repo = process.env.GITHUB_REPOSITORY.replace(/.*?\//, '')
  assetPrefix = `/${repo}/`
  basePath = `/${repo}`
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/teacher-planner',
  assetPrefix: '/teacher-planner/',
  trailingSlash: true,
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true
  },
  reactStrictMode: true
}

module.exports = nextConfig
