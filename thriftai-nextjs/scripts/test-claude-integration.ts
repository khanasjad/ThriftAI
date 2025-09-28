import { AIService } from '../src/lib/services/aiService'

async function testClaudeIntegration() {
  console.log('🧪 Testing Claude AI Integration...\n')

  // Test API availability
  console.log('📊 API Status:')
  console.log('- Claude Available:', AIService.isClaudeAvailable())
  console.log('- OpenAI Available:', AIService.isOpenAIAvailable())
  console.log()

  // Test search with fallback (no API key configured)
  console.log('🔍 Testing search with fallback functionality...')
  try {
    const result = await AIService.claudeSearch('vintage leather jacket', 100)
    console.log('✅ Search completed successfully!')
    console.log('- Query:', result.query)
    console.log('- Products found:', result.totalFound)
    console.log('- AI Response preview:', result.aiResponse.substring(0, 150) + '...')
    console.log('- Sustainability insights:', result.sustainabilityInsights ? 'Available' : 'Not available')
    console.log()
  } catch (error: any) {
    console.error('❌ Search failed:', error.message)
    console.log()
  }

  // Instructions for real API testing
  console.log('🔑 To test with real Claude API:')
  console.log('1. Get an API key from https://console.anthropic.com/')
  console.log('2. Update your .env.local file:')
  console.log('   ANTHROPIC_API_KEY="sk-ant-api03-YOUR_ACTUAL_API_KEY_HERE"')
  console.log('3. Restart the development server: npm run dev')
  console.log('4. Test the search at: http://localhost:3000')
  console.log()

  console.log('🎯 Key Features of the Integration:')
  console.log('- ✅ Latest Claude 3.5 Sonnet model')
  console.log('- ✅ Intelligent fallback responses')
  console.log('- ✅ Rate limiting with retry logic')
  console.log('- ✅ Sustainability insights')
  console.log('- ✅ Budget-aware recommendations')
  console.log('- ✅ Error handling with helpful messages')
  console.log('- ✅ Dual AI support (Claude + ChatGPT)')
  console.log()

  console.log('🌟 Claude AI specializes in:')
  console.log('- Sustainable shopping advice')
  console.log('- Environmental impact analysis')
  console.log('- Quality assessment and brand evaluation')
  console.log('- Style recommendations and fashion trends')
  console.log('- Negotiation tips for thrift shopping')
}

// Run the test
if (require.main === module) {
  testClaudeIntegration()
    .then(() => console.log('🎉 Test completed!'))
    .catch(error => console.error('❌ Test failed:', error))
}