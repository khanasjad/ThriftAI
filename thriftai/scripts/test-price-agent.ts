/**
 * Test Price Intelligence Agent
 *
 * Quick script to test the PriceIntelligenceAgent with real database products
 */

import { PrismaClient } from '@prisma/client';
import { PriceIntelligenceAgent } from '../src/lib/agents/specialized/PriceIntelligenceAgent';

const prisma = new PrismaClient();

async function testPriceAgent() {
  console.log('\n🧪 Testing Price Intelligence Agent\n');
  console.log('=' .repeat(60));

  try {
    const agent = new PriceIntelligenceAgent();

    // Get sample products from different price ranges
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        brand: true,
        condition: true,
        aiScore: true
      },
      take: 10
    });

    console.log(`\n📊 Testing with ${products.length} products...\n`);

    for (const product of products) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`🏷️  Product: ${product.name}`);
      console.log(`💰 Price: $${product.price}`);
      console.log(`📁 Category: ${product.category || 'N/A'}`);
      console.log(`⭐ Current AI Score: ${product.aiScore || 'Not scored'}/100`);

      const result = await agent.analyze({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        category: product.category || undefined,
        brand: product.brand || undefined,
        condition: product.condition || 'Good'
      });

      console.log(`\n✨ New Price Score: ${result.score}/100`);
      console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`💭 Reasoning: ${result.reasoning}`);
      console.log(`⚡ Processing Time: ${result.processingTime}ms`);

      if (result.warnings && result.warnings.length > 0) {
        console.log(`\n⚠️  Warnings:`);
        result.warnings.forEach(w => console.log(`   - ${w}`));
      }

      console.log(`\n📈 Detailed Metrics:`);
      console.log(`   Category Median: $${result.factors.categoryMedian?.toFixed(2)}`);
      console.log(`   Discount: ${result.factors.discountFromMedian?.toFixed(1)}%`);
      console.log(`   Data Points: ${result.factors.dataPoints}`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Price Intelligence Agent Test Complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPriceAgent();
