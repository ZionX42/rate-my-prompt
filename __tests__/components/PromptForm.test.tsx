import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PromptForm from '@/components/prompts/PromptForm';

describe('PromptForm', () => {
  it('renders required fields', () => {
    render(<PromptForm />);
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Author ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
  });

  it('validates client-side and shows errors', async () => {
    render(<PromptForm />);
    fireEvent.click(screen.getByRole('button', { name: /submit prompt/i }));
    expect(await screen.findByText(/Title must be at least 3 characters/)).toBeInTheDocument();
    expect(await screen.findByText(/Content must be at least 10 characters/)).toBeInTheDocument();
    expect(await screen.findByText(/authorId is required/)).toBeInTheDocument();
  });

  it('submits and shows success message', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ prompt: { _id: 'abc123' } }),
    });
    // @ts-expect-error: Mocking global.fetch for testing
    global.fetch = mockFetch;

    render(<PromptForm />);

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'My Prompt' } });
    fireEvent.change(screen.getByLabelText(/Content/i), {
      target: { value: 'This is the prompt content.' },
    });
    fireEvent.change(screen.getByLabelText(/Author ID/i), { target: { value: 'user-1' } });

    fireEvent.click(screen.getByRole('button', { name: /submit prompt/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(await screen.findByText(/Submitted!/i)).toBeInTheDocument();
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it('shows server validation errors', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Validation failed',
        issues: [{ path: 'title', message: 'bad' }],
      }),
    });
    // @ts-expect-error: Mocking global.fetch for testing
    global.fetch = mockFetch;

    render(<PromptForm />);
    // Provide valid client-side values so submission proceeds and server returns validation errors
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Valid Title' } });
    fireEvent.change(screen.getByLabelText(/Content/i), {
      target: { value: 'This content is long enough.' },
    });
    fireEvent.change(screen.getByLabelText(/Author ID/i), { target: { value: 'user-1' } });
    fireEvent.click(screen.getByRole('button', { name: /submit prompt/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(await screen.findByText(/Submission failed|Validation failed/)).toBeInTheDocument();
  });
});
