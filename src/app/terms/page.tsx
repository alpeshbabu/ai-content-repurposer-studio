import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { getAllPlans } from '@/lib/pricing-config';

export const metadata: Metadata = {
  title: 'Terms of Service - AI Content Repurposer Studio',
  description: 'Terms of Service for AI Content Repurposer Studio',
};

export default function TermsPage() {
  const plans = getAllPlans();
  
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: December 2024</p>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-6">
              By accessing or using AI Content Repurposer Studio ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-6">
              AI Content Repurposer Studio is a web-based service that uses artificial intelligence to help users repurpose content across multiple platforms. The Service includes content processing, analytics, team collaboration features, and subscription management.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">3.1 Account Creation</h3>
            <p className="text-gray-700 mb-4">To use the Service, you must:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be at least 13 years old (or the minimum age in your jurisdiction)</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">3.2 Account Termination</h3>
            <p className="text-gray-700 mb-6">
              You may terminate your account at any time. We may suspend or terminate your account for violation of these Terms, illegal activity, or for any reason with appropriate notice.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Subscription Plans and Billing</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">4.1 Subscription Tiers</h3>
            <p className="text-gray-700 mb-4">We offer the following subscription plans:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              {plans.map((plan) => (
                <li key={plan.id}>
                  <strong>{plan.name} Plan:</strong>{' '}
                  {plan.price === 0 ? (
                    <>
                      {plan.monthlyLimit === -1 ? 'Unlimited' : plan.monthlyLimit} content repurposes per month, 
                      ${plan.overagePrice.toFixed(2)} per overage
                    </>
                  ) : (
                    <>
                      ${plan.price}/month, {plan.monthlyLimit === -1 ? 'unlimited' : plan.monthlyLimit} repurposes per month
                      {plan.teamMembers > 1 && ', team features'}, ${plan.overagePrice.toFixed(2)} per overage
                    </>
                  )}
                </li>
              ))}
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">4.2 Billing and Payment</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Subscriptions are billed monthly in advance</li>
              <li>Overage charges are billed at the end of each billing period</li>
              <li>All payments are processed securely through Stripe</li>
              <li>Prices are subject to change with 30 days notice</li>
              <li>No refunds for partial months or unused content repurposes</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">4.3 Usage Limits</h3>
            <p className="text-gray-700 mb-6">
              Each plan includes specific monthly limits. Exceeding these limits will incur overage charges unless you opt-out of overage billing, in which case service will be temporarily suspended until the next billing period or plan upgrade.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Content and Intellectual Property</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">5.1 Your Content</h3>
            <p className="text-gray-700 mb-4">You retain ownership of all content you submit to the Service. By using the Service, you grant us:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>License to process your content through AI systems for repurposing</li>
              <li>Right to temporarily store content for service delivery</li>
              <li>Permission to analyze usage patterns (in anonymized form)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">5.2 AI-Generated Content</h3>
            <p className="text-gray-700 mb-6">
              Content generated by our AI systems based on your input is provided to you for your use. You are responsible for reviewing and ensuring the appropriateness of all AI-generated content before publication.
            </p>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">5.3 Content Restrictions</h3>
            <p className="text-gray-700 mb-4">You may not submit content that:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Violates any applicable laws or regulations</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains harmful, offensive, or inappropriate material</li>
              <li>Includes personal information of third parties without consent</li>
              <li>Promotes illegal activities or hate speech</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Team and Agency Features</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">6.1 Team Management</h3>
            <p className="text-gray-700 mb-6">
              Agency plan users can invite team members and manage team permissions. Team owners are responsible for their team members' compliance with these Terms and any charges incurred by the team.
            </p>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">6.2 Team Data</h3>
            <p className="text-gray-700 mb-6">
              Team owners and administrators may access team usage analytics and content created by team members. Team members consent to this access when accepting team invitations.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Acceptable Use</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to reverse engineer or hack the Service</li>
              <li>Share your account credentials with others</li>
              <li>Use automated tools to access the Service without permission</li>
              <li>Submit excessive requests that may harm Service performance</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. AI and Technology Limitations</h2>
            <p className="text-gray-700 mb-4">You acknowledge that:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>AI-generated content may not always be accurate or appropriate</li>
              <li>You are responsible for reviewing all output before use</li>
              <li>Service availability may be affected by third-party AI providers</li>
              <li>AI models may be updated or changed without notice</li>
              <li>Processing times may vary based on demand and content complexity</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Privacy and Data Protection</h2>
            <p className="text-gray-700 mb-6">
              Your privacy is important to us. Our collection and use of your information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Disclaimers and Limitations of Liability</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">10.1 Service Disclaimers</h3>
            <p className="text-gray-700 mb-6">
              The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or that AI-generated content will meet your specific needs.
            </p>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">10.2 Limitation of Liability</h3>
            <p className="text-gray-700 mb-6">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Indemnification</h2>
            <p className="text-gray-700 mb-6">
              You agree to indemnify and hold us harmless from any claims arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Termination</h2>
            <p className="text-gray-700 mb-6">
              Either party may terminate these Terms at any time. Upon termination, your access to the Service will cease, and any outstanding charges will become due. Provisions that should survive termination will remain in effect.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Governing Law</h2>
            <p className="text-gray-700 mb-6">
              These Terms are governed by the laws of [Jurisdiction], without regard to conflict of law principles. Any disputes will be resolved in the courts of [Jurisdiction].
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-700 mb-6">
              We may modify these Terms at any time. Material changes will be communicated via email or through the Service. Continued use after changes constitutes acceptance of the modified Terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">15. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms, please contact us:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Email: legal@aicontentstudio.com</li>
              <li>Through our support system in the dashboard</li>
              <li>Mail: AI Content Repurposer Studio, Legal Department</li>
            </ul>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                These terms of service are effective as of December 2024 and were last updated on December 2024.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 