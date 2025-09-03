import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - Prompt Hub',
  description: 'Learn about how Prompt Hub collects, uses, and protects your personal information',
};

export default function PrivacyPage() {
  const sections = [
    {
      title: 'Information We Collect',
      content: [
        'Personal information you provide directly (name, email, profile information)',
        'Usage data and analytics (pages visited, time spent, features used)',
        'Content you create (prompts, comments, ratings)',
        'Communication data (messages, feedback, support requests)',
        'Technical data (IP address, browser type, device information)',
      ],
    },
    {
      title: 'How We Use Your Information',
      content: [
        'Provide and maintain our services',
        'Process and display user-generated content',
        'Send important updates and notifications',
        'Improve our platform through analytics',
        'Ensure security and prevent abuse',
        'Comply with legal obligations',
      ],
    },
    {
      title: 'Information Sharing',
      content: [
        'We do not sell your personal information to third parties',
        'Limited sharing with service providers (hosting, analytics)',
        'Legal requirements may compel disclosure',
        'Aggregated, anonymized data may be shared for research',
        'User-generated content is publicly visible by default',
      ],
    },
    {
      title: 'Data Security',
      content: [
        'Industry-standard encryption for data transmission',
        'Secure storage with access controls',
        'Regular security audits and updates',
        'Employee access limited to necessary personnel',
        'Prompt data backup and recovery procedures',
      ],
    },
    {
      title: 'Your Rights',
      content: [
        'Access and review your personal data',
        'Correct inaccurate information',
        'Delete your account and associated data',
        'Export your data in portable format',
        'Opt-out of marketing communications',
        'Control privacy settings for your content',
      ],
    },
    {
      title: 'Cookies and Tracking',
      content: [
        'Essential cookies for platform functionality',
        'Analytics cookies to improve user experience',
        'Preference cookies to remember your settings',
        'Third-party cookies for social media integration',
        'Clear options to manage cookie preferences',
      ],
    },
  ];

  return (
    <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="heading-xl mb-4">Privacy Policy</h1>
          <p className="text-lg text-subtext">Last updated: January 15, 2024</p>
        </div>

        {/* Introduction */}
        <div className="card p-8 mb-8">
          <p className="text-subtext leading-relaxed">
            At Prompt Hub, we are committed to protecting your privacy and ensuring the security of
            your personal information. This Privacy Policy explains how we collect, use, and
            safeguard your data when you use our platform. By using Prompt Hub, you agree to the
            collection and use of information in accordance with this policy.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="card p-8">
              <h2 className="text-2xl font-bold text-heading mb-6">{section.title}</h2>
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-subtext">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="card p-8 mt-8">
          <h2 className="text-2xl font-bold text-heading mb-6">Contact Us</h2>
          <p className="text-subtext mb-4">
            If you have any questions about this Privacy Policy or our data practices, please
            contact us:
          </p>
          <div className="space-y-2 text-subtext">
            <p>
              <strong>Email:</strong> privacy@prompt-hub.com
            </p>
            <p>
              <strong>Address:</strong> Ireland
            </p>
            <p>
              <strong>Response Time:</strong> We aim to respond to privacy inquiries within 30 days
            </p>
          </div>
        </div>

        {/* Updates */}
        <div className="card p-8 mt-8">
          <h2 className="text-2xl font-bold text-heading mb-6">Policy Updates</h2>
          <p className="text-subtext mb-4">
            We may update this Privacy Policy from time to time to reflect changes in our practices
            or legal requirements. When we make material changes, we will notify you through:
          </p>
          <ul className="space-y-2 text-subtext">
            <li>• Email notification to your registered address</li>
            <li>• Prominent notice on our platform</li>
            <li>• Update to the &quot;Last updated&quot; date above</li>
          </ul>
          <p className="text-subtext mt-4">
            Your continued use of Prompt Hub after such modifications constitutes acceptance of the
            updated Privacy Policy.
          </p>
        </div>

        {/* Related Links */}
        <div className="text-center mt-12">
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-primary hover:underline">
              Contact Us
            </Link>
            <Link href="/cookies" className="text-primary hover:underline">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
