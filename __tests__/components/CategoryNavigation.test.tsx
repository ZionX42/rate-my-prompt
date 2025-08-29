import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import CategoryNavigation from '@/components/prompts/CategoryNavigation';

const mockCategoryStats = [
  { category: 'coding', count: 15 },
  { category: 'writing', count: 8 },
  { category: 'marketing', count: 3 },
  { category: 'general', count: 12 },
];

describe('CategoryNavigation', () => {
  it('renders all categories with counts', () => {
    render(<CategoryNavigation categories={mockCategoryStats} />);
    
    expect(screen.getByText('Coding')).toBeInTheDocument();
    expect(screen.getByText('Writing')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Data Science')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('displays correct counts for categories', () => {
    render(<CategoryNavigation categories={mockCategoryStats} />);
    
    expect(screen.getByText('15')).toBeInTheDocument(); // coding
    expect(screen.getByText('8')).toBeInTheDocument();  // writing
    expect(screen.getByText('3')).toBeInTheDocument();  // marketing
    expect(screen.getByText('12')).toBeInTheDocument(); // general
  });

  it('shows zero counts for categories not in stats', () => {
    render(<CategoryNavigation categories={mockCategoryStats} />);
    
    // Design, Data Science, and Other should show 0 as they're not in mockCategoryStats
    const zeroCountElements = screen.getAllByText('0');
    expect(zeroCountElements.length).toBeGreaterThanOrEqual(3);
  });

  it('displays correct prompt count text', () => {
    render(<CategoryNavigation categories={mockCategoryStats} />);
    
    expect(screen.getByText('15 prompts')).toBeInTheDocument();
    expect(screen.getByText('8 prompts')).toBeInTheDocument();
    expect(screen.getByText('3 prompts')).toBeInTheDocument();
    
    // Check that there are multiple "No prompts yet" for categories with 0 count
    const noPromptsElements = screen.getAllByText('No prompts yet');
    expect(noPromptsElements.length).toBeGreaterThan(0);
  });

  it('creates correct links for each category', () => {
    render(<CategoryNavigation categories={mockCategoryStats} />);
    
    const codingLink = screen.getByRole('link', { name: /coding/i });
    expect(codingLink).toHaveAttribute('href', '/prompts?category=coding');
    
    const writingLink = screen.getByRole('link', { name: /writing/i });
    expect(writingLink).toHaveAttribute('href', '/prompts?category=writing');
  });

  it('shows browse all prompts link', () => {
    render(<CategoryNavigation categories={mockCategoryStats} />);
    
    const browseAllLink = screen.getByRole('link', { name: /browse all prompts/i });
    expect(browseAllLink).toHaveAttribute('href', '/prompts');
  });

  it('handles empty categories array', () => {
    render(<CategoryNavigation categories={[]} />);
    
    expect(screen.getByText('No categories available yet.')).toBeInTheDocument();
    expect(screen.getByText('Submit the first prompt')).toBeInTheDocument();
  });

  it('handles single prompt count correctly', () => {
    const singlePromptStats = [
      { category: 'coding', count: 1 },
    ];
    
    render(<CategoryNavigation categories={singlePromptStats} />);
    
    expect(screen.getByText('1 prompt')).toBeInTheDocument();
  });

  it('renders all category display names correctly', () => {
    render(<CategoryNavigation categories={mockCategoryStats} />);
    
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Coding')).toBeInTheDocument();
    expect(screen.getByText('Writing')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Data Science')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });
});
