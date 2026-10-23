/**
 * Financial Value Agent
 *
 * Calculates total cost of ownership (TCO) and long-term financial value
 * Per Veritas.AI specification: analyzes true cost beyond purchase price
 *
 * Key Metrics:
 * 1. Total Cost of Ownership (TCO): price + shipping + tax + repairs + accessories
 * 2. Cost-per-year: TCO / expected lifespan
 * 3. Resale value: Estimated value after typical ownership period
 * 4. Warranty value: Reduction in repair costs from warranty coverage
 *
 * Scoring Logic:
 * - Lower TCO relative to category = higher score
 * - Lower cost-per-year = higher score
 * - Higher resale value retention = higher score
 * - Better warranty coverage = higher score
 */

import { DeterministicBaseAgent, type ProductInput } from '../DeterministicBaseAgent';
import type { AgentResult } from '../types';
import type { VeritasAgentResult, VeritasProductInput } from '../veritasTypes';

interface CategoryLifespan {
  category: string;
  expectedYears: number;
  depreciationRate: number; // Annual depreciation %
  repairCostPerYear: number; // Average repair cost per year
}

interface TCOBreakdown {
  purchasePrice: number;
  shippingCost: number;
  estimatedTax: number;
  expectedRepairs: number;
  accessories: number;
  total: number;
}

interface FinancialMetrics {
  tco: TCOBreakdown;
  lifespan: number;
  costPerYear: number;
  resaleValue: number;
  resaleRetention: number; // Percentage of original price retained
  warrantyValue: number;
  netCost: number; // TCO - resale value
}

export class FinancialValueAgent extends DeterministicBaseAgent {
  readonly name = 'FinancialValueAgent';
  readonly weight = 0.10; // 10% weight in final score
  readonly description = 'Analyzes total cost of ownership and long-term financial value';
  readonly version = 'v1.0';

  // Category-specific lifespan and depreciation data
  private readonly categoryData: Record<string, CategoryLifespan> = {
    'Electronics': {
      category: 'Electronics',
      expectedYears: 3,
      depreciationRate: 0.30, // 30% per year
      repairCostPerYear: 50
    },
    'Smartphones': {
      category: 'Smartphones',
      expectedYears: 2.5,
      depreciationRate: 0.35,
      repairCostPerYear: 75
    },
    'Laptops': {
      category: 'Laptops',
      expectedYears: 4,
      depreciationRate: 0.25,
      repairCostPerYear: 100
    },
    'Tablets': {
      category: 'Tablets',
      expectedYears: 3,
      depreciationRate: 0.30,
      repairCostPerYear: 40
    },
    'Watches': {
      category: 'Watches',
      expectedYears: 10,
      depreciationRate: 0.10,
      repairCostPerYear: 20
    },
    'Clothing': {
      category: 'Clothing',
      expectedYears: 2,
      depreciationRate: 0.50,
      repairCostPerYear: 10
    },
    'Shoes': {
      category: 'Shoes',
      expectedYears: 2,
      depreciationRate: 0.40,
      repairCostPerYear: 15
    },
    'Furniture': {
      category: 'Furniture',
      expectedYears: 10,
      depreciationRate: 0.15,
      repairCostPerYear: 30
    },
    'Appliances': {
      category: 'Appliances',
      expectedYears: 8,
      depreciationRate: 0.15,
      repairCostPerYear: 60
    },
    'General': {
      category: 'General',
      expectedYears: 3,
      depreciationRate: 0.25,
      repairCostPerYear: 30
    }
  };

  // Brand retention multipliers (luxury brands hold value better)
  private readonly brandRetention: Record<string, number> = {
    'Apple': 0.85,
    'Sony': 0.75,
    'Samsung': 0.70,
    'Rolex': 0.95,
    'Nike': 0.65,
    'Adidas': 0.60,
    'Herman Miller': 0.80,
    'Default': 0.50
  };

  /**
   * Legacy analyze method
   */
  async analyze(product: ProductInput): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const metrics = this.calculateFinancialMetrics({
        id: product.id,
        name: product.name,
        price: product.price,
        brand: product.brand,
        category: product.category,
        condition: product.condition,
        quality_signals: {
          warranty_included: product.metadata?.warranty ? true : false,
          shipping_cost: product.metadata?.shippingCost || 0
        }
      });

      const score = this.calculateScore(metrics);
      const reasoning = this.generateReasoning(metrics);

      return this.createResult(
        score,
        0.80,
        reasoning,
        { metrics },
        Date.now() - startTime
      );
    } catch (error) {
      this.log('error', 'Financial value analysis failed', {
        productId: product.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return this.createResult(
        50,
        0.3,
        'Unable to calculate financial value',
        { error: true },
        Date.now() - startTime,
        ['Financial analysis unavailable']
      );
    }
  }

  /**
   * Veritas-compliant analysis method
   */
  async analyzeVeritas(product: VeritasProductInput): Promise<VeritasAgentResult> {
    const startTime = Date.now();

    try {
      // Calculate comprehensive financial metrics
      const metrics = this.calculateFinancialMetrics(product);

      // Calculate score based on financial value
      const score = this.calculateScore(metrics);

      // Generate evidence
      const evidence = this.generateEvidence(metrics, product);

      // Generate flags
      const flags = this.generateFlags(metrics);

      // Calculate confidence
      const confidence = this.calculateConfidence(product);

      const processingTime = Date.now() - startTime;

      this.log('info', 'Financial value analysis completed', {
        productId: product.id,
        score,
        costPerYear: metrics.costPerYear,
        tco: metrics.tco.total
      });

      return this.createVeritasResult(
        product.id,
        score,
        confidence,
        evidence,
        flags,
        {
          processing_time_ms: processingTime,
          data_sources: ['category_database', 'brand_database'],
          tco_breakdown: metrics.tco,
          cost_per_year: metrics.costPerYear,
          resale_value: metrics.resaleValue,
          resale_retention: metrics.resaleRetention,
          warranty_value: metrics.warrantyValue,
          net_cost: metrics.netCost,
          lifespan_years: metrics.lifespan
        }
      );

    } catch (error) {
      this.log('error', 'Financial value analysis failed', {
        productId: product.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return this.createVeritasResult(
        product.id,
        50,
        0.3,
        ['Unable to calculate financial value - insufficient data'],
        ['ANALYSIS_FAILED'],
        {
          processing_time_ms: Date.now() - startTime,
          fallback_used: true,
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }

  /**
   * Calculate comprehensive financial metrics
   */
  private calculateFinancialMetrics(product: VeritasProductInput): FinancialMetrics {
    // Get category-specific data
    const categoryInfo = this.getCategoryInfo(product.category);

    // Calculate TCO components
    const tco = this.calculateTCO(product, categoryInfo);

    // Adjust lifespan based on condition
    const lifespan = this.adjustLifespanForCondition(
      categoryInfo.expectedYears,
      product.condition
    );

    // Calculate cost per year
    const costPerYear = tco.total / lifespan;

    // Estimate resale value
    const resaleValue = this.estimateResaleValue(
      product.price,
      product.brand,
      product.category,
      product.condition,
      categoryInfo
    );

    const resaleRetention = (resaleValue / product.price) * 100;

    // Calculate warranty value
    const warrantyValue = this.calculateWarrantyValue(
      product,
      categoryInfo,
      lifespan
    );

    // Net cost = TCO - resale value
    const netCost = tco.total - resaleValue;

    return {
      tco,
      lifespan,
      costPerYear,
      resaleValue,
      resaleRetention,
      warrantyValue,
      netCost
    };
  }

  /**
   * Calculate Total Cost of Ownership
   */
  private calculateTCO(
    product: VeritasProductInput,
    categoryInfo: CategoryLifespan
  ): TCOBreakdown {
    const purchasePrice = product.price;

    // Shipping cost
    const shippingCost = product.quality_signals?.shipping_cost ||
                        this.estimateShippingCost(product.price, product.category);

    // Estimated sales tax (average ~8%)
    const estimatedTax = purchasePrice * 0.08;

    // Expected repair costs over lifespan
    const lifespan = this.adjustLifespanForCondition(
      categoryInfo.expectedYears,
      product.condition
    );
    const expectedRepairs = categoryInfo.repairCostPerYear * lifespan;

    // Accessories (category-dependent)
    const accessories = this.estimateAccessoryCost(product.category, product.price);

    const total = purchasePrice + shippingCost + estimatedTax + expectedRepairs + accessories;

    return {
      purchasePrice,
      shippingCost,
      estimatedTax,
      expectedRepairs,
      accessories,
      total
    };
  }

  /**
   * Estimate resale value based on depreciation
   */
  private estimateResaleValue(
    purchasePrice: number,
    brand: string | undefined,
    category: string | undefined,
    condition: string | undefined,
    categoryInfo: CategoryLifespan
  ): number {
    // Start with purchase price
    let resaleValue = purchasePrice;

    // Apply category depreciation (assume typical ownership of 60% of lifespan)
    const ownershipPeriod = categoryInfo.expectedYears * 0.6;
    const totalDepreciation = categoryInfo.depreciationRate * ownershipPeriod;
    resaleValue *= (1 - totalDepreciation);

    // Apply brand retention multiplier
    const brandMultiplier = brand
      ? this.brandRetention[brand] || this.brandRetention['Default']
      : this.brandRetention['Default'];
    resaleValue *= brandMultiplier;

    // Adjust for condition
    const conditionMultiplier = this.getConditionMultiplier(condition);
    resaleValue *= conditionMultiplier;

    return Math.max(0, resaleValue);
  }

  /**
   * Calculate warranty value (reduces expected repair costs)
   */
  private calculateWarrantyValue(
    product: VeritasProductInput,
    categoryInfo: CategoryLifespan,
    lifespan: number
  ): number {
    const hasWarranty = product.quality_signals?.warranty_included || false;

    if (!hasWarranty) {
      return 0;
    }

    // Assume warranty covers first 1-2 years of repairs
    const warrantyCoverage = Math.min(2, lifespan);
    const repairsSaved = categoryInfo.repairCostPerYear * warrantyCoverage;

    return repairsSaved;
  }

  /**
   * Calculate score based on financial metrics
   */
  private calculateScore(metrics: FinancialMetrics): number {
    let score = 50; // Base score

    // Factor 1: Cost per year (40% of score)
    // Lower cost per year = higher score
    const costPerYearScore = this.scoreCostPerYear(metrics.costPerYear, metrics.tco.purchasePrice);
    score += (costPerYearScore - 50) * 0.4;

    // Factor 2: Resale retention (30% of score)
    // Higher resale retention = higher score
    const resaleScore = this.scoreResaleRetention(metrics.resaleRetention);
    score += (resaleScore - 50) * 0.3;

    // Factor 3: Net cost (20% of score)
    // Lower net cost = higher score
    const netCostScore = this.scoreNetCost(metrics.netCost, metrics.tco.purchasePrice);
    score += (netCostScore - 50) * 0.2;

    // Factor 4: Warranty bonus (10% of score)
    if (metrics.warrantyValue > 0) {
      score += 10;
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Score cost per year
   */
  private scoreCostPerYear(costPerYear: number, purchasePrice: number): number {
    const ratio = costPerYear / purchasePrice;

    // Excellent: < 30% per year (durable, long-lasting)
    if (ratio < 0.30) return 90;
    // Good: 30-40% per year
    if (ratio < 0.40) return 75;
    // Fair: 40-50% per year
    if (ratio < 0.50) return 60;
    // Poor: 50-70% per year
    if (ratio < 0.70) return 45;
    // Very poor: > 70% per year (high turnover items)
    return 30;
  }

  /**
   * Score resale retention
   */
  private scoreResaleRetention(retentionPercent: number): number {
    // Excellent: Retains > 60% value
    if (retentionPercent >= 60) return 90;
    // Good: 40-60%
    if (retentionPercent >= 40) return 75;
    // Fair: 25-40%
    if (retentionPercent >= 25) return 60;
    // Poor: 15-25%
    if (retentionPercent >= 15) return 45;
    // Very poor: < 15%
    return 30;
  }

  /**
   * Score net cost
   */
  private scoreNetCost(netCost: number, purchasePrice: number): number {
    const ratio = netCost / purchasePrice;

    // Excellent: Net cost < 80% of purchase (good resale value)
    if (ratio < 0.80) return 90;
    // Good: 80-100%
    if (ratio < 1.00) return 75;
    // Fair: 100-120%
    if (ratio < 1.20) return 60;
    // Poor: 120-150%
    if (ratio < 1.50) return 45;
    // Very poor: > 150%
    return 30;
  }

  /**
   * Generate evidence array
   */
  private generateEvidence(metrics: FinancialMetrics, product: VeritasProductInput): string[] {
    const evidence: string[] = [];

    // Overall TCO
    evidence.push(
      `Total cost of ownership: $${metrics.tco.total.toFixed(2)} over ${metrics.lifespan} years`
    );

    // Cost per year
    evidence.push(
      `Cost per year: $${metrics.costPerYear.toFixed(2)} (${this.getCostPerYearAssessment(metrics.costPerYear, product.price)})`
    );

    // TCO breakdown
    const breakdown = [
      `Purchase: $${metrics.tco.purchasePrice.toFixed(2)}`,
      `Shipping: $${metrics.tco.shippingCost.toFixed(2)}`,
      `Tax: $${metrics.tco.estimatedTax.toFixed(2)}`,
      `Repairs: $${metrics.tco.expectedRepairs.toFixed(2)}`,
      `Accessories: $${metrics.tco.accessories.toFixed(2)}`
    ];
    evidence.push(`Breakdown: ${breakdown.join(', ')}`);

    // Resale value
    evidence.push(
      `Estimated resale value: $${metrics.resaleValue.toFixed(2)} (${metrics.resaleRetention.toFixed(1)}% retention)`
    );

    // Net cost
    evidence.push(
      `Net cost after resale: $${metrics.netCost.toFixed(2)}`
    );

    // Warranty
    if (metrics.warrantyValue > 0) {
      evidence.push(
        `Warranty saves $${metrics.warrantyValue.toFixed(2)} in repair costs`
      );
    }

    // Value assessment
    const valueAssessment = this.getOverallValueAssessment(metrics);
    evidence.push(valueAssessment);

    return evidence;
  }

  /**
   * Generate warning flags
   */
  private generateFlags(metrics: FinancialMetrics): string[] {
    const flags: string[] = [];

    // High cost per year
    const costPerYearRatio = metrics.costPerYear / metrics.tco.purchasePrice;
    if (costPerYearRatio > 0.70) {
      flags.push('HIGH_COST_PER_YEAR');
    }

    // Poor resale retention
    if (metrics.resaleRetention < 20) {
      flags.push('POOR_RESALE_VALUE');
    }

    // High net cost
    const netCostRatio = metrics.netCost / metrics.tco.purchasePrice;
    if (netCostRatio > 1.50) {
      flags.push('HIGH_NET_COST');
    }

    // Low total value
    if (metrics.resaleRetention < 20 && costPerYearRatio > 0.60) {
      flags.push('LOW_FINANCIAL_VALUE');
    }

    return flags;
  }

  /**
   * Calculate confidence based on data availability
   */
  private calculateConfidence(product: VeritasProductInput): number {
    let confidence = 0.7; // Base

    if (product.brand) confidence += 0.1;
    if (product.category) confidence += 0.1;
    if (product.condition) confidence += 0.05;
    if (product.quality_signals?.warranty_included) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  /**
   * Helper: Get category info
   */
  private getCategoryInfo(category: string | undefined): CategoryLifespan {
    if (!category) {
      return this.categoryData['General'];
    }

    // Try exact match
    if (this.categoryData[category]) {
      return this.categoryData[category];
    }

    // Try partial match (e.g., "Electronics > Phones" → "Electronics")
    for (const key of Object.keys(this.categoryData)) {
      if (category.includes(key)) {
        return this.categoryData[key];
      }
    }

    return this.categoryData['General'];
  }

  /**
   * Helper: Adjust lifespan based on condition
   */
  private adjustLifespanForCondition(
    baseLifespan: number,
    condition: string | undefined
  ): number {
    if (!condition) return baseLifespan;

    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes('new')) return baseLifespan;
    if (conditionLower.includes('like-new') || conditionLower.includes('like new')) return baseLifespan * 0.95;
    if (conditionLower.includes('good') || conditionLower.includes('excellent')) return baseLifespan * 0.85;
    if (conditionLower.includes('fair')) return baseLifespan * 0.70;
    if (conditionLower.includes('poor') || conditionLower.includes('parts')) return baseLifespan * 0.50;

    return baseLifespan * 0.80; // Default
  }

  /**
   * Helper: Get condition multiplier for resale
   */
  private getConditionMultiplier(condition: string | undefined): number {
    if (!condition) return 0.70;

    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes('new')) return 1.0;
    if (conditionLower.includes('like-new') || conditionLower.includes('like new')) return 0.90;
    if (conditionLower.includes('excellent')) return 0.85;
    if (conditionLower.includes('good')) return 0.75;
    if (conditionLower.includes('fair')) return 0.60;
    if (conditionLower.includes('poor')) return 0.40;
    if (conditionLower.includes('parts')) return 0.20;

    return 0.70;
  }

  /**
   * Helper: Estimate shipping cost
   */
  private estimateShippingCost(price: number, category: string | undefined): number {
    // Free shipping for high-value items
    if (price > 500) return 0;

    // Category-based estimates
    if (category?.toLowerCase().includes('furniture')) return 50;
    if (category?.toLowerCase().includes('appliances')) return 30;
    if (category?.toLowerCase().includes('electronics')) return 10;
    if (category?.toLowerCase().includes('clothing')) return 5;

    return 8; // Default
  }

  /**
   * Helper: Estimate accessory cost
   */
  private estimateAccessoryCost(category: string | undefined, price: number): number {
    if (!category) return 0;

    const categoryLower = category.toLowerCase();

    // Electronics often need accessories
    if (categoryLower.includes('phone')) return price * 0.10; // Case, screen protector
    if (categoryLower.includes('laptop')) return price * 0.05; // Mouse, bag
    if (categoryLower.includes('camera')) return price * 0.15; // Memory card, bag

    return 0;
  }

  /**
   * Helper: Get cost per year assessment
   */
  private getCostPerYearAssessment(costPerYear: number, purchasePrice: number): string {
    const ratio = costPerYear / purchasePrice;

    if (ratio < 0.30) return 'excellent long-term value';
    if (ratio < 0.40) return 'good long-term value';
    if (ratio < 0.50) return 'fair long-term value';
    if (ratio < 0.70) return 'moderate long-term value';
    return 'poor long-term value';
  }

  /**
   * Helper: Get overall value assessment
   */
  private getOverallValueAssessment(metrics: FinancialMetrics): string {
    const costRatio = metrics.costPerYear / metrics.tco.purchasePrice;
    const retention = metrics.resaleRetention;

    if (costRatio < 0.35 && retention > 50) {
      return '✅ Excellent financial value - low cost per year and strong resale retention';
    }
    if (costRatio < 0.45 && retention > 35) {
      return 'Good financial value - reasonable cost and decent resale value';
    }
    if (costRatio < 0.60 && retention > 20) {
      return 'Fair financial value - moderate cost with some resale value';
    }
    return '⚠️ Limited financial value - high cost per year and/or poor resale value';
  }

  /**
   * Generate reasoning (legacy)
   */
  private generateReasoning(metrics: FinancialMetrics): string {
    return this.getOverallValueAssessment(metrics);
  }

  /**
   * Override getPossibleFlags
   */
  protected getPossibleFlags(): string[] {
    return [
      'HIGH_COST_PER_YEAR',
      'POOR_RESALE_VALUE',
      'HIGH_NET_COST',
      'LOW_FINANCIAL_VALUE',
      'ANALYSIS_FAILED'
    ];
  }

  /**
   * Override getOptionalFields
   */
  protected getOptionalFields(): string[] {
    return [
      'brand',
      'category',
      'condition',
      'quality_signals.warranty_included',
      'quality_signals.shipping_cost'
    ];
  }
}
