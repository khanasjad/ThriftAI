'use client'

import { Toaster } from '@/components/ui/toast'

// Tooltips bring their own provider (components/ui/tooltip.tsx). NextAuth's SessionProvider
// returns with sign-in (B7); nothing reads the session yet.
export function Providers({ children }: { children: React.ReactNode }) {
  return <Toaster>{children}</Toaster>
}
