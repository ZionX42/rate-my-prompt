import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="px-6 md:px-10 lg:px-16 py-16 md:py-24 text-center">
      <h1 className="heading-xl mb-4">Prompt Not Found</h1>
      <p className="text-lg muted mb-8">
        The prompt you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <div className="flex justify-center gap-3">
        <Link href="/" className="cta cta--pink hover-glow-pink">
          Go Home
        </Link>
        <Link href="/prompts" className="cta cta--blue hover-glow-blue">
          Browse Prompts
        </Link>
      </div>
    </main>
  );
}
