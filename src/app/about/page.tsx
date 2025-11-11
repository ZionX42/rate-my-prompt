import React from 'react';
import Link from 'next/link';
import { Users, Target, Heart, Award, BookOpen, Zap } from 'lucide-react';

export const metadata = {
  title: 'About - Prompt Hub',
  description:
    'Learn about Prompt Hub - the premier platform for AI prompt discovery, sharing, and collaboration',
};

export default function AboutPage() {
  const stats = [
    { label: 'Active Users', value: '50K+', icon: Users },
    { label: 'Prompts Shared', value: '100K+', icon: BookOpen },
    { label: 'Categories', value: '25+', icon: Target },
    { label: 'Countries', value: '120+', icon: Award },
  ];

  const values = [
    {
      icon: Heart,
      title: 'Community First',
      description:
        'We believe in the power of collaboration and open sharing within the AI community.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description:
        'Constantly evolving to provide the best tools and resources for prompt engineering.',
    },
    {
      icon: Users,
      title: 'Accessibility',
      description:
        'Making advanced AI prompting techniques accessible to everyone, from beginners to experts.',
    },
    {
      icon: Award,
      title: 'Quality',
      description: 'Maintaining high standards through community curation and expert validation.',
    },
  ];

  const team = [
    {
      name: 'Rick Nassar',
      role: 'Founder & CEO',
      bio: 'Former Cybersecurity Analyst with 10+ years in system administration and prompt engineering.',
      image: '/api/placeholder/150/150',
    },
    {
      name: 'YOUR NAME',
      role: 'CTO',
      bio: 'Full-stack developer specializing in AI applications and scalable web platforms.',
      image: '/api/placeholder/150/150',
    },
    {
      name: 'YOUR NAME',
      role: 'Head of Research',
      bio: 'PhD in Computer Science, focused on natural language processing and AI ethics.',
      image: '/api/placeholder/150/150',
    },
  ];

  return (
    <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="heading-xl mb-6">About Prompt Hub</h1>
          <p className="text-xl text-subtext max-w-3xl mx-auto">
            We&apos;re building the world&apos;s most comprehensive platform for AI prompt
            discovery, sharing, and collaboration. Our mission is to democratize access to
            high-quality AI prompts and foster a thriving community of prompt engineers.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card p-6 text-center">
                <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-heading mb-1">{stat.value}</div>
                <div className="text-sm text-subtext">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Our Story */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-heading mb-6">Our Story</h2>
            <div className="space-y-4 text-subtext">
              <p>
                Prompt Hub was born from a simple observation: the AI community was creating
                incredible prompts, but there was no centralized place to discover, share, and learn
                from them. What started as a small project among AI enthusiasts has grown into a
                global platform serving thousands of users.
              </p>
              <p>
                We believe that the future of AI lies in collaboration and open sharing. By
                providing a platform where prompt engineers can showcase their work, learn from
                others, and build upon existing knowledge, we&apos;re helping to accelerate AI
                innovation worldwide.
              </p>
              <p>
                Today, Prompt Hub is more than just a repository—it&apos;s a vibrant community where
                beginners learn from experts, ideas are shared freely, and the collective knowledge
                of the AI community grows stronger every day.
              </p>
            </div>
          </div>
          <div className="card p-8">
            <h3 className="text-xl font-semibold text-heading mb-4">What We Offer</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-subtext">
                  Comprehensive prompt library with advanced search and filtering
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-subtext">
                  Community-driven ratings and reviews for quality assurance
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-subtext">
                  Educational resources and tutorials for all skill levels
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-subtext">
                  Active community forum for discussions and support
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-subtext">
                  Version control and collaboration tools for prompt development
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-heading text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="card p-6 text-center">
                  <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-heading mb-3">{value.title}</h3>
                  <p className="text-subtext text-sm">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-heading text-center mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="card p-6 text-center">
                <div className="w-24 h-24 bg-surface rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-heading mb-1">{member.name}</h3>
                <p className="text-primary font-medium mb-3">{member.role}</p>
                <p className="text-subtext text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5">
          <h2 className="text-2xl font-bold text-heading mb-4">Join Our Community</h2>
          <p className="text-subtext mb-6 max-w-2xl mx-auto">
            Be part of the growing community of AI enthusiasts, prompt engineers, and innovators who
            are shaping the future of artificial intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/prompts"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Explore Prompts
            </Link>
            <Link
              href="/community"
              className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors"
            >
              Join Discussion
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
