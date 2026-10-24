import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Lets build checks (`NEXT_DIST_DIR=.next-check npm run build`) run without
  // overwriting the `.next/` folder a running `npm run dev` is serving from.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async redirects() {
    return [
      // Old product URLs used ids; /p/ accepts an id or a slug.
      { source: '/products/:id', destination: '/p/:id', permanent: true },
      { source: '/api-docs', destination: '/developers', permanent: true },
    ]
  },
}

export default nextConfig
