'use client';

import React from 'react';

export default function NewsletterSignup() {
  return (
    <div
      className="card p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5"
      suppressHydrationWarning={true}
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
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
          suppressHydrationWarning={true}
        />
        <button
          type="button"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          suppressHydrationWarning={true}
        >
          Subscribe
        </button>
      </div>
    </div>
  );
}
