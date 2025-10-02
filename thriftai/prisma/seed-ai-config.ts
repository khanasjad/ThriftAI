import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🤖 Seeding AI Configuration...')

  // AI Model Configuration
  const aiConfigs = [
    {
      key: 'ai.model.query_generation',
      value: 'claude-3-haiku-20240307',
      value_type: 'STRING' as any,
      category: 'ai',
      description: 'Model used for structured query generation from natural language'
    },
    {
      key: 'ai.model.product_ranking',
      value: 'claude-3-haiku-20240307',
      value_type: 'STRING' as any,
      category: 'ai',
      description: 'Model used for intelligent product ranking'
    },
    {
      key: 'ai.model.chat',
      value: 'claude-3-haiku-20240307',
      value_type: 'STRING' as any,
      category: 'ai',
      description: 'Model used for conversational chat/shopping advisor'
    },
    {
      key: 'ai.model.intent_extraction',
      value: 'claude-3-haiku-20240307',
      value_type: 'STRING' as any,
      category: 'ai',
      description: 'Model used for extracting user intent from queries'
    },
    {
      key: 'ai.model.review_summarization',
      value: 'claude-3-haiku-20240307',
      value_type: 'STRING' as any,
      category: 'ai',
      description: 'Model used for summarizing product reviews'
    },
    {
      key: 'ai.temperature.query_generation',
      value: '0.1',
      value_type: 'NUMBER' as any,
      category: 'ai',
      description: 'Temperature for query generation (0.0-1.0, lower = more deterministic)'
    },
    {
      key: 'ai.temperature.product_ranking',
      value: '0.3',
      value_type: 'NUMBER' as any,
      category: 'ai',
      description: 'Temperature for product ranking'
    },
    {
      key: 'ai.temperature.chat',
      value: '0.7',
      value_type: 'NUMBER' as any,
      category: 'ai',
      description: 'Temperature for conversational responses'
    },
    {
      key: 'ai.max_tokens.query_generation',
      value: '800',
      value_type: 'NUMBER' as any,
      category: 'ai',
      description: 'Maximum tokens for query generation responses'
    },
    {
      key: 'ai.max_tokens.product_ranking',
      value: '2000',
      value_type: 'NUMBER' as any,
      category: 'ai',
      description: 'Maximum tokens for product ranking analysis'
    },
    {
      key: 'ai.max_tokens.chat',
      value: '1000',
      value_type: 'NUMBER' as any,
      category: 'ai',
      description: 'Maximum tokens for chat responses'
    },
    {
      key: 'ai.max_tokens.intent_extraction',
      value: '500',
      value_type: 'NUMBER' as any,
      category: 'ai',
      description: 'Maximum tokens for intent extraction'
    }
  ]

  for (const config of aiConfigs) {
    await prisma.systemConfiguration.upsert({
      where: { key: config.key },
      update: {
        value: config.value,
        value_type: config.value_type,
        category: config.category,
        description: config.description,
        is_active: true
      },
      create: config
    })
    console.log(`✅ ${config.key}: ${config.value}`)
  }

  console.log('✅ AI Configuration seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding AI configuration:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
