import React from 'react';
import Link from 'next/link';
import FeaturedPrompts from '@/components/prompts/FeaturedPrompts';
import CategoryNavigation from '@/components/prompts/CategoryNavigation';
import { PromptModel } from '@/lib/models/prompt';

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`px-6 md:px-10 lg:px-16 py-12 md:py-16 ${className}`}>{children}</section>
  );
}

async function fetchFeaturedPrompts(): Promise<PromptModel[]> {
  if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
    return []; // Storage not configured
  }

  try {
    const { getFeaturedPrompts } = await import('@/lib/repos/promptRepo');
    return await getFeaturedPrompts(6);
  } catch (err) {
    console.error('Error fetching featured prompts:', err);
    return [];
  }
}

async function fetchCategoryStats(): Promise<Array<{ category: string; count: number }>> {
  if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
    return []; // Storage not configured
  }

  try {
    const { getCategoryStats } = await import('@/lib/repos/promptRepo');
    return await getCategoryStats();
  } catch (err) {
    console.error('Error fetching category stats:', err);
    return [];
  }
}

export default async function HomePage() {
  const [featuredPrompts, categoryStats] = await Promise.all([
    fetchFeaturedPrompts(),
    fetchCategoryStats(),
  ]);
  return (
    <main>
      {/* Hero */}
      <Section className="pt-10 md:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="heading-xl">
              The AI community
              <br className="hidden md:block" /> building the future.
            </h1>
            <p className="mt-4 text-lg muted max-w-2xl">
              A platform to discover, rank, and learn from top prompts, agents & workflows. Share
              your work. Level up with the community.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/prompts" className="cta cta--pink hover-glow-pink">
                Browse Prompts
              </Link>
              <Link href="/prompts/new" className="cta cta--blue hover-glow-blue">
                Submit Your Prompt
              </Link>
            </div>
          </div>
          <div className="card card-hover p-6 lg:p-8">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl bg-surface/70 border border-border p-4">
                <div className="text-heading font-semibold">Trending</div>
                <ul className="mt-3 space-y-2">
                  <li className="flex justify-between">
                    <span>Content Generator</span>
                    <span className="text-hfYellow">4.8★</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Customer Support</span>
                    <span className="text-hfYellow">4.7★</span>
                  </li>
                  <li className="flex justify-between">
                    <span>SEO Optimizer</span>
                    <span className="text-hfYellow">4.7★</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl bg-surface/70 border border-border p-4">
                <div className="text-heading font-semibold">Latest</div>
                <ul className="mt-3 space-y-2">
                  <li className="flex justify-between">
                    <span>Summarizer Pro</span>
                    <span className="text-hfYellow">New</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Resume Builder</span>
                    <span className="text-hfYellow">New</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Docs QA</span>
                    <span className="text-hfYellow">New</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        {/* Newsletter Signup */}
        <div
          className="card p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5"
          style={{ marginTop: '130px' }}
        >
          <h3 className="text-2xl font-bold text-heading mb-4">Stay Updated</h3>
          <p className="text-subtext mb-6 max-w-2xl mx-auto">
            Get notified when we publish new tutorials and learning resources. Join our community of
            learners and stay ahead of the curve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </Section>

      {/* Trending row */}
      <Section className="pt-0">
        <h2 className="text-2xl md:text-3xl font-bold text-heading mb-6">Trending this week</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {['OpenAI', 'Community', 'Agents'].map((label, i) => (
            <div key={label} className="card card-hover p-5 border border-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-heading">{label}</span>
                <span
                  className={
                    i === 0
                      ? 'text-accent-blue'
                      : i === 1
                        ? 'text-accent-pink'
                        : 'text-accent-green'
                  }
                >
                  ●
                </span>
              </div>
              <p className="mt-2 text-sm muted">
                Top {label.toLowerCase()} prompts curated by the community.
              </p>
              <div className="mt-4">
                <Link href="/prompts" className="text-hfYellow underline underline-offset-4">
                  Explore
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Featured Prompts */}
      <Section className="pt-0">
        <h2 className="text-2xl md:text-3xl font-bold text-heading mb-6">Featured Prompts</h2>
        <FeaturedPrompts prompts={featuredPrompts} />
      </Section>

      {/* Browse by Category */}
      <Section className="pt-0">
        <h2 className="text-2xl md:text-3xl font-bold text-heading mb-6">Browse by Category</h2>
        <CategoryNavigation categories={categoryStats} />
      </Section>

      {/* Collaboration section */}
      <Section className="pt-0">
        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          <div className="card p-6">
            <h3 className="text-xl md:text-2xl font-bold text-heading">
              The collaboration platform
            </h3>
            <p className="mt-2 muted">
              Share, review, and iterate on prompts with transparent version history.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• Structured reviews (effectiveness, efficiency, clarity)</li>
              <li>• Versioning and changelogs</li>
              <li>• Forum discussions per prompt</li>
            </ul>
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="bg-surface border-b border-border px-4 py-2 text-xs">Example</div>
            <pre className="p-4 text-sm text-heading/90">
              {`System: You are a marketing assistant.
Task: Produce a 100-word product description.

Scoring:
- Specificity: 5
- Clarity: 5
- Efficiency: 4`}
            </pre>
          </div>
        </div>
      </Section>

      {/* Features grid */}
      <Section className="pt-0">
        <h3 className="text-xl md:text-2xl font-bold text-heading mb-6">Features</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Ranking', color: 'text-accent-blue' },
            { label: 'Reviews', color: 'text-accent-pink' },
            { label: 'Versioning', color: 'text-accent-green' },
            { label: 'Academy', color: 'text-hfYellow' },
          ].map((f) => (
            <div key={f.label} className="card card-hover p-5">
              <div className={`text-sm ${f.color}`}>●</div>
              <div className="mt-2 font-semibold text-heading">{f.label}</div>
              <p className="text-sm mt-1 muted">Built for prompt engineers and AI practitioners.</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Open Source style grid */}
      <Section className="pt-0 pb-16">
        <h3 className="text-xl md:text-2xl font-bold text-heading mb-6">Our Open Source</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card card-hover p-5 border border-border">
              <div className="text-heading font-semibold">Library {i + 1}</div>
              <p className="mt-1 text-sm muted">Description placeholder for OSS module.</p>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
