import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Lets build checks (`NEXT_DIST_DIR=.next-check npm run build`) run without
  // overwriting the `.next/` folder a running `npm run dev` is serving from.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Resolve metadata before streaming the body for every client, not only known bots.
  // Puts <title>/<meta description> in the initial <head> and lets notFound()/redirect() set real status codes.
  htmlLimitedBots: /.*/,
  // The fashion model's runtime uses native binaries and WASM: load it from node_modules, never bundle it.
  serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node', 'sharp'],
  // Keep serverless functions under Vercel's 250 MB: the Node build only loads onnxruntime-node, and Vercel runs
  // linux x64. Model files are downloaded at runtime into /tmp, never bundled.
  // The library loads onnxruntime-node through createRequire, which file tracing can't see: ship it explicitly to
  // the routes that run the model (search, uploads, the nightly job).
  outputFileTracingIncludes: Object.fromEntries(
    ['/search', '/api/v1/search', '/api/v1/ingest/[kind]', '/api/v1/dashboard/ingest', '/api/cron/nightly'].map((r) => [r, ['node_modules/onnxruntime-node/package.json', 'node_modules/onnxruntime-node/dist/**', 'node_modules/onnxruntime-node/bin/napi-v*/linux/x64/**', 'node_modules/onnxruntime-common/**']]),
  ),
  outputFileTracingExcludes: {
    '*': [
      'node_modules/onnxruntime-web/**',
      'node_modules/onnxruntime-node/bin/napi-v*/darwin/**',
      'node_modules/onnxruntime-node/bin/napi-v*/win32/**',
      'node_modules/onnxruntime-node/bin/napi-v*/linux/arm64/**',
      'node_modules/@huggingface/transformers/.cache/**',
      'node_modules/@huggingface/transformers/dist/*.web*',
      'node_modules/@huggingface/transformers/dist/transformers.js',
      'node_modules/@huggingface/transformers/dist/transformers.min.js',
    ],
  },
  async headers() {
    // Baseline security headers on every response. (A full Content-Security-Policy needs nonce support for
    // Next's inline scripts; tracked in the production runbook.)
    const security = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    ]
    return [{ source: '/:path*', headers: security }]
  },
  async redirects() {
    return [
      // Old product URLs used ids; /p/ accepts an id or a slug.
      { source: '/products/:id', destination: '/p/:id', permanent: true },
      { source: '/api-docs', destination: '/developers', permanent: true },
    ]
  },
}

export default nextConfig
