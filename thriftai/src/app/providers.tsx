'use client'

import { SessionProvider } from 'next-auth/react'
import { TooltipProvider } from '@/components/ui/controls'
import { Toaster } from '@/components/ui/toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider delayDuration={150}>
        <Toaster>{children}</Toaster>
      </TooltipProvider>
    </SessionProvider>
  )
}
