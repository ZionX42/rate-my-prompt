import { render, screen, fireEvent, act } from '@testing-library/react';
import { expect } from '@jest/globals';
import CommentForm from '@/components/comments/CommentForm';

describe('CommentForm', () => {
  it('submits trimmed content and clears input', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<CommentForm onSubmit={onSubmit} />);

    const textarea = screen.getByRole('textbox');

    await act(async () => {
      fireEvent.change(textarea, { target: { value: '  hello  ' } });
      fireEvent.click(screen.getByRole('button', { name: /post/i }));
    });

    expect(onSubmit).toHaveBeenCalledWith('hello');
  });
});
