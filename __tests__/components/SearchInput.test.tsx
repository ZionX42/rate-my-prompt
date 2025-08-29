import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock next/navigation BEFORE importing the component under test
const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

describe('SearchInput', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('navigates to /search with query on submit', async () => {
    const { default: SearchInput } = await import('@/components/ui/SearchInput');
    render(<SearchInput />);

    const input = screen.getByRole('textbox', { name: /search prompts/i });
    fireEvent.change(input, { target: { value: '  gpt  ' } });

    const btn = screen.getByRole('button', { name: /submit search/i });
    fireEvent.click(btn);

    expect(push).toHaveBeenCalledWith('/search?q=gpt');
  });

  it('does nothing for empty input', async () => {
    const { default: SearchInput } = await import('@/components/ui/SearchInput');
    render(<SearchInput />);

    const btn = screen.getByRole('button', { name: /submit search/i });
    fireEvent.click(btn);

    expect(push).not.toHaveBeenCalled();
  });
});
