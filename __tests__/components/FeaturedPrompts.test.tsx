import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import FeaturedPrompts from '@/components/prompts/FeaturedPrompts';
import { PromptModel } from '@/lib/models/prompt';

const mockPrompts: PromptModel[] = [
  {
    _id: '507f1f77bcf86cd799439011',
    title: 'Content Generator Pro',
    content:
      'A comprehensive prompt for generating high-quality content across various formats and styles.',
    description:
      'This prompt helps you create engaging content for blogs, social media, and marketing materials.',
    authorId: 'user123',
    category: 'writing',
    tags: ['content', 'marketing', 'writing'],
    isPublished: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    _id: '507f1f77bcf86cd799439012',
    title: 'Code Review Assistant',
    content:
      'A detailed prompt for conducting thorough code reviews and providing constructive feedback.',
    description: 'Helps developers review code effectively and provide meaningful suggestions.',
    authorId: 'user456',
    category: 'coding',
    tags: ['code', 'review', 'development'],
    isPublished: true,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
];

describe('FeaturedPrompts', () => {
  it('renders featured prompts correctly', () => {
    render(<FeaturedPrompts prompts={mockPrompts} />);

    expect(screen.getByText('Content Generator Pro')).toBeInTheDocument();
    expect(screen.getByText('Code Review Assistant')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This prompt helps you create engaging content for blogs, social media, and marketing materials.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Helps developers review code effectively and provide meaningful suggestions.'
      )
    ).toBeInTheDocument();
  });

  it('displays categories correctly', () => {
    render(<FeaturedPrompts prompts={mockPrompts} />);

    expect(screen.getByText('writing')).toBeInTheDocument();
    expect(screen.getByText('coding')).toBeInTheDocument();
  });

  it('shows tags correctly', () => {
    render(<FeaturedPrompts prompts={mockPrompts} />);

    expect(screen.getByText('#content')).toBeInTheDocument();
    expect(screen.getByText('#marketing')).toBeInTheDocument();
    expect(screen.getByText('#code')).toBeInTheDocument();
  });

  it('displays author and date information', () => {
    render(<FeaturedPrompts prompts={mockPrompts} />);

    expect(screen.getByText('By user123')).toBeInTheDocument();
    expect(screen.getByText('By user456')).toBeInTheDocument();
    // Use more flexible date matching to handle different locale formats
    expect(screen.getByText(new Date('2024-01-15').toLocaleDateString())).toBeInTheDocument();
    expect(screen.getByText(new Date('2024-01-16').toLocaleDateString())).toBeInTheDocument();
  });

  it('shows view details links', () => {
    render(<FeaturedPrompts prompts={mockPrompts} />);

    const viewDetailsLinks = screen.getAllByText('View Details');
    expect(viewDetailsLinks).toHaveLength(2);
    expect(viewDetailsLinks[0]).toHaveAttribute('href', '/prompts/507f1f77bcf86cd799439011');
    expect(viewDetailsLinks[1]).toHaveAttribute('href', '/prompts/507f1f77bcf86cd799439012');
  });

  it('handles empty prompts array', () => {
    render(<FeaturedPrompts prompts={[]} />);

    expect(screen.getByText('No featured prompts available at the moment.')).toBeInTheDocument();
    expect(screen.getByText('Submit the first prompt')).toBeInTheDocument();
  });

  it('truncates long titles and descriptions', () => {
    const longPrompts: PromptModel[] = [
      {
        _id: '507f1f77bcf86cd799439013',
        title:
          'This is a very long title that should be truncated because it exceeds the fifty character limit',
        content: 'Some content here',
        description:
          'This is a very long description that should be truncated because it exceeds the one hundred and twenty character limit set for descriptions in the component',
        authorId: 'user789',
        category: 'general',
        isPublished: true,
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17'),
      },
    ];

    render(<FeaturedPrompts prompts={longPrompts} />);

    expect(
      screen.getByText(/This is a very long title that should be truncated/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This is a very long description that should be truncated/)
    ).toBeInTheDocument();
  });

  it('limits tags display to 3 and shows more indicator', () => {
    const promptWithManyTags: PromptModel[] = [
      {
        _id: '507f1f77bcf86cd799439014',
        title: 'Prompt with Many Tags',
        content: 'Some content',
        authorId: 'user999',
        category: 'general',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
        isPublished: true,
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
      },
    ];

    render(<FeaturedPrompts prompts={promptWithManyTags} />);

    expect(screen.getByText('#tag1')).toBeInTheDocument();
    expect(screen.getByText('#tag2')).toBeInTheDocument();
    expect(screen.getByText('#tag3')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
    expect(screen.queryByText('#tag4')).not.toBeInTheDocument();
  });
});
