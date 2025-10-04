/**
 * Swagger/OpenAPI Specification Endpoint
 * Serves the complete OpenAPI spec for all ThriftAI APIs
 */

import { NextResponse } from 'next/server'
import { completeApiSpec } from '@/lib/swagger/completeApiSpec'

export async function GET() {
  return NextResponse.json(completeApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
