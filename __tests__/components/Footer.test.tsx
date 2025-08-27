import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

describe('Footer', () => {
  it('renders footer with all required sections', () => {
    render(<Footer />);
    
    // Check for company info
    expect(screen.getByText('Prompt Hub')).toBeInTheDocument();
    expect(screen.getByText(/premier platform for discovering/)).toBeInTheDocument();
    
    // Check for quick links
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('Browse Prompts')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    
    // Check for legal links
    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    
    // Check for copyright
    expect(screen.getByText(/© 2025 Prompt Hub/)).toBeInTheDocument();
  });
});
