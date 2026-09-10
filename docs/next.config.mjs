import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Define assetPrefix to serve static assets from a custom path, avoiding conflicts with the main app
  assetPrefix: '/docs-static',
};

export default withMDX(config);
