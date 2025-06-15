import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - AI Content Repurposer Studio',
  description: 'Privacy Policy for AI Content Repurposer Studio',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">AI Content Studio</span>
            </Link>
            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: December 2024</p>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-6">
              AI Content Repurposer Studio ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our AI-powered content repurposing service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-4">We collect the following personal information:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Name and email address (for account creation and billing)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Company information (for Agency plan users)</li>
              <li>Support communications and feedback</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">2.2 Content Data</h3>
            <p className="text-gray-700 mb-6">
              We process the content you submit for repurposing, including text, titles, and any metadata. This content is temporarily processed by our AI systems and is not stored permanently unless you explicitly save it in your account.
            </p>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">2.3 Usage Data</h3>
            <p className="text-gray-700 mb-4">We automatically collect:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Service usage statistics (number of content repurposes, features used)</li>
              <li>Performance and error logs</li>
              <li>Device and browser information</li>
              <li>IP address and general location data</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Provide and improve our AI content repurposing services</li>
              <li>Process your content through AI models to generate repurposed versions</li>
              <li>Manage your subscription and billing</li>
              <li>Provide customer support</li>
              <li>Send important service updates and notifications</li>
              <li>Analyze usage patterns to improve our service</li>
              <li>Ensure security and prevent fraud</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. AI Processing and Data Handling</h2>
            <p className="text-gray-700 mb-4">
              Our service uses artificial intelligence to repurpose your content. Here's how we handle your data in this process:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Content is processed by AI models (including Anthropic's Claude) in real-time</li>
              <li>Original content and AI-generated outputs are temporarily cached for performance</li>
              <li>We do not use your content to train AI models</li>
              <li>Content is automatically deleted from temporary storage after processing</li>
              <li>Saved content in your account is encrypted and stored securely</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Sharing and Third Parties</h2>
            <p className="text-gray-700 mb-4">We may share your information with:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li><strong>AI Service Providers:</strong> Anthropic (Claude AI) for content processing</li>
              <li><strong>Payment Processors:</strong> Stripe for subscription billing and payment processing</li>
              <li><strong>Analytics Services:</strong> Anonymous usage analytics to improve our service</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
            <p className="text-gray-700 mb-6">
              We do not sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Security</h2>
            <p className="text-gray-700 mb-4">We implement industry-standard security measures:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Encryption in transit and at rest</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure payment processing through PCI-compliant providers</li>
              <li>Regular data backups with encryption</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Your Rights and Choices</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Access, update, or delete your personal information</li>
              <li>Export your saved content</li>
              <li>Opt-out of non-essential communications</li>
              <li>Request data portability</li>
              <li>Object to certain processing activities</li>
              <li>Lodge a complaint with supervisory authorities</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Data Retention</h2>
            <p className="text-gray-700 mb-6">
              We retain your personal information for as long as your account is active or as needed to provide services. Account data is deleted within 30 days of account closure, unless longer retention is required by law. Temporary content processing data is deleted immediately after processing.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Team and Agency Plans</h2>
            <p className="text-gray-700 mb-6">
              For Agency plan users with team features, team owners can invite members and access team usage analytics. Team members' content and activity may be visible to team owners and administrators within the same organization.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 mb-6">
              Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with applicable privacy laws.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Children's Privacy</h2>
            <p className="text-gray-700 mb-6">
              Our service is not intended for children under 13 years old. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Changes to This Policy</h2>
            <p className="text-gray-700 mb-6">
              We may update this privacy policy from time to time. We will notify you of any material changes by email or through our service. Your continued use of the service after changes become effective constitutes acceptance of the updated policy.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this privacy policy or our data practices, please contact us:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Email: privacy@aicontentstudio.com</li>
              <li>Through our support system in the dashboard</li>
              <li>Mail: AI Content Repurposer Studio, Privacy Department</li>
            </ul>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                This privacy policy is effective as of December 2024 and was last updated on December 2024.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 