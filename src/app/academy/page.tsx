import React from 'react';
import Link from 'next/link';
import { BookOpen, Clock, User, Tag, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Hub Academy - Prompt Hub',
  description: 'Learn AI prompting with tutorials, guides, and best practices from the community',
};

export default function AcademyPage() {
  const tutorials = [
    {
      id: 1,
      title: 'Mastering GPT-5 Prompt Engineering',
      excerpt:
        'Learn advanced techniques for crafting effective prompts that produce consistent, high-quality results with GPT-5.',
      author: 'Dr. Sarah Chen',
      readTime: '15 min read',
      tags: ['GPT-5', 'Advanced', 'Prompt Engineering'],
      publishedAt: '2024-01-15',
      category: 'Advanced Techniques',
    },
    {
      id: 2,
      title: 'Building Effective System Prompts',
      excerpt:
        'Discover how to create system prompts that set the right context and behavior for your AI interactions.',
      author: 'Mike Johnson',
      readTime: '12 min read',
      tags: ['System Prompts', 'Beginner', 'Best Practices'],
      publishedAt: '2024-01-12',
      category: 'Fundamentals',
    },
    {
      id: 3,
      title: 'Prompt Chaining: Multi-Step Workflows',
      excerpt:
        'Explore techniques for breaking complex tasks into manageable steps using prompt chaining strategies.',
      author: 'Alex Rivera',
      readTime: '18 min read',
      tags: ['Workflows', 'Intermediate', 'Automation'],
      publishedAt: '2024-01-10',
      category: 'Advanced Techniques',
    },
    {
      id: 4,
      title: 'Evaluating and Iterating on Prompts',
      excerpt:
        'Learn systematic methods for testing, evaluating, and improving your prompts for better results.',
      author: 'Emma Thompson',
      readTime: '14 min read',
      tags: ['Testing', 'Optimization', 'Quality Assurance'],
      publishedAt: '2024-01-08',
      category: 'Best Practices',
    },
    {
      id: 5,
      title: 'Prompt Templates for Common Tasks',
      excerpt:
        'A comprehensive collection of proven prompt templates for writing, coding, analysis, and creative tasks.',
      author: 'David Kim',
      readTime: '20 min read',
      tags: ['Templates', 'Productivity', 'Reference'],
      publishedAt: '2024-01-05',
      category: 'Resources',
    },
    {
      id: 6,
      title: 'Understanding AI Model Capabilities',
      excerpt:
        'Deep dive into different AI models and how to choose the right one for your specific use case.',
      author: 'Lisa Wang',
      readTime: '16 min read',
      tags: ['Models', 'Beginner', 'Comparison'],
      publishedAt: '2024-01-03',
      category: 'Fundamentals',
    },
  ];

  const categories = [
    { name: 'Fundamentals', count: 12, color: 'bg-blue-100 text-blue-800' },
    { name: 'Advanced Techniques', count: 8, color: 'bg-purple-100 text-purple-800' },
    { name: 'Best Practices', count: 15, color: 'bg-green-100 text-green-800' },
    { name: 'Resources', count: 6, color: 'bg-orange-100 text-orange-800' },
  ];

  return (
    <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="heading-xl mb-4">Hub Academy</h1>
          <p className="text-lg text-subtext max-w-3xl mx-auto">
            Master the art of AI prompting with our comprehensive tutorials, guides, and best
            practices. Learn from experts and elevate your prompting skills to the next level.
          </p>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {categories.map((category) => (
            <div
              key={category.name}
              className="card p-4 text-center hover:shadow-lg transition-shadow"
            >
              <div
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${category.color}`}
              >
                {category.name}
              </div>
              <div className="text-2xl font-bold text-heading">{category.count}</div>
              <div className="text-sm text-subtext">Tutorials</div>
            </div>
          ))}
        </div>

        {/* Featured Tutorial */}
        <div className="card p-8 mb-12 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Featured Tutorial</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-heading mb-4">
                {tutorials[0].title}
              </h2>
              <p className="text-subtext mb-6">{tutorials[0].excerpt}</p>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-subtext">
                  <User className="w-4 h-4" />
                  <span>{tutorials[0].author}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-subtext">
                  <Clock className="w-4 h-4" />
                  <span>{tutorials[0].readTime}</span>
                </div>
              </div>
              <Link
                href={`/academy/${tutorials[0].id}`}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Start Learning
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg p-8 text-center">
                <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
                <div className="text-4xl font-bold text-heading">15 min</div>
                <div className="text-subtext">Estimated read time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tutorial Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {tutorials.slice(1).map((tutorial) => (
            <article key={tutorial.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    tutorial.category === 'Fundamentals'
                      ? 'bg-blue-100 text-blue-800'
                      : tutorial.category === 'Advanced Techniques'
                        ? 'bg-purple-100 text-purple-800'
                        : tutorial.category === 'Best Practices'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {tutorial.category}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-heading mb-3 hover:text-primary transition-colors">
                <Link href={`/academy/${tutorial.id}`}>{tutorial.title}</Link>
              </h3>

              <p className="text-subtext text-sm mb-4 line-clamp-3">{tutorial.excerpt}</p>

              <div className="flex items-center gap-4 mb-4 text-xs text-subtext">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{tutorial.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{tutorial.readTime}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {tutorial.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-surface rounded-full text-xs text-subtext"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                href={`/academy/${tutorial.id}`}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
              >
                Read More
                <ArrowRight className="w-3 h-3" />
              </Link>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="card p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5">
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
      </div>
    </main>
  );
}
