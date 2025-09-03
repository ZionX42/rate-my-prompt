import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy - Prompt Hub',
  description:
    'Learn about how Prompt Hub uses cookies and similar technologies to enhance your browsing experience',
};

export default function CookiePolicyPage() {
  const cookieTypes = [
    {
      title: 'Essential Cookies',
      description: 'Required for the website to function properly',
      examples: ['Authentication cookies', 'Security cookies', 'Session management'],
      purpose: 'These cookies are necessary for the website to function and cannot be disabled.',
    },
    {
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website',
      examples: ['Google Analytics', 'Usage statistics', 'Performance monitoring'],
      purpose: 'These cookies help us improve our website by understanding user behavior.',
    },
    {
      title: 'Functional Cookies',
      description: 'Enhance your experience on our website',
      examples: ['Language preferences', 'Theme settings', 'Form data preservation'],
      purpose: 'These cookies remember your preferences and provide enhanced features.',
    },
    {
      title: 'Marketing Cookies',
      description: 'Used to deliver relevant advertisements',
      examples: ['Targeted advertising', 'Social media tracking', 'Retargeting cookies'],
      purpose: 'These cookies help us show you relevant content and advertisements.',
    },
  ];

  const thirdPartyServices = [
    { name: 'Google Analytics', purpose: 'Website analytics and performance monitoring' },
    { name: 'Appwrite', purpose: 'Database and authentication services' },
    { name: 'Vercel', purpose: 'Website hosting and performance monitoring' },
    { name: 'Sentry', purpose: 'Error tracking and performance monitoring' },
  ];

  return (
    <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="heading-xl mb-4">Cookie Policy</h1>
          <p className="text-lg text-subtext">Last updated: January 15, 2024</p>
        </div>

        {/* Introduction */}
        <div className="card p-8 mb-8">
          <p className="text-subtext leading-relaxed mb-4">
            This Cookie Policy explains how Prompt Hub (&quot;we&quot;, &quot;us&quot;, or
            &quot;our&quot;) uses cookies and similar technologies on our website. By using our
            website, you consent to the use of cookies in accordance with this policy.
          </p>
          <p className="text-subtext leading-relaxed">
            If you do not agree to the use of cookies, you should adjust your browser settings
            accordingly or refrain from using our website.
          </p>
        </div>

        {/* What are Cookies */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-heading mb-6">What are Cookies?</h2>
          <div className="space-y-4 text-subtext">
            <p>
              Cookies are small text files that are stored on your computer or mobile device when
              you visit our website. They allow us to remember your preferences, analyze website
              traffic, and provide personalized content.
            </p>
            <p>
              Cookies can be &quot;persistent&quot; (they remain on your device until you delete
              them) or &quot;session&quot; cookies (they expire when you close your browser). We use
              both types to provide the best possible user experience.
            </p>
            <p>Similar technologies we may use include:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>Web beacons:</strong> Small graphic images that track website usage
              </li>
              <li>
                <strong>Local storage:</strong> Browser-based storage for user preferences
              </li>
              <li>
                <strong>Session storage:</strong> Temporary storage for session-specific data
              </li>
            </ul>
          </div>
        </div>

        {/* Types of Cookies */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-heading mb-6">Types of Cookies We Use</h2>
          <div className="grid gap-6">
            {cookieTypes.map((type, index) => (
              <div key={index} className="card p-6">
                <h3 className="text-lg font-semibold text-heading mb-3">{type.title}</h3>
                <p className="text-subtext mb-4">{type.description}</p>

                <div className="mb-4">
                  <h4 className="font-medium text-heading mb-2">Examples:</h4>
                  <ul className="list-disc list-inside text-sm text-subtext space-y-1">
                    {type.examples.map((example, i) => (
                      <li key={i}>{example}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-heading mb-2">Purpose:</h4>
                  <p className="text-sm text-subtext">{type.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Third-Party Cookies */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-heading mb-6">Third-Party Cookies</h2>
          <p className="text-subtext mb-6">
            We may use third-party services that place cookies on your device. These services help
            us provide certain features and analyze website performance.
          </p>

          <div className="space-y-4">
            {thirdPartyServices.map((service, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 border border-border rounded-lg"
              >
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium text-heading">{service.name}</h4>
                  <p className="text-sm text-subtext">{service.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Manage Cookies */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-heading mb-6">How to Manage Cookies</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-heading mb-3">Browser Settings</h3>
              <p className="text-subtext mb-4">
                You can control and manage cookies through your browser settings. Most browsers
                allow you to:
              </p>
              <ul className="list-disc list-inside text-subtext space-y-2">
                <li>View cookies stored on your device</li>
                <li>Delete existing cookies</li>
                <li>Block cookies from specific websites</li>
                <li>Block all cookies</li>
                <li>Receive notifications when cookies are set</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-heading mb-3">
                Browser-Specific Instructions
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-heading mb-2">Chrome</h4>
                  <p className="text-subtext">
                    Settings → Privacy and security → Cookies and other site data
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-heading mb-2">Firefox</h4>
                  <p className="text-subtext">
                    Settings → Privacy & Security → Cookies and Site Data
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-heading mb-2">Safari</h4>
                  <p className="text-subtext">Preferences → Privacy → Manage Website Data</p>
                </div>
                <div>
                  <h4 className="font-medium text-heading mb-2">Edge</h4>
                  <p className="text-subtext">
                    Settings → Cookies and site permissions → Cookies and site data
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-heading mb-3">Opt-Out Options</h3>
              <p className="text-subtext mb-4">
                You can opt out of certain cookies through these services:
              </p>
              <ul className="list-disc list-inside text-subtext space-y-2">
                <li>
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Analytics Opt-out
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youronlinechoices.com/"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Your Online Choices
                  </a>
                </li>
                <li>
                  <a
                    href="https://optout.aboutads.info/"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Digital Advertising Alliance
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Updates */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-heading mb-6">Policy Updates</h2>
          <p className="text-subtext leading-relaxed">
            We may update this Cookie Policy from time to time to reflect changes in our practices
            or applicable laws. When we make material changes, we will update the &quot;Last
            updated&quot; date at the top of this policy and may provide additional notice.
          </p>
        </div>

        {/* Contact Information */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-heading mb-6">Contact Us</h2>
          <p className="text-subtext mb-4">
            If you have any questions about this Cookie Policy or our use of cookies, please contact
            us:
          </p>
          <div className="space-y-2 text-subtext">
            <p>
              <strong>Email:</strong> privacy@prompt-hub.com
            </p>
            <p>
              <strong>Subject:</strong> Cookie Policy Inquiry
            </p>
          </div>
        </div>

        {/* Related Links */}
        <div className="text-center">
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
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
