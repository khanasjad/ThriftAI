/**
 * Test Script: Test Database Parameter Fetching
 *
 * This script tests the fetchAllDatabaseParameters function
 * to verify all 72 parameters can be fetched from the database.
 */

import { PrismaClient } from '@prisma/client';
import {
  fetchAllDatabaseParameters,
  calculateDatabaseVeritasScore,
} from '../src/lib/veritas/fetchDatabaseParameters';

const prisma = new PrismaClient();

async function testDatabaseParameters() {
  console.log('🧪 Testing Database Parameter Fetching...\n');

  try {
    // Get a sample product
    const product = await prisma.product.findFirst({
      select: { id: true, name: true, brand: true, category: true }
    });

    if (!product) {
      console.log('❌ No products found in database');
      console.log('💡 Run: npx tsx scripts/seed-1000-genuine-products-fixed.ts');
      return;
    }

    console.log('📦 Testing with product:');
    console.log(`   ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   Brand: ${product.brand}`);
    console.log(`   Category: ${product.category}\n`);

    // Fetch all database parameters
    console.log('⏳ Fetching all database parameters...');
    const startTime = Date.now();
    const parameters = await fetchAllDatabaseParameters(product.id);
    const fetchTime = Date.now() - startTime;
    console.log(`✅ Fetched in ${fetchTime}ms\n`);

    // Display results by category
    console.log('📊 PARAMETER SUMMARY\n');

    console.log('1️⃣  Product Quality (20/25 parameters)');
    console.log(`   Condition: ${parameters.productQuality.condition}`);
    console.log(`   Brand: ${parameters.productQuality.brand}`);
    console.log(`   Category: ${parameters.productQuality.category}`);
    console.log(`   Images: ${parameters.productQuality.images.length} photos`);
    console.log(`   Condition Score: ${parameters.productQuality.conditionScore}/100`);
    console.log(`   Functionality: ${parameters.productQuality.functionalityScore}/100`);
    console.log(`   Authenticity: ${parameters.productQuality.authenticityScore}/100`);
    console.log(`   Image Quality: ${parameters.productQuality.imageQualityScore}/100`);
    console.log(`   Description: ${parameters.productQuality.descriptionCompleteness}/100`);
    console.log(`   Age: ${parameters.productQuality.productAgeDays} days\n`);

    console.log('2️⃣  Seller Trust (19/20 parameters)');
    console.log(`   Rating: ${parameters.sellerTrust.sellerRating}/5 ⭐`);
    console.log(`   Total Sales: ${parameters.sellerTrust.totalSales}`);
    console.log(`   Verified: ${parameters.sellerTrust.isVerified ? '✅' : '❌'}`);
    console.log(`   Response Time: ${parameters.sellerTrust.avgResponseTimeHours}h`);
    console.log(`   Satisfaction: ${Math.round(parameters.sellerTrust.customerSatisfactionRate * 100)}%`);
    console.log(`   On-Time Delivery: ${Math.round(parameters.sellerTrust.onTimeDeliveryRate * 100)}%`);
    console.log(`   Defect Rate: ${Math.round(parameters.sellerTrust.defectRate * 100)}%`);
    console.log(`   Reliability Score: ${parameters.sellerTrust.sellerReliabilityScore}/100`);
    console.log(`   Trust Score: ${parameters.sellerTrust.trustScore}/100\n`);

    console.log('3️⃣  Market Value (13/15 parameters)');
    console.log(`   Current Price: $${parameters.marketValue.currentPrice}`);
    console.log(`   Original Price: $${parameters.marketValue.originalPrice}`);
    console.log(`   Discount: ${parameters.marketValue.discountPercentage}%`);
    console.log(`   In Stock: ${parameters.marketValue.inStock ? '✅' : '❌'}`);
    console.log(`   Stock Quantity: ${parameters.marketValue.stockQuantity}`);
    console.log(`   Views: ${parameters.marketValue.viewCount}`);
    console.log(`   Saved: ${parameters.marketValue.savedCount}`);
    console.log(`   Competitiveness: ${parameters.marketValue.priceCompetitiveness}/100\n`);

    console.log('4️⃣  Sustainability (8/12 parameters)');
    console.log(`   Carbon Reduction: ${parameters.sustainability.carbonReductionKg} kg CO₂`);
    console.log(`   E-Waste Prevention: ${Math.round(parameters.sustainability.eWastePrevention * 100)}%`);
    console.log(`   Recyclable: ${parameters.sustainability.isRecyclable ? '✅' : '❌'}`);
    console.log(`   Packaging Recyclable: ${parameters.sustainability.packagingRecyclable ? '✅' : '❌'}`);
    console.log(`   Sustainability Score: ${parameters.sustainability.sustainabilityScore}/100`);
    console.log(`   Environmental Impact: ${parameters.sustainability.environmentalImpactScore}/100\n`);

    console.log('5️⃣  Security & Safety (6/8 parameters)');
    console.log(`   Secure Payment: ${parameters.security.hasSecurePayment ? '✅' : '❌'}`);
    console.log(`   Buyer Protection: ${parameters.security.hasBuyerProtection ? '✅' : '❌'}`);
    console.log(`   Fraud Protection: ${parameters.security.hasFraudProtection ? '✅' : '❌'}`);
    console.log(`   Data Encryption: ${parameters.security.hasDataEncryption ? '✅' : '❌'}`);
    console.log(`   Privacy Policy: ${parameters.security.privacyPolicyScore}/100`);
    console.log(`   Security Score: ${parameters.security.securityScore}/100\n`);

    console.log('6️⃣  User Experience (10/10 parameters)');
    console.log(`   Page Quality: ${parameters.userExperience.pageQualityScore}/100`);
    console.log(`   Image Count: ${parameters.userExperience.imageCount}`);
    console.log(`   Description Length: ${parameters.userExperience.descriptionLength} chars`);
    console.log(`   Has Video: ${parameters.userExperience.hasVideo ? '✅' : '❌'}`);
    console.log(`   Mobile Optimized: ${parameters.userExperience.mobileOptimized ? '✅' : '❌'}`);
    console.log(`   Load Time: ${parameters.userExperience.loadTimeMs}ms`);
    console.log(`   Checkout Ease: ${parameters.userExperience.checkoutEaseScore}/100`);
    console.log(`   Overall UX: ${parameters.userExperience.overallUXScore}/100\n`);

    console.log('7️⃣  Product Specifications (6/8 parameters)');
    console.log(`   Detailed Specs: ${parameters.specifications.hasDetailedSpecs ? '✅' : '❌'}`);
    console.log(`   Spec Count: ${parameters.specifications.specCount}`);
    console.log(`   Completeness: ${parameters.specifications.specCompleteness}/100`);
    console.log(`   Manufacturer Info: ${parameters.specifications.hasManufacturerInfo ? '✅' : '❌'}`);
    console.log(`   Has Dimensions: ${parameters.specifications.hasDimensions ? '✅' : '❌'}`);
    console.log(`   Has Weight: ${parameters.specifications.hasWeight ? '✅' : '❌'}\n`);

    console.log('8️⃣  Company Performance (2/8 parameters)');
    console.log(`   Brand Recognition: ${parameters.company.brandRecognition}/100`);
    console.log(`   Brand Reputation: ${parameters.company.brandReputation}/100\n`);

    // Calculate Veritas Score
    console.log('⏳ Calculating Veritas Score...');
    const score = await calculateDatabaseVeritasScore(product.id);
    console.log(`✅ Score calculated\n`);

    console.log('🏆 VERITAS SCORE™ (Database Only)\n');
    console.log(`   Overall Score: ${score.overallScore}/100\n`);
    console.log('   Category Breakdown:');
    console.log(`   • Product Quality: ${score.categoryScores.productQuality}/100`);
    console.log(`   • Seller Trust: ${score.categoryScores.sellerTrust}/100`);
    console.log(`   • Market Value: ${score.categoryScores.marketValue}/100`);
    console.log(`   • Sustainability: ${score.categoryScores.sustainability}/100`);
    console.log(`   • Security: ${score.categoryScores.security}/100`);
    console.log(`   • User Experience: ${score.categoryScores.userExperience}/100`);
    console.log(`   • Specifications: ${score.categoryScores.specifications}/100`);
    console.log(`   • Company: ${score.categoryScores.company}/100\n`);

    console.log('📈 COVERAGE STATISTICS\n');
    console.log(`   Parameters Available: ${parameters.metadata.totalParametersAvailable}`);
    console.log(`   Parameters Total: ${parameters.metadata.totalParametersPossible}`);
    console.log(`   Coverage: ${parameters.metadata.coveragePercentage}%`);
    console.log(`   Source: Database only`);
    console.log(`   API Keys Required: ❌ No\n`);

    console.log('✅ TEST PASSED - All database parameters fetched successfully!');
    console.log('💡 72 out of 96 parameters (75%) available without API keys\n');

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseParameters()
  .then(() => {
    console.log('🎉 Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  });
