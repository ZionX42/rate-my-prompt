import React from 'react';
import Link from 'next/link';
import { MessageSquare, Users, TrendingUp, Clock } from 'lucide-react';

export const metadata = {
  title: 'Community - Prompt Hub',
  description: 'Join discussions, share ideas, and connect with the AI prompt community',
};

export default function CommunityPage() {
  const categories = [
    {
      id: 'general',
      name: 'General Discussion',
      description: 'General discussions about AI prompts and workflows',
      icon: MessageSquare,
      threads: 1247,
      posts: 8923,
      lastActivity: '2 hours ago',
    },
    {
      id: 'help',
      name: 'Help & Support',
      description: 'Get help with prompts, troubleshooting, and best practices',
      icon: Users,
      threads: 856,
      posts: 5432,
      lastActivity: '15 minutes ago',
    },
    {
      id: 'showcase',
      name: 'Prompt Showcase',
      description: 'Share your best prompts and get feedback from the community',
      icon: TrendingUp,
      threads: 634,
      posts: 3456,
      lastActivity: '1 hour ago',
    },
    {
      id: 'off-topic',
      name: 'Off Topic',
      description: 'Casual conversations and off-topic discussions',
      icon: Clock,
      threads: 423,
      posts: 2341,
      lastActivity: '3 hours ago',
    },
  ];

  const recentThreads = [
    {
      id: 1,
      title: 'Best practices for GPT-4 prompt engineering',
      author: 'promptmaster',
      replies: 23,
      lastReply: '5 minutes ago',
      category: 'help',
    },
    {
      id: 2,
      title: 'New prompt template for content generation',
      author: 'contentcreator',
      replies: 12,
      lastReply: '15 minutes ago',
      category: 'showcase',
    },
    {
      id: 3,
      title: 'Discussion: The future of AI prompting',
      author: 'futurethinker',
      replies: 45,
      lastReply: '1 hour ago',
      category: 'general',
    },
    {
      id: 4,
      title: 'Help with complex multi-step prompts',
      author: 'beginner',
      replies: 8,
      lastReply: '2 hours ago',
      category: 'help',
    },
  ];

  return (
    <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-xl mb-4">Community</h1>
          <p className="text-lg text-subtext max-w-2xl">
            Join discussions, share your knowledge, and connect with fellow AI enthusiasts. Our
            community forum is the perfect place to learn, teach, and collaborate.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-heading">3,156</div>
            <div className="text-sm text-subtext">Total Threads</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-heading">12,847</div>
            <div className="text-sm text-subtext">Total Posts</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-heading">2,341</div>
            <div className="text-sm text-subtext">Active Members</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-heading">156</div>
            <div className="text-sm text-subtext">Online Now</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Categories */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-heading mb-6">Categories</h2>
            <div className="space-y-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.id} className="card p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-heading mb-2">
                          <Link href={`/community/${category.id}`} className="hover:underline">
                            {category.name}
                          </Link>
                        </h3>
                        <p className="text-subtext mb-3">{category.description}</p>
                        <div className="flex items-center gap-4 text-sm text-subtext">
                          <span>{category.threads} threads</span>
                          <span>{category.posts} posts</span>
                          <span>Last activity: {category.lastActivity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Recent Threads */}
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold text-heading mb-4">Recent Threads</h3>
              <div className="space-y-3">
                {recentThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className="border-b border-border pb-3 last:border-b-0 last:pb-0"
                  >
                    <h4 className="font-medium text-heading text-sm mb-1">
                      <Link href={`/community/thread/${thread.id}`} className="hover:underline">
                        {thread.title}
                      </Link>
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-subtext">
                      <span>by {thread.author}</span>
                      <span>•</span>
                      <span>{thread.replies} replies</span>
                      <span>•</span>
                      <span>{thread.lastReply}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-heading mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/community/new-thread"
                  className="block w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-center font-medium hover:bg-primary/90 transition-colors"
                >
                  Start New Thread
                </Link>
                <Link
                  href="/community/guidelines"
                  className="block w-full border border-border px-4 py-2 rounded-md text-center font-medium hover:bg-accent transition-colors"
                >
                  Community Guidelines
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
