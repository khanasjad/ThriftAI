'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { IngestReport } from '@/lib/veritas/ingest/run'

/** Feed upload with the validation report inline. Dry run checks the file without saving anything. */
export function UploadFeed() {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)
  const [report, setReport] = React.useState<IngestReport | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setReport(null)
    try {
      const res = await fetch('/api/v1/dashboard/ingest', { method: 'POST', body: new FormData(e.currentTarget) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.success) setError(json.error ?? 'Upload failed')
      else {
        setReport(json.data)
        router.refresh()
      }
    } catch {
      setError('Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const field = 'h-10 w-full rounded-lg border border-border-strong bg-bg px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-ring'
  return (
    <div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-fg">
          Feed
          <select name="kind" className={`${field} mt-1`} defaultValue="catalog">
            <option value="catalog">Catalog (products and prices)</option>
            <option value="reviews">Reviews</option>
            <option value="returns">Returns</option>
          </select>
        </label>
        <label className="text-sm text-fg">
          File (.csv or .json)
          <input name="file" type="file" accept=".csv,.json,text/csv,application/json" required className={`${field} mt-1 py-1.5`} />
        </label>
        <label className="text-sm text-fg">
          Source (who sent it)
          <input name="source" required minLength={2} placeholder="e.g. nightly catalog export" className={`${field} mt-1`} />
        </label>
        <label className="text-sm text-fg">
          Licence or terms (optional)
          <input name="licence" placeholder="e.g. pilot agreement 2026" className={`${field} mt-1`} />
        </label>
        <label className="flex items-center gap-2 text-sm text-fg">
          <input name="dryRun" type="checkbox" defaultChecked className="size-4 accent-[var(--accent)]" /> Dry run (check only, save nothing)
        </label>
        <div className="sm:text-right">
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Upload />} Upload
          </Button>
        </div>
      </form>
      <div aria-live="polite">
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-critical-soft px-4 py-3 text-sm text-critical-fg">
            {error}
          </p>
        )}
        {report && (
          <div className="mt-4 rounded-lg border border-border p-4 text-sm">
            <p className="font-medium text-fg">
              {report.dryRun ? 'Dry run: nothing saved. ' : ''}
              {report.accepted} of {report.rows} rows accepted · {report.created} new · {report.updated} updated · {report.unchanged} unchanged · {report.productsChanged} products to re-score
            </p>
            {report.errors.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 text-fg-muted">
                {report.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>
                    Row {e.row}
                    {e.field && <span className="font-mono text-xs"> [{e.field}]</span>}: {e.message}
                  </li>
                ))}
                {report.errors.length > 10 && <li>…and {report.errors.length - 10} more</li>}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
