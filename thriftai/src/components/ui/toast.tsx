'use client'

import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastTone = 'info' | 'good' | 'critical'
type ToastData = { id: number; title: string; description?: string; tone: ToastTone }

const ToastContext = React.createContext<(t: Omit<ToastData, 'id'>) => void>(() => {})

/** `const toast = useToast(); toast({ title: 'Saved', tone: 'good' })` */
export const useToast = () => React.useContext(ToastContext)

const icons: Record<ToastTone, React.ReactNode> = {
  info: <Info className="size-4 text-accent" aria-hidden />,
  good: <CheckCircle2 className="size-4 text-good-fg" aria-hidden />,
  critical: <AlertTriangle className="size-4 text-critical-fg" aria-hidden />,
}

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([])
  const push = React.useCallback((t: Omit<ToastData, 'id'>) => setToasts((xs) => [...xs, { ...t, id: Date.now() + Math.random() }]), [])

  return (
    <ToastContext.Provider value={push}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            onOpenChange={(open) => !open && setToasts((xs) => xs.filter((x) => x.id !== t.id))}
            className={cn(
              'flex items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-lg',
              'data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full data-[state=closed]:animate-out data-[state=closed]:fade-out-80',
            )}
          >
            <span className="mt-0.5">{icons[t.tone]}</span>
            <div className="flex-1">
              <ToastPrimitive.Title className="text-sm font-semibold text-fg">{t.title}</ToastPrimitive.Title>
              {t.description && <ToastPrimitive.Description className="mt-0.5 text-sm text-fg-muted">{t.description}</ToastPrimitive.Description>}
            </div>
            <ToastPrimitive.Close aria-label="Dismiss" className="rounded p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg">
              <X className="size-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}
