// Unit tests never call the real API (CLAUDE.md: tests run in mock LLM mode).
process.env.LLM_MODE = 'mock'
// Unit tests never load the 200 MB fashion model; its matching rule is tested as pure code.
process.env.VISUAL_SEARCH = '0'
process.env.APP_ENV = 'development'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test@localhost:5432/test'
delete process.env.ANTHROPIC_API_KEY

// Browser-only mocks, for component tests that use `@jest-environment jsdom` (the default).
if (typeof window !== 'undefined') {
  require('@testing-library/jest-dom')

  jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
  }))

  jest.mock('next-auth/react', () => ({
    useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
    signIn: jest.fn(),
    signOut: jest.fn(),
    SessionProvider: ({ children }) => children,
  }))

  const observer = () => ({ observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() })
  global.IntersectionObserver = jest.fn().mockImplementation(observer)
  global.ResizeObserver = jest.fn().mockImplementation(observer)

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}
