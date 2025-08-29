import { render, screen } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';

// Mock next/navigation for components using useRouter (e.g., SearchInput inside Navigation)
const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

describe('Navigation', () => {
  it('renders the navigation bar with logo and links', async () => {
    const { default: Navigation } = await import('@/components/Navigation');
    render(<Navigation />);
    
    // Check for logo/brand
    expect(screen.getByText('Prompt Hub')).toBeInTheDocument();
    
    // Check for main navigation links (these appear in both mobile and desktop views)
    expect(screen.getAllByText('Prompts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Categories').length).toBeGreaterThan(0);
    expect(screen.getAllByText('About').length).toBeGreaterThan(0);
    
    // Check for auth links
    expect(screen.getAllByText('Log in').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sign up').length).toBeGreaterThan(0);
  });
});
