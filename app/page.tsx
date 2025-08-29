import React from 'react';
import Link from 'next/link';
import FeaturedPrompts from '@/components/prompts/FeaturedPrompts';
import { PromptModel } from '@/lib/models/prompt';

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`px-6 md:px-10 lg:px-16 py-12 md:py-16 ${className}`}>{children}</section>;
}

async function fetchFeaturedPrompts(): Promise<PromptModel[]> {
  if (!process.env.MONGODB_URI) {
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

export default async function HomePage() {
  const featuredPrompts = await fetchFeaturedPrompts();
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
              A platform to discover, rank, and learn from top prompts and agents. Share your work. Level up with the community.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/prompts" className="cta cta--pink hover-glow-pink">Browse Prompts</Link>
              <Link href="/prompts/new" className="cta cta--blue hover-glow-blue">Submit Your Prompt</Link>
            </div>
          </div>
          <div className="card card-hover p-6 lg:p-8">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl bg-surface/70 border border-border p-4">
                <div className="text-heading font-semibold">Trending</div>
                <ul className="mt-3 space-y-2">
                  <li className="flex justify-between"><span>Content Generator</span><span className="text-hfYellow">4.8★</span></li>
                  <li className="flex justify-between"><span>Customer Support</span><span className="text-hfYellow">4.7★</span></li>
                  <li className="flex justify-between"><span>SEO Optimizer</span><span className="text-hfYellow">4.7★</span></li>
                </ul>
              </div>
              <div className="rounded-2xl bg-surface/70 border border-border p-4">
                <div className="text-heading font-semibold">Latest</div>
                <ul className="mt-3 space-y-2">
                  <li className="flex justify-between"><span>Summarizer Pro</span><span className="text-hfYellow">New</span></li>
                  <li className="flex justify-between"><span>Resume Builder</span><span className="text-hfYellow">New</span></li>
                  <li className="flex justify-between"><span>Docs QA</span><span className="text-hfYellow">New</span></li>
                </ul>
              </div>
            </div>
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
                <span className={i === 0 ? 'text-accent-blue' : i === 1 ? 'text-accent-pink' : 'text-accent-green'}>●</span>
              </div>
              <p className="mt-2 text-sm muted">Top {label.toLowerCase()} prompts curated by the community.</p>
              <div className="mt-4">
                <Link href="/prompts" className="text-hfYellow underline underline-offset-4">Explore</Link>
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

      {/* Collaboration section */}
      <Section className="pt-0">
        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          <div className="card p-6">
            <h3 className="text-xl md:text-2xl font-bold text-heading">The collaboration platform</h3>
            <p className="mt-2 muted">Share, review, and iterate on prompts with transparent version history.</p>
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
