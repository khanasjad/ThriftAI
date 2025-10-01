/**
 * Master Script Runner
 *
 * Runs all batch processing scripts in the correct order.
 * Use this for initial setup or complete system refresh.
 *
 * Usage:
 *   npx tsx scripts/run-all.ts
 *   npx tsx scripts/run-all.ts --skip-embeddings  # Skip embedding generation
 *   npx tsx scripts/run-all.ts --limit 100  # Process only 100 products
 */

import { spawn } from 'child_process'

interface ScriptStep {
  name: string
  script: string
  args: string[]
  required: boolean
  description: string
}

async function runScript(step: ScriptStep): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📋 STEP: ${step.name}`)
  console.log(`📝 ${step.description}`)
  console.log(`${'='.repeat(60)}\n`)

  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', step.script, ...step.args], {
      stdio: 'inherit',
      shell: true
    })

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${step.name} completed successfully\n`)
        resolve(true)
      } else {
        console.error(`\n❌ ${step.name} failed with code ${code}\n`)
        resolve(false)
      }
    })

    child.on('error', (error) => {
      console.error(`\n❌ ${step.name} error:`, error, '\n')
      resolve(false)
    })
  })
}

async function main() {
  const args = process.argv.slice(2)
  const skipEmbeddings = args.includes('--skip-embeddings')
  const skipMetrics = args.includes('--skip-metrics')
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex !== -1 ? args[limitIndex + 1] : undefined

  const startTime = Date.now()

  console.log('\n' + '='.repeat(60))
  console.log('🚀 THRIFTAI 96-PARAMETER SYSTEM - BATCH PROCESSING')
  console.log('='.repeat(60))
  console.log('\nThis will run all maintenance scripts in sequence:')
  console.log('  1. Fetch company metrics (stocks, ESG, growth)')
  console.log('  2. Generate vector embeddings (semantic search)')
  console.log('  3. Calculate AI scores (96 parameters)')
  console.log('  4. Update leaderboard rankings')
  console.log('\n' + '='.repeat(60))

  if (skipEmbeddings) console.log('\n⚠️  Skipping embedding generation')
  if (skipMetrics) console.log('\n⚠️  Skipping company metrics fetch')
  if (limit) console.log(`\n📊 Processing limit: ${limit} products`)

  console.log('\n')

  // Define all steps
  const steps: ScriptStep[] = [
    {
      name: 'Fetch Company Metrics',
      script: 'scripts/fetch-company-metrics.ts',
      args: [],
      required: !skipMetrics,
      description: 'Fetching 25 company-level parameters (stocks, ESG, sustainability)'
    },
    {
      name: 'Generate Embeddings',
      script: 'scripts/generate-all-embeddings.ts',
      args: limit ? ['--limit', limit] : [],
      required: !skipEmbeddings,
      description: 'Creating 1536-dimensional vector embeddings for semantic search'
    },
    {
      name: 'Score Products',
      script: 'scripts/score-all-products.ts',
      args: limit ? ['--limit', limit] : [],
      required: true,
      description: 'Calculating AI scores using all 96 parameters'
    },
    {
      name: 'Update Leaderboard',
      script: 'scripts/update-leaderboard.ts',
      args: ['--stats'],
      required: true,
      description: 'Refreshing product rankings and leaderboard'
    }
  ]

  // Run each step
  let completedSteps = 0
  let failedSteps = 0

  for (const step of steps) {
    if (!step.required) {
      console.log(`\n⏭️  Skipping: ${step.name}\n`)
      continue
    }

    const success = await runScript(step)

    if (success) {
      completedSteps++
    } else {
      failedSteps++

      // Ask user if they want to continue
      console.log(`\n⚠️  ${step.name} failed. Do you want to continue? (y/n)`)
      console.log('   (Continuing may cause issues in subsequent steps)\n')

      // For automated runs, stop on failure
      if (process.env.CI || process.env.AUTOMATED) {
        console.log('❌ Stopping due to failure (automated mode)\n')
        break
      }

      // In interactive mode, we'll continue for now
      // In a real implementation, you'd want to read user input
      console.log('⚠️  Continuing despite failure...\n')
    }
  }

  // Summary
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n' + '='.repeat(60))
  console.log('📊 BATCH PROCESSING SUMMARY')
  console.log('='.repeat(60))
  console.log(`\n✅ Completed Steps: ${completedSteps}`)
  console.log(`❌ Failed Steps: ${failedSteps}`)
  console.log(`⏱️  Total Time: ${totalTime}s`)
  console.log('\n' + '='.repeat(60))

  if (failedSteps === 0) {
    console.log('\n🎉 ALL STEPS COMPLETED SUCCESSFULLY!\n')
    console.log('Your ThriftAI system is now fully updated with:')
    console.log('  ✅ Latest company metrics')
    console.log('  ✅ Vector embeddings for semantic search')
    console.log('  ✅ AI scores using 96 parameters')
    console.log('  ✅ Updated leaderboard rankings\n')

    console.log('💡 What\'s Next:')
    console.log('  1. Test smart search: GET /api/smart-search?q=$20 shirt')
    console.log('  2. View leaderboard: GET /api/leaderboard?type=global')
    console.log('  3. Monitor system health: npx tsx scripts/update-leaderboard.ts --stats')
    console.log('\n🚀 Your AI-powered e-commerce system is ready!\n')
  } else {
    console.log('\n⚠️  SOME STEPS FAILED\n')
    console.log('Please review the errors above and:')
    console.log('  1. Check your API keys in .env file')
    console.log('  2. Verify database connection')
    console.log('  3. Run failed scripts individually for detailed errors')
    console.log('  4. Check scripts/README.md for troubleshooting\n')
  }

  process.exit(failedSteps > 0 ? 1 : 0)
}

// Run the master script
main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
