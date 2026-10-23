/**
 * Re-score ALL products using the NEW AI Agent System
 *
 * This replaces the basic heuristic scores (25-50 range)
 * with sophisticated AI-powered scores (70-90+ range)
 */

import { PrismaClient } from '@prisma/client';
import { aiScoringEngine } from '../src/lib/services/aiScoringEngine';

const prisma = new PrismaClient();

async function rescoreWithAIAgents() {
  console.log('\n🤖 AI-POWERED RE-SCORING');
  console.log('================================\n');
  console.log('Using 7 specialized AI agents:');
  console.log('  1. Price Agent - Market analysis');
  console.log('  2. Quality Agent - Condition assessment');
  console.log('  3. Trust Agent - Seller reliability');
  console.log('  4. Sustainability Agent - Environmental impact');
  console.log('  5. Market Demand Agent - Popularity analysis');
  console.log('  6. Spec Matcher Agent - Feature completeness');
  console.log('  7. Financial Value Agent - ROI calculation\n');

  try {
    // Get all products
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      take: 50, // Start with 50 products
      select: {
        id: true,
        name: true,
        price: true,
        brand: true,
        category: true,
        description: true,
        condition: true,
        aiScore: true
      }
    });

    console.log(`Found ${products.length} products to score\n`);

    let scoredCount = 0;
    let highScores = 0; // 70+
    let excellentScores = 0; // 80+

    for (const product of products) {
      try {
        const oldScore = product.aiScore || 0;

        console.log(`\n[${scoredCount + 1}/${products.length}] ${product.name}`);
        console.log(`  Old Score: ${oldScore}/100`);
        console.log(`  Scoring with 7 AI agents...`);

        // Score with AI agents
        const result = await aiScoringEngine.scoreProduct({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          brand: product.brand || undefined,
          category: product.category || undefined,
          description: product.description || undefined,
          condition: product.condition || 'Good'
        });

        // Update database
        await prisma.product.update({
          where: { id: product.id },
          data: {
            aiScore: result.veritasScore,
            updatedAt: new Date()
          }
        });

        const improvement = result.veritasScore - oldScore;
        const improvementSign = improvement >= 0 ? '+' : '';

        console.log(`  ✅ New Score: ${result.veritasScore}/100 (${improvementSign}${Math.round(improvement)})`);
        console.log(`  📊 Component Scores:`);
        Object.entries(result.componentScores).forEach(([agent, score]) => {
          console.log(`     ${agent}: ${score}/100`);
        });
        console.log(`  🎯 Confidence: ${Math.round(result.confidence * 100)}%`);

        if (result.veritasScore >= 70) highScores++;
        if (result.veritasScore >= 80) excellentScores++;

        scoredCount++;

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`  ❌ Failed to score ${product.name}:`, error);
      }
    }

    console.log('\n\n✅ AI RE-SCORING COMPLETE!');
    console.log('================================');
    console.log(`  Total Scored: ${scoredCount}`);
    console.log(`  High Quality (70+): ${highScores}`);
    console.log(`  Excellent (80+): ${excellentScores}`);

    // Get final stats
    const stats = await aiScoringEngine.getStats();
    console.log('\n📊 Overall Statistics:');
    console.log(`  Avg Veritas Score: ${stats.avgScore}/100`);
    console.log(`  Score Distribution:`);
    console.log(`    🟢 Exceptional (90+): ${stats.scoreDistribution.exceptional}`);
    console.log(`    🔵 Excellent (80-89): ${stats.scoreDistribution.excellent}`);
    console.log(`    🟣 Good (70-79): ${stats.scoreDistribution.good}`);
    console.log(`    🟡 Fair (60-69): ${stats.scoreDistribution.fair}`);
    console.log(`    🟠 Poor (<60): ${stats.scoreDistribution.poor}`);

    console.log('\n🎉 Your products now have AI-powered scores!');
    console.log('   Refresh your browser to see the improved scores.\n');

  } catch (error) {
    console.error('❌ Re-scoring failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run it
rescoreWithAIAgents();
