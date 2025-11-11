import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - Prompt Hub',
  description: 'Read our terms of service and usage guidelines for Prompt Hub',
};

export default function TermsPage() {
  const sections = [
    {
      title: 'Acceptance of Terms',
      content:
        'By accessing and using Prompt Hub, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.',
    },
    {
      title: 'User Accounts',
      content:
        'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.',
    },
    {
      title: 'Acceptable Use',
      content:
        'You agree not to use the service to: violate any laws or regulations, infringe on intellectual property rights, distribute harmful content, harass other users, or attempt to gain unauthorized access to our systems.',
    },
    {
      title: 'Content Ownership',
      content:
        'You retain ownership of content you submit to Prompt Hub. By submitting content, you grant us a license to display, distribute, and promote your content on our platform.',
    },
    {
      title: 'Community Guidelines',
      content:
        'All users must follow our community guidelines. This includes treating others with respect, providing constructive feedback, and maintaining the quality of discussions and content.',
    },
    {
      title: 'Prohibited Content',
      content:
        'Users may not submit content that is: illegal, harmful, discriminatory, misleading, spam, or violates the rights of others. We reserve the right to remove such content.',
    },
    {
      title: 'Service Availability',
      content:
        'While we strive for high availability, we do not guarantee uninterrupted service. We may perform maintenance or updates that temporarily affect service availability.',
    },
    {
      title: 'Limitation of Liability',
      content:
        'Prompt Hub shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the service.',
    },
    {
      title: 'Termination',
      content:
        'We reserve the right to terminate or suspend your account at our discretion, with or without cause, and with or without notice.',
    },
    {
      title: 'Changes to Terms',
      content:
        'We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.',
    },
  ];

  return (
    <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="heading-xl mb-4">Terms of Service</h1>
          <p className="text-lg text-subtext">Last updated: January 15, 2024</p>
        </div>

        {/* Introduction */}
        <div className="card p-8 mb-8">
          <p className="text-subtext leading-relaxed mb-4">
            These Terms of Service (&quot;Terms&quot;) govern your use of Prompt Hub and its
            associated services. By using our platform, you agree to these terms. Please read them
            carefully.
          </p>
          <p className="text-subtext leading-relaxed">
            If you have any questions about these Terms, please contact us at legal@prompt-hub.com.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="card p-8">
              <h2 className="text-xl font-bold text-heading mb-4">
                {index + 1}. {section.title}
              </h2>
              <p className="text-subtext leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Governing Law */}
        <div className="card p-8 mt-8">
          <h2 className="text-xl font-bold text-heading mb-4">Governing Law</h2>
          <p className="text-subtext leading-relaxed">
            These Terms shall be interpreted and governed by the laws of the State of California,
            United States, without regard to conflict of law provisions. Any disputes arising from
            these Terms shall be subject to the exclusive jurisdiction of the courts in San
            Francisco County, California.
          </p>
        </div>

        {/* Contact Information */}
        <div className="card p-8 mt-8">
          <h2 className="text-xl font-bold text-heading mb-4">Contact Information</h2>
          <p className="text-subtext mb-4">
            If you have questions about these Terms of Service, please contact us:
          </p>
          <div className="space-y-2 text-subtext">
            <p>
              <strong>Email:</strong> legal@prompt-hub.com
            </p>
            <p>
              <strong>Address:</strong> San Francisco, CA
            </p>
            <p>
              <strong>Effective Date:</strong> January 15, 2024
            </p>
          </div>
        </div>

        {/* Related Documents */}
        <div className="text-center mt-12">
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="text-primary hover:underline">
              Cookie Policy
            </Link>
            <Link href="/contact" className="text-primary hover:underline">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
