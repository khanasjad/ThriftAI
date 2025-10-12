#!/usr/bin/env npx tsx

import { structuredQueryGenerator } from '../src/lib/services/structuredQueryGenerator'
import { prisma } from '../src/lib/prisma'

async function testQuery() {
  console.log('Testing structured query generator for "Electronics"\n')

  const result = await structuredQueryGenerator.generateQuery('Electronics', prisma)

  console.log('Generated query:', JSON.stringify(result, null, 2))

  await prisma.$disconnect()
}

testQuery().catch(console.error)
