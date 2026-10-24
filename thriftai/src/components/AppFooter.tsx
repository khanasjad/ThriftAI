import Link from 'next/link'

export default function AppFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo & Description */}
          <div className="text-center md:text-left">
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Veritas AI
            </span>
            <p className="text-sm text-gray-600 mt-2">
              Quality scoring for DTC clothing brands
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/about"
              className="text-gray-600 hover:text-violet-600 transition-colors"
            >
              About
            </Link>
            <Link
              href="/privacy-policy"
              className="text-gray-600 hover:text-violet-600 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-gray-600 hover:text-violet-600 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/api-docs"
              className="text-gray-600 hover:text-violet-600 transition-colors"
            >
              API Docs
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Veritas AI Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
