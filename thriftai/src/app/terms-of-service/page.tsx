'use client'

import React from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { FileText, AlertTriangle, Scale, ShieldCheck } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="App">
      <Navigation
        user={null}
        onShowLogin={() => {}}
        onShowSignup={() => {}}
        onLogout={() => {}}
      />

      <main className="container mx-auto px-4 py-8" style={{ maxWidth: '900px', minHeight: 'calc(100vh - 200px)' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-blue-600" />
          <h1 className="page-header mb-3">Terms of Service</h1>
          <p className="page-subtitle">Last Updated: October 20, 2025</p>
        </div>

        {/* Introduction */}
        <div className="mb-8 p-6 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <p className="text-primary mb-3" style={{ lineHeight: '1.7' }}>
            Welcome to ThriftAI (Veritas.ai). These Terms of Service ("Terms") govern your access to and use of our platform, including our website, mobile applications, and services.
          </p>
          <p className="text-secondary" style={{ lineHeight: '1.7' }}>
            By accessing or using ThriftAI, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
          </p>
        </div>

        {/* Section 1: Acceptance of Terms */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-green-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">1. Acceptance of Terms</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary" style={{ lineHeight: '1.7' }}>
              By creating an account, making a purchase, or otherwise using ThriftAI, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. These Terms constitute a legally binding agreement between you and ThriftAI Inc.
            </p>
          </div>
        </section>

        {/* Section 2: Eligibility */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">2. Eligibility</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary mb-3" style={{ lineHeight: '1.7' }}>
              To use ThriftAI, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-secondary" style={{ lineHeight: '1.7' }}>
              <li>Be at least 18 years of age or the age of majority in your jurisdiction</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the service under applicable laws</li>
              <li>Provide accurate and complete registration information</li>
            </ul>
          </div>
        </section>

        {/* Section 3: User Accounts */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">3. User Accounts</h2>
          </div>

          <div className="ml-9 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">3.1 Account Creation</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                You must create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">3.2 Account Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 text-secondary" style={{ lineHeight: '1.7' }}>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Not share your account with others</li>
                <li>Not create multiple accounts for the same person</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">3.3 Account Termination</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                We reserve the right to suspend or terminate your account at any time for violations of these Terms, fraudulent activity, or for any other reason at our sole discretion.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Prohibited Activities */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">4. Prohibited Activities</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary mb-3" style={{ lineHeight: '1.7' }}>
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-secondary" style={{ lineHeight: '1.7' }}>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights of others</li>
              <li>Transmit viruses, malware, or malicious code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use automated tools (bots, scrapers) without permission</li>
              <li>Engage in fraudulent transactions or chargebacks</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate another person or entity</li>
              <li>Post false, misleading, or defamatory content</li>
              <li>Use the platform for commercial purposes without authorization</li>
            </ul>
          </div>
        </section>

        {/* Section 5: Product Listings and Purchases */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">5. Product Listings and Purchases</h2>
          </div>

          <div className="ml-9 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">5.1 Product Information</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                We strive to provide accurate product descriptions, pricing, and availability. However, we do not guarantee that all information is error-free, complete, or current. We reserve the right to correct errors and update information at any time.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">5.2 Pricing</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                All prices are displayed in USD unless otherwise stated. Prices are subject to change without notice. We reserve the right to cancel orders if a pricing error occurs.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">5.3 Orders and Payment</h3>
              <p className="text-secondary mb-2" style={{ lineHeight: '1.7' }}>
                By placing an order, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-secondary" style={{ lineHeight: '1.7' }}>
                <li>Pay the total amount including taxes and shipping</li>
                <li>Provide accurate billing and shipping information</li>
                <li>Accept that orders are subject to availability</li>
                <li>Acknowledge that order confirmation does not guarantee acceptance</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">5.4 Returns and Refunds</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                Our return and refund policy is available separately. Generally, you may return items within 30 days of receipt in original condition for a full refund, subject to restocking fees for certain items.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Intellectual Property */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">6. Intellectual Property</h2>
          </div>

          <div className="ml-9 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">6.1 Our Content</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                All content on ThriftAI, including text, graphics, logos, icons, images, audio clips, video, software, and data compilations, is the property of ThriftAI or its content suppliers and is protected by copyright, trademark, and other intellectual property laws.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">6.2 Limited License</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                We grant you a limited, non-exclusive, non-transferable license to access and use the platform for personal, non-commercial purposes. You may not reproduce, distribute, modify, or create derivative works without our prior written consent.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">6.3 Trademarks</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                "ThriftAI," "Veritas.ai," and all related logos are trademarks of ThriftAI Inc. You may not use these marks without our express written permission.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: AI Features and Veritas Score */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-green-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">7. AI Features and Veritas Score</h2>
          </div>

          <div className="ml-9 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">7.1 AI-Powered Recommendations</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                Our platform uses artificial intelligence to provide personalized product recommendations and search results. These recommendations are based on various factors including user behavior, product attributes, and historical data.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">7.2 Veritas Score</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                The Veritas Score is an AI-generated quality rating based on 96+ parameters including product condition, seller reputation, price competitiveness, and brand value. This score is provided as a guide only and should not be the sole basis for purchasing decisions.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">7.3 Voice Assistant ("Gus")</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                Our voice assistant feature uses speech recognition and natural language processing to help you shop. Voice inputs are processed in real-time and may be analyzed to improve service quality. You can disable voice features at any time in your settings.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">7.4 No Guarantees</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                While we strive for accuracy, AI-generated content may contain errors or inaccuracies. We do not guarantee the accuracy, completeness, or reliability of AI-generated recommendations, scores, or content.
              </p>
            </div>
          </div>
        </section>

        {/* Section 8: Disclaimers and Limitations of Liability */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">8. Disclaimers and Limitations of Liability</h2>
          </div>

          <div className="ml-9 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">8.1 "As Is" Disclaimer</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">8.2 Limitation of Liability</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, THRIFTAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">8.3 Maximum Liability</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                Our total liability to you for all claims arising from or related to the platform shall not exceed the amount you paid us in the 12 months preceding the claim, or $100, whichever is greater.
              </p>
            </div>
          </div>
        </section>

        {/* Section 9: Indemnification */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">9. Indemnification</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary" style={{ lineHeight: '1.7' }}>
              You agree to indemnify, defend, and hold harmless ThriftAI, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from: (a) your use of the platform, (b) your violation of these Terms, (c) your violation of any rights of another party, or (d) any content you submit or transmit through the platform.
            </p>
          </div>
        </section>

        {/* Section 10: Dispute Resolution */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">10. Dispute Resolution</h2>
          </div>

          <div className="ml-9 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">10.1 Informal Resolution</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                Before filing a formal claim, you agree to contact us at support@thriftai.com to seek an informal resolution.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">10.2 Arbitration</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                Any dispute that cannot be resolved informally shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall take place in San Francisco, California.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">10.3 Class Action Waiver</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                You agree to resolve disputes on an individual basis only. You waive any right to participate in a class action lawsuit or class-wide arbitration.
              </p>
            </div>
          </div>
        </section>

        {/* Section 11: Governing Law */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-6 h-6 text-green-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">11. Governing Law</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary" style={{ lineHeight: '1.7' }}>
              These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions. You agree to submit to the exclusive jurisdiction of the courts located in San Francisco County, California.
            </p>
          </div>
        </section>

        {/* Section 12: Changes to Terms */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">12. Changes to These Terms</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary" style={{ lineHeight: '1.7' }}>
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting a notice on our platform or sending you an email. Your continued use of the platform after such modifications constitutes your acceptance of the updated Terms. If you do not agree with the changes, you must stop using the platform.
            </p>
          </div>
        </section>

        {/* Section 13: Severability */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">13. Severability</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary" style={{ lineHeight: '1.7' }}>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-8 p-6 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">Contact Us</h2>
          </div>

          <p className="text-secondary mb-3" style={{ lineHeight: '1.7' }}>
            If you have any questions about these Terms of Service, please contact us:
          </p>

          <div className="space-y-2 text-secondary" style={{ lineHeight: '1.7' }}>
            <p><strong>Email:</strong> legal@thriftai.com</p>
            <p><strong>Support:</strong> support@thriftai.com</p>
            <p><strong>Address:</strong> ThriftAI Inc., 123 Innovation Drive, San Francisco, CA 94105</p>
          </div>
        </section>

        {/* Back to Home Button */}
        <div className="text-center">
          <a
            href="/"
            className="btn-modern-primary inline-flex items-center justify-center"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            Back to Home
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}
