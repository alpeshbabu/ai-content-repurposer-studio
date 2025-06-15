import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Mail, MessageSquare, Phone, MapPin, Clock, Send } from 'lucide-react';
import ContactForm from '@/components/contact/contact-form';

export const metadata: Metadata = {
  title: 'Contact Us - AI Content Repurposer Studio',
  description: 'Get in touch with AI Content Repurposer Studio. We\'re here to help with any questions about our AI-powered content repurposing platform.',
};

export default function ContactPage() {
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 to-blue-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-6">
              Get in Touch
              <span className="block text-indigo-600">We're Here to Help</span>
            </h1>
            <p className="max-w-3xl mx-auto text-xl text-gray-600 mb-8">
              Have questions about AI Content Repurposer Studio? Want to learn more about our features? 
              We'd love to hear from you and help you get the most out of our platform.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Mail className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 mb-2">Get help via email</p>
              <a href="mailto:support@aicontentstudio.com" className="text-indigo-600 hover:text-indigo-700">
                support@aicontentstudio.com
              </a>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-2">Chat with our team</p>
              <Link href="/auth/signin?callbackUrl=%2Fdashboard%2Fsupport" className="text-indigo-600 hover:text-indigo-700">
                Sign In for Support Tickets
              </Link>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Time</h3>
              <p className="text-gray-600 mb-2">We typically respond</p>
              <span className="text-indigo-600 font-medium">Within 24 hours</span>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Global Support</h3>
              <p className="text-gray-600 mb-2">Available worldwide</p>
              <span className="text-indigo-600 font-medium">24/7 Online</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Send Us a Message</h2>
            <p className="text-lg text-gray-600">
              Fill out the form below and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">
              Quick answers to common questions about our platform.
            </p>
          </div>

          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How does AI Content Repurposer Studio work?
              </h3>
              <p className="text-gray-700">
                Our platform uses advanced AI technology to analyze your original content and automatically 
                adapt it for different social media platforms, maintaining your brand voice while optimizing 
                for each platform's unique requirements and audience expectations.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What platforms do you support?
              </h3>
              <p className="text-gray-700">
                We support all major social media platforms including Twitter, LinkedIn, Instagram, Facebook, 
                as well as email newsletters and threaded content formats. Our AI optimizes content length, 
                tone, and style for each platform.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Can I try the platform before purchasing?
              </h3>
              <p className="text-gray-700">
                Yes! We offer a free tier that allows you to repurpose up to 5 pieces of content per month. 
                This lets you experience the quality and capabilities of our AI before upgrading to a paid plan.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How do I cancel my subscription?
              </h3>
              <p className="text-gray-700">
                You can cancel your subscription at any time from your account settings. There are no cancellation 
                fees, and you'll continue to have access to your plan features until the end of your billing period.
              </p>
            </div>

            <div className="pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Do you offer team collaboration features?
              </h3>
              <p className="text-gray-700">
                Yes! Our Agency plan includes team collaboration features, allowing you to invite team members, 
                share content projects, and access team analytics. It's perfect for agencies and larger organizations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Content?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of creators who are already using AI to amplify their content reach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-indigo-700 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 