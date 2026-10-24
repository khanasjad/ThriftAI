'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, TrendingDown, Zap, Award, BarChart3, Shield, Package } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

export default function Home() {
  return (
    <AppLayout>
      <div className="bg-white">
        {/* Hero Section - Constructor Style: 78px heading, 100px/80px padding */}
        <section className="py-[30px] px-[30px] lg:py-25 lg:px-20 bg-white">
          <div className="max-w-[1280px] mx-auto">
            <div className="max-w-5xl">
              {/* 78px desktop, 42px mobile - EXACT Constructor measurements */}
              <h1 className="text-[42px] lg:text-[78px] font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
                AI-powered quality scoring for modern DTC brands
              </h1>

              <p className="text-xl lg:text-2xl text-gray-600 mb-10 leading-relaxed max-w-4xl">
                Reduce returns by 25% with comprehensive product analysis across 27 quality factors
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/pilot"
                  className="inline-flex items-center justify-center px-6 py-3 bg-violet-600 text-white text-base font-semibold rounded hover:bg-violet-700 transition-colors"
                >
                  Start Free Pilot
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 text-base font-semibold rounded border-2 border-gray-900 hover:bg-gray-50 transition-colors"
                >
                  View Live Demo
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-600" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-600" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 80px margin between sections */}
        <div className="h-20"></div>

        {/* Stats Bar - Light blue background like Constructor */}
        <section className="py-[30px] px-[30px] lg:py-20 lg:px-20 bg-constructor-blue">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div>
                <div className="text-5xl font-bold text-gray-900 mb-2">15-25%</div>
                <div className="text-base text-gray-700">Average return reduction</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-gray-900 mb-2">&lt;2s</div>
                <div className="text-base text-gray-700">API response time</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-gray-900 mb-2">27</div>
                <div className="text-base text-gray-700">Quality factors analyzed</div>
              </div>
            </div>
          </div>
        </section>

        {/* 80px margin */}
        <div className="h-20"></div>

        {/* Features Section - White background, Constructor spacing */}
        <section className="py-[30px] px-[30px] lg:py-25 lg:px-20 bg-white">
          <div className="max-w-[1280px] mx-auto">
            <div className="mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Everything you need to improve product quality
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                Comprehensive analysis powered by advanced AI models
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-12">
              <div>
                <div className="w-12 h-12 bg-violet-600 rounded flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  AI-Powered Scoring
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  27-factor analysis across fit, quality, style, comfort, and sustainability. Powered by advanced AI models trained on millions of reviews.
                </p>
              </div>

              <div>
                <div className="w-12 h-12 bg-violet-600 rounded flex items-center justify-center mb-4">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Reduce Returns
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Identify quality issues before they impact customers. 15-25% average return reduction in pilot programs with actionable insights.
                </p>
              </div>

              <div>
                <div className="w-12 h-12 bg-violet-600 rounded flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Real-Time API
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Integrate quality scores directly into your product pages. Sub-2-second response times with 99.9% uptime guarantee.
                </p>
              </div>

              <div>
                <div className="w-12 h-12 bg-violet-600 rounded flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Seller Verification
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Deep analysis of seller trustworthiness, ratings history, and credibility across platforms to protect your customers.
                </p>
              </div>

              <div>
                <div className="w-12 h-12 bg-violet-600 rounded flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Quality Insights
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Product condition scoring, authenticity verification, and comprehensive quality assessment for informed decisions.
                </p>
              </div>

              <div>
                <div className="w-12 h-12 bg-violet-600 rounded flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Sustainability Metrics
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Environmental impact scores, carbon footprint analysis, and circular economy insights for eco-conscious shopping.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 100px margin */}
        <div className="h-25"></div>

        {/* How It Works - Light blue background */}
        <section className="py-[30px] px-[30px] lg:py-25 lg:px-20 bg-constructor-blue">
          <div className="max-w-[1280px] mx-auto">
            <div className="mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Simple integration
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                Get started in minutes, not weeks
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div>
                <div className="text-6xl font-bold text-violet-600 mb-6">01</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Connect Your Data
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Upload your product catalog and customer reviews via API or CSV import
                </p>
              </div>

              <div>
                <div className="text-6xl font-bold text-violet-600 mb-6">02</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  AI Analysis
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Our AI analyzes every review across 27 quality factors automatically
                </p>
              </div>

              <div>
                <div className="text-6xl font-bold text-violet-600 mb-6">03</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Get Insights
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Receive actionable quality scores and recommendations in real-time
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 80px margin */}
        <div className="h-20"></div>

        {/* Testimonial */}
        <section className="py-[30px] px-[30px] lg:py-20 lg:px-20 bg-white">
          <div className="max-w-[1280px] mx-auto">
            <div className="bg-violet-600 rounded-lg py-12 px-8 lg:py-16 lg:px-12">
              <div className="max-w-4xl">
                <div className="text-2xl lg:text-3xl font-bold text-white mb-6 leading-relaxed">
                  "Veritas AI helped us reduce returns by 23% in just 8 weeks. The quality insights are invaluable for our product development team."
                </div>
                <div className="text-base text-violet-100">
                  — Leading DTC Fashion Brand
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 80px margin */}
        <div className="h-20"></div>

        {/* CTA Section - Dark background like Constructor */}
        <section className="py-[30px] px-[30px] lg:py-25 lg:px-20 bg-constructor-dark">
          <div className="max-w-[1280px] mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to reduce returns by 25%?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
              Join leading DTC brands using Veritas AI to transform product quality
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pilot"
                className="inline-flex items-center justify-center px-6 py-3 bg-violet-600 text-white text-base font-semibold rounded hover:bg-violet-700 transition-colors"
              >
                Start Your Free Pilot
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 bg-transparent text-white text-base font-semibold rounded border-2 border-white hover:bg-white hover:text-gray-900 transition-colors"
              >
                View Dashboard
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Full API access</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
