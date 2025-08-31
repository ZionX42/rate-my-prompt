import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Filters', () => {
  it('pushes query params on apply', () => {
    const Filters = require('@/components/search/Filters').default;
    const { container } = render(<Filters />);
    const input = container.querySelector('input');
    const form = container.querySelector('form');
    expect(input).toBeTruthy();
    if (!input || !form) return;

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(form);

    expect(push).toHaveBeenCalledWith('/search?q=test&sort=relevance');
  });
});
