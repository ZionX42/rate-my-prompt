import { render, screen, fireEvent } from '@testing-library/react';
import CommentForm from '@/components/comments/CommentForm';

describe('CommentForm', () => {
  it('submits trimmed content and clears input', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<CommentForm onSubmit={onSubmit} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '  hello  ' } });
    fireEvent.click(screen.getByRole('button', { name: /post/i }));

    expect(onSubmit).toHaveBeenCalledWith('hello');
  });
});
