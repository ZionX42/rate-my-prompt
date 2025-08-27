import { render, screen } from '@testing-library/react';
import Navigation from '@/components/Navigation';

describe('Navigation', () => {
  it('renders the navigation bar with logo and links', () => {
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
