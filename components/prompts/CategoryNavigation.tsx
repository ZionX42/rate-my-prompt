'use client';

import React from 'react';
import Link from 'next/link';
import { PromptCategory } from '@/lib/models/prompt';

interface CategoryStats {
  category: string;
  count: number;
}

interface CategoryNavigationProps {
  categories?: CategoryStats[];
}

const categoryDisplayNames: Record<PromptCategory, string> = {
  general: 'General',
  coding: 'Coding',
  writing: 'Writing',
  design: 'Design',
  marketing: 'Marketing',
  data: 'Data Science',
  other: 'Other',
};

const categoryColors: Record<PromptCategory, string> = {
  general: 'text-accent-blue',
  coding: 'text-accent-green',
  writing: 'text-accent-pink',
  design: 'text-accent-indigo',
  marketing: 'text-hfYellow',
  data: 'text-accent-blue',
  other: 'text-subtext',
};

export default function CategoryNavigation({ categories = [] }: CategoryNavigationProps) {
  // Ensure all categories are represented, even with 0 count
  const allCategories: PromptCategory[] = ['general', 'coding', 'writing', 'design', 'marketing', 'data', 'other'];
  
  const categoryMap = new Map(categories.map(cat => [cat.category, cat.count]));
  
  const categoriesWithCounts = allCategories.map(category => ({
    category,
    count: categoryMap.get(category) || 0,
    displayName: categoryDisplayNames[category],
    color: categoryColors[category],
  }));

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted mb-4">No categories available yet.</p>
        <Link href="/prompts/new" className="text-hfYellow underline underline-offset-4">
          Submit the first prompt
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categoriesWithCounts.map(({ category, count, displayName, color }) => (
          <Link
            key={category}
            href={`/prompts?category=${category}`}
            className="card card-hover p-4 border border-border group transition-all duration-200 hover:border-accent-blue/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${color} group-hover:text-accent-blue transition-colors`}>
                ●
              </span>
              <span className="text-xs text-muted bg-surface px-2 py-1 rounded-full">
                {count}
              </span>
            </div>
            <h3 className="font-semibold text-heading group-hover:text-accent-blue transition-colors">
              {displayName}
            </h3>
            <p className="text-xs text-muted mt-1">
              {count === 0 ? 'No prompts yet' : 
               count === 1 ? '1 prompt' : 
               `${count} prompts`}
            </p>
          </Link>
        ))}
      </div>

      {/* Browse All Link */}
      <div className="text-center">
        <Link
          href="/prompts"
          className="inline-flex items-center gap-2 text-accent-blue hover:text-accent-blue/80 font-medium underline underline-offset-4"
        >
          Browse All Prompts
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
