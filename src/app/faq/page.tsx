import React from 'react';
import Link from 'next/link';
import { Accordion } from '@/components/ui/accordion';

export const metadata = {
  title: 'FAQ - Prompt Hub',
  description:
    'Frequently asked questions about Prompt Hub - find answers to common questions about our AI prompt platform',
};

export default function FAQPage() {
  const faqItems = [
    {
      id: 'what-is-prompt-hub',
      question: 'What is Prompt Hub?',
      answer:
        'Prompt Hub is a comprehensive platform for discovering, sharing, and rating AI prompts. We provide a community-driven space where users can find high-quality prompts for various AI models, share their own creations, and learn from other prompt engineers.',
    },
    {
      id: 'how-to-get-started',
      question: 'How do I get started with Prompt Hub?',
      answer:
        'Getting started is easy! Simply create a free account, browse our collection of prompts, and start exploring. You can submit your first prompt within minutes. We also recommend checking out our Academy section for learning resources.',
    },
    {
      id: 'is-it-free',
      question: 'Is Prompt Hub free to use?',
      answer:
        'Yes, Prompt Hub is free to use for basic features including browsing prompts, submitting your own prompts, rating and reviewing content, and participating in our community. Some premium features may be available in the future.',
    },
    {
      id: 'how-to-submit-prompt',
      question: 'How do I submit a prompt?',
      answer:
        'To submit a prompt, click the "Submit Your Prompt" button or navigate to /prompts/new. Fill in the required fields including title, description, content, category, and tags. Make sure to provide clear instructions and context for the best results.',
    },
    {
      id: 'rating-system',
      question: 'How does the rating system work?',
      answer:
        'Users can rate prompts on a 1-5 star scale based on effectiveness, clarity, and usefulness. You can also leave detailed reviews. Higher-rated prompts appear more prominently in search results and featured sections.',
    },
    {
      id: 'edit-prompt',
      question: 'Can I edit my submitted prompts?',
      answer:
        'Yes, you can edit your own prompts from your profile page. We support version history, so you can track changes and improvements over time. This helps maintain the quality and relevance of your prompts.',
    },
    {
      id: 'report-content',
      question: 'How do I report inappropriate content?',
      answer:
        'If you encounter inappropriate, misleading, or harmful content, use the report button available on every prompt and comment. Our moderation team reviews reports and takes appropriate action to maintain community standards.',
    },
    {
      id: 'categories-explained',
      question: 'What are the different prompt categories?',
      answer:
        'We organize prompts into categories like Content Creation, Customer Support, Code Generation, Data Analysis, Creative Writing, and many more. Categories help users find prompts relevant to their specific needs and use cases.',
    },
    {
      id: 'community-guidelines',
      question: 'What are the community guidelines?',
      answer:
        'Our community guidelines emphasize respect, constructive feedback, and quality content. Users should avoid spam, harassment, and misleading information. We encourage sharing knowledge and helping fellow community members improve their prompting skills.',
    },
    {
      id: 'account-deletion',
      question: 'How do I delete my account?',
      answer:
        'You can delete your account from your profile settings. When you delete your account, your prompts and comments will remain but will be attributed to "Anonymous User". If you need complete data removal, please contact our support team.',
    },
    {
      id: 'api-access',
      question: 'Is there an API for accessing prompts programmatically?',
      answer:
        'We provide a REST API for developers who want to integrate Prompt Hub data into their applications. API access requires registration and is subject to our terms of service and rate limits. Check our developer documentation for details.',
    },
    {
      id: 'feedback-suggestions',
      question: 'How can I provide feedback or suggestions?',
      answer:
        'We welcome feedback! You can use our feedback form, participate in community discussions, or contact us directly. Your input helps us improve the platform and add features that matter to our users.',
    },
    {
      id: 'moderation-process',
      question: 'How does content moderation work?',
      answer:
        'We use a combination of automated systems and human moderation to ensure quality. Community reports help us identify issues quickly. Our moderation team reviews flagged content and takes appropriate actions including content removal or account restrictions.',
    },
    {
      id: 'data-privacy',
      question: 'How do you protect user data and privacy?',
      answer:
        'We take privacy seriously and comply with data protection regulations. User data is encrypted, access is restricted, and we never sell personal information. See our Privacy Policy for detailed information about data handling practices.',
    },
    {
      id: 'collaboration-features',
      question: 'What collaboration features are available?',
      answer:
        'Prompt Hub supports collaboration through comments, ratings, and version history. Users can discuss prompts, suggest improvements, and track how prompts evolve over time. Our community forum also facilitates broader discussions.',
    },
  ];

  const categories = [
    {
      name: 'Getting Started',
      count: 3,
      items: ['what-is-prompt-hub', 'how-to-get-started', 'is-it-free'],
    },
    {
      name: 'Using the Platform',
      count: 4,
      items: ['how-to-submit-prompt', 'rating-system', 'edit-prompt', 'categories-explained'],
    },
    {
      name: 'Community & Guidelines',
      count: 3,
      items: ['report-content', 'community-guidelines', 'moderation-process'],
    },
    {
      name: 'Account & Privacy',
      count: 3,
      items: ['account-deletion', 'data-privacy', 'feedback-suggestions'],
    },
    { name: 'Advanced Features', count: 2, items: ['api-access', 'collaboration-features'] },
  ];

  return (
    <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="heading-xl mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-subtext max-w-2xl mx-auto">
            Find answers to common questions about Prompt Hub. Can&apos;t find what you&apos;re
            looking for?
            <Link href="/contact" className="text-primary hover:underline ml-1">
              Contact us
            </Link>
            .
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar with Categories */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h3 className="text-lg font-semibold text-heading mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-border hover:bg-surface/50 transition-colors"
                  >
                    <div className="font-medium text-heading text-sm">{category.name}</div>
                    <div className="text-xs text-subtext">{category.count} questions</div>
                  </div>
                ))}
              </div>

              {/* Quick Links */}
              <div className="mt-8">
                <h4 className="text-sm font-semibold text-heading mb-3">Quick Links</h4>
                <div className="space-y-2">
                  <Link href="/contact" className="block text-sm text-primary hover:underline">
                    Contact Support
                  </Link>
                  <Link href="/community" className="block text-sm text-primary hover:underline">
                    Community Forum
                  </Link>
                  <Link href="/academy" className="block text-sm text-primary hover:underline">
                    Learning Resources
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <Accordion items={faqItems} defaultOpen={[]} />

            {/* Still Need Help */}
            <div className="mt-12 card p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5">
              <h3 className="text-xl font-bold text-heading mb-4">Still need help?</h3>
              <p className="text-subtext mb-6">
                Can&apos;t find the answer you&apos;re looking for? Our support team is here to
                help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Contact Support
                </Link>
                <Link
                  href="/community"
                  className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors"
                >
                  Ask Community
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
