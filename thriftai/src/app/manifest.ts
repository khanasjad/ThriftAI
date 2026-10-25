import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Veritas: is it worth buying?',
    short_name: 'Veritas',
    description: 'One trustworthy score for clothing, with the evidence behind every number.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#fafaf9',
    icons: [{ src: '/logo.svg', sizes: 'any', type: 'image/svg+xml' }],
    shortcuts: [
      { name: 'Search', url: '/search' },
      { name: 'Your fit profile', url: '/profile' },
    ],
  }
}
