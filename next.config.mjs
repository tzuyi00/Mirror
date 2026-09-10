import withPWA from '@ducanh2912/next-pwa'

const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Uncomment for static deployment. Comment out for PWA testing or regular development.
  // output: 'export',
  images: { unoptimized: true },
  experimental: {
    outputFileTracingRoot: import.meta.dirname,
  },
  async rewrites() {
    return [
      {
        source: '/docs',
        destination: `${process.env.DOCS_URL || 'http://localhost:3002'}/docs`,
      },
      {
        source: '/docs/:path*',
        destination: `${process.env.DOCS_URL || 'http://localhost:3002'}/docs/:path*`,
      },
      {
        source: '/private',
        destination: `${process.env.DOCS_URL || 'http://localhost:3002'}/private`,
      },
      {
        source: '/private/:path*',
        destination: `${process.env.DOCS_URL || 'http://localhost:3002'}/private/:path*`,
      },
      // Proxy static assets for the documentation app
      // Requests to /docs-static/_next/... will be forwarded to the docs app's /_next/...
      {
        source: '/docs-static/_next/:path*',
        destination: `${process.env.DOCS_URL || 'http://localhost:3002'}/_next/:path*`,
      },
    ]
  },
}

export default withPWA({
  dest: 'public',
  disable: !isProd,
  register: true,
  skipWaiting: true,
})(nextConfig)