import { NextRequest } from 'next/server'
import { csrf } from '@/lib/middleware/csrf'

export async function GET(request: NextRequest) {
  return csrf.getTokenEndpoint(request)
}