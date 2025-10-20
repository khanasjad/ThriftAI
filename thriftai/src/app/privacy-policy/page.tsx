'use client'

import React from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Shield, Lock, Eye, Database, Cookie, Mail } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
          <Shield className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-purple-600" />
          <h1 className="page-header mb-3">Privacy Policy</h1>
          <p className="page-subtitle">Last Updated: October 20, 2025</p>
        </div>

        {/* Introduction */}
        <div className="mb-8 p-6 rounded-xl" style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
          <p className="text-primary mb-3" style={{ lineHeight: '1.7' }}>
            At ThriftAI (Veritas.ai), we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>
          <p className="text-secondary" style={{ lineHeight: '1.7' }}>
            By using ThriftAI, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies, please do not use our service.
          </p>
        </div>

        {/* Section 1: Information We Collect */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">1. Information We Collect</h2>
          </div>

          <div className="space-y-4 ml-9">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">1.1 Personal Information</h3>
              <p className="text-secondary mb-2" style={{ lineHeight: '1.7' }}>
                We collect personal information that you voluntarily provide when you:
              </p>
              <ul className="list-disc list-inside space-y-2 text-secondary" style={{ lineHeight: '1.7' }}>
                <li>Register for an account (name, email address, password)</li>
                <li>Make a purchase (billing address, shipping address, payment information)</li>
                <li>Contact customer support (email, messages)</li>
                <li>Subscribe to our newsletter</li>
                <li>Participate in surveys or promotions</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">1.2 Usage Data</h3>
              <p className="text-secondary mb-2" style={{ lineHeight: '1.7' }}>
                We automatically collect certain information when you access our platform:
              </p>
              <ul className="list-disc list-inside space-y-2 text-secondary" style={{ lineHeight: '1.7' }}>
                <li>IP address, browser type, and operating system</li>
                <li>Pages visited, time spent on pages, and navigation paths</li>
                <li>Search queries and product interactions</li>
                <li>Device information and unique identifiers</li>
                <li>Referring website and exit pages</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">1.3 Voice Data</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                When you use our voice assistant feature ("Gus"), we process your voice input to provide AI-powered shopping assistance. Voice data is processed in real-time and is not stored permanently unless you opt-in to improve our services.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: How We Use Your Information */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-green-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">2. How We Use Your Information</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary mb-3" style={{ lineHeight: '1.7' }}>
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-secondary" style={{ lineHeight: '1.7' }}>
              <li><strong>Provide Services:</strong> Process orders, manage accounts, and deliver customer support</li>
              <li><strong>Personalization:</strong> Customize product recommendations using AI scoring algorithms</li>
              <li><strong>Communication:</strong> Send order confirmations, updates, and promotional materials (with your consent)</li>
              <li><strong>Analytics:</strong> Analyze usage patterns to improve platform performance and user experience</li>
              <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security incidents</li>
              <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our terms of service</li>
            </ul>
          </div>
        </section>

        {/* Section 3: Cookies and Tracking */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">3. Cookies and Tracking Technologies</h2>
          </div>

          <div className="ml-9 space-y-4">
            <p className="text-secondary" style={{ lineHeight: '1.7' }}>
              We use cookies and similar tracking technologies to track activity on our platform and store certain information. Types of cookies we use:
            </p>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Essential Cookies</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                Required for the platform to function properly (e.g., authentication, shopping cart). These cannot be disabled.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Analytics Cookies</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                Help us understand how visitors interact with our platform. You can opt-out via our cookie consent banner.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Preference Cookies</h3>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                Remember your settings and preferences (e.g., language, currency, theme).
              </p>
            </div>

            <p className="text-secondary" style={{ lineHeight: '1.7' }}>
              You can manage cookie preferences through your browser settings or our cookie consent banner.
            </p>
          </div>
        </section>

        {/* Section 4: Data Sharing */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-red-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">4. How We Share Your Information</h2>
          </div>

          <div className="ml-9 space-y-3">
            <p className="text-secondary" style={{ lineHeight: '1.7' }}>
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-secondary" style={{ lineHeight: '1.7' }}>
              <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (payment processing, shipping, analytics)</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale</li>
              <li><strong>Legal Requirements:</strong> When required by law, subpoena, or to protect our rights and safety</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
            </ul>
          </div>
        </section>

        {/* Section 5: Data Security */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">5. Data Security</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary mb-3" style={{ lineHeight: '1.7' }}>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-secondary" style={{ lineHeight: '1.7' }}>
              <li>Encryption of data in transit (SSL/TLS) and at rest</li>
              <li>Secure password hashing using bcrypt</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication protocols</li>
              <li>Employee training on data protection practices</li>
            </ul>
            <p className="text-secondary mt-3" style={{ lineHeight: '1.7' }}>
              However, no method of transmission over the Internet is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
            </p>
          </div>
        </section>

        {/* Section 6: Your Rights */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">6. Your Privacy Rights</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary mb-3" style={{ lineHeight: '1.7' }}>
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-2 text-secondary" style={{ lineHeight: '1.7' }}>
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Objection:</strong> Object to processing of your personal information</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing at any time</li>
            </ul>
            <p className="text-secondary mt-3" style={{ lineHeight: '1.7' }}>
              To exercise these rights, please contact us at privacy@thriftai.com
            </p>
          </div>
        </section>

        {/* Section 7: GDPR Compliance */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-green-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">7. GDPR Compliance (EU Users)</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary mb-3" style={{ lineHeight: '1.7' }}>
              If you are located in the European Economic Area (EEA), you have additional rights under GDPR:
            </p>
            <ul className="list-disc list-inside space-y-2 text-secondary" style={{ lineHeight: '1.7' }}>
              <li>Right to be informed about data collection and processing</li>
              <li>Right to restrict processing of your personal data</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
              <li>Right to data portability in a machine-readable format</li>
            </ul>
            <p className="text-secondary mt-3" style={{ lineHeight: '1.7' }}>
              Our legal basis for processing your data: consent, contract performance, legal obligation, and legitimate interests.
            </p>
          </div>
        </section>

        {/* Section 8: Children's Privacy */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-red-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">8. Children's Privacy</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary" style={{ lineHeight: '1.7' }}>
              Our platform is not intended for users under the age of 18. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us immediately, and we will take steps to delete such information.
            </p>
          </div>
        </section>

        {/* Section 9: International Data Transfers */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">9. International Data Transfers</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary" style={{ lineHeight: '1.7' }}>
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure appropriate safeguards are in place through standard contractual clauses approved by the European Commission.
            </p>
          </div>
        </section>

        {/* Section 10: Changes to This Policy */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">10. Changes to This Privacy Policy</h2>
          </div>

          <div className="ml-9">
            <p className="text-secondary" style={{ lineHeight: '1.7' }}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically for any changes. Continued use of the platform after changes constitutes acceptance of the updated policy.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-8 p-6 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl md:text-2xl font-bold text-primary">Contact Us</h2>
          </div>

          <p className="text-secondary mb-3" style={{ lineHeight: '1.7' }}>
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>

          <div className="space-y-2 text-secondary" style={{ lineHeight: '1.7' }}>
            <p><strong>Email:</strong> privacy@thriftai.com</p>
            <p><strong>Data Protection Officer:</strong> dpo@thriftai.com</p>
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
