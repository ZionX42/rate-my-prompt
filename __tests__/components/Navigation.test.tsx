import { render, screen } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuthModalProvider } from '@/components/auth/AuthModalProvider';

const mockUseAppwriteAuth = jest.fn();

jest.mock('@/hooks/useAppwriteAuth', () => ({
  useAppwriteAuth: (...args: unknown[]) => mockUseAppwriteAuth(...args),
}));

// Mock next/navigation for components using useRouter (e.g., SearchInput inside Navigation)
const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/',
}));

describe('Navigation', () => {
  beforeEach(() => {
    mockUseAppwriteAuth.mockReturnValue({
      status: 'unauthenticated',
      user: null,
      error: null,
      ready: true,
      missingEnv: [],
      signup: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refresh: jest.fn(),
      clearError: jest.fn(),
    });
  });

  it('renders the navigation bar with logo and links', async () => {
    const { default: Navigation } = await import('@/components/Navigation');
    render(
      <AuthModalProvider>
        <Navigation />
      </AuthModalProvider>
    );

    // Check for logo/brand
    expect(screen.getByText('Prompt Hub')).toBeTruthy();

    // Check for main navigation links (these appear in both mobile and desktop views)
    expect(screen.getAllByText('Community').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Academy').length).toBeGreaterThan(0);
    expect(screen.getAllByText('About').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Contact').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Feedback').length).toBeGreaterThan(0);

    // Check for auth links
    expect(screen.getAllByText('Log in').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sign up').length).toBeGreaterThan(0);
  });
});
