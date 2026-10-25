import 'server-only'
import { randomUUID } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type { z } from 'zod'

/** Shared helpers for /api/v1 routes: `{ success, data, error? }` responses (backend plan §10). */

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json({ success: true, data }, init)

export const fail = (status: number, error: string, details?: unknown) =>
  NextResponse.json({ success: false, error, ...(details !== undefined && { details }) }, { status })

export const zodFail = (err: z.ZodError) => fail(400, 'Invalid request', err.flatten().fieldErrors)

const SID = 'veritas_sid'

/** Anonymous browser session id (httpOnly cookie). Used to de-duplicate feedback; holds no personal data. */
export async function sessionId() {
  const jar = await cookies()
  let sid = jar.get(SID)?.value
  if (!sid || !/^[\w-]{20,64}$/.test(sid)) {
    sid = randomUUID()
    jar.set(SID, sid, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 })
  }
  return sid
}

// Fixed-window limiter, per server instance. Good enough for dev and a single region;
// production moves this to a shared store (B8).
const buckets = new Map<string, { count: number; resetAt: number }>()

export async function rateLimit(name: string, limit: number, windowMs: number) {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local'
  const key = `${name}:${ip}`
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  b.count++
  return b.count <= limit
}
