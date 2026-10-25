import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { SiteShell } from '@/components/site/shell'
import { SignInForm } from './sign-in-form'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } }

export default function SignInPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-sm px-4 pb-24 pt-16 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Sign in</h1>
        <p className="mt-2 text-sm text-fg-muted">For brand teams and Veritas admins. Shoppers don’t need an account.</p>
        <Suspense>
          <SignInForm />
        </Suspense>
        <p className="mt-8 text-sm text-fg-muted">
          No account yet?{' '}
          <Link href="/pilot" className="text-accent underline underline-offset-4">
            Apply for a free pilot
          </Link>
          .
        </p>
      </div>
    </SiteShell>
  )
}
