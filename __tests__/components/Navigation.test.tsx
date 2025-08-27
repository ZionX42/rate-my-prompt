import { render, screen } from '@testing-library/react';
import Navigation from '@/components/Navigation';

describe('Navigation', () => {
  it('renders the navigation bar with logo and links', () => {
    render(<Navigation />);
    
    // Check for logo/brand
    expect(screen.getByText('Prompt Hub')).toBeInTheDocument();
    
    // Check for main navigation links
    expect(screen.getByText('Prompts')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    
    // Check for auth links
    expect(screen.getByText('Log in')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });
});
