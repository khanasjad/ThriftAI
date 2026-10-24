/**
 * Small presentational primitives: Badge, Card, Input, Textarea, Label, Skeleton, Kbd, Table.
 * Interactive Radix-based primitives live in their own files.
 */
import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// --- Badge ------------------------------------------------------------------
export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium [&_svg]:size-3.5',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-2 text-fg-muted',
        accent: 'bg-accent-soft text-accent',
        good: 'bg-good-soft text-good-fg',
        warning: 'bg-warning-soft text-warning-fg',
        critical: 'bg-critical-soft text-critical-fg',
        outline: 'border border-border text-fg-muted',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)
export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

// --- Card -------------------------------------------------------------------
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-border bg-surface shadow-sm', className)} {...props} />
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-5 pb-3', className)} {...props} />
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold tracking-tight text-fg', className)} {...props} />
}
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-fg-muted', className)} {...props} />
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />
}

// --- Form controls ----------------------------------------------------------
const field =
  'w-full rounded-md border border-border bg-surface px-3 text-sm text-fg shadow-sm transition-colors placeholder:text-fg-subtle hover:border-border-strong focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-critical'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(field, 'h-11', className)} {...props} />,
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(field, 'min-h-24 py-2.5', className)} {...props} />,
)
Textarea.displayName = 'Textarea'

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root className={cn('text-sm font-medium text-fg', className)} {...props} />
}

// --- Skeleton / Kbd ---------------------------------------------------------
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-surface-3', className)} {...props} />
}

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface-2 px-1 font-sans text-[11px] font-medium text-fg-muted',
        className,
      )}
      {...props}
    />
  )
}

// --- Table ------------------------------------------------------------------
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    // Focusable so keyboard users can scroll wide tables (WCAG scrollable-region-focusable).
    <div className="w-full min-w-0 overflow-x-auto rounded-[inherit] focus-visible:outline-2 focus-visible:outline-ring" tabIndex={0}>
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
}
export const THead = (p: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead {...p} className={cn('border-b border-border', p.className)} />
)
export const TBody = (p: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody {...p} className={cn('[&_tr:last-child]:border-0', p.className)} />
)
export const TR = (p: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr {...p} className={cn('border-b border-border transition-colors hover:bg-surface-2/60', p.className)} />
)
export const TH = (p: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th {...p} className={cn('h-10 px-3 text-left align-middle text-xs font-medium text-fg-muted', p.className)} />
)
export const TD = (p: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td {...p} className={cn('px-3 py-3 align-middle tabular', p.className)} />
)
