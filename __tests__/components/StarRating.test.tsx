import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { StarRating, RatingSubmission } from '@/components/ratings/StarRating';

describe('StarRating Component', () => {
  it('renders 5 stars', () => {
    render(<StarRating />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });

  it('shows correct number of filled stars for value', () => {
    render(<StarRating value={3} readOnly />);
    const stars = screen.getAllByRole('button');
    
    // Check that first 3 stars have filled color
    expect(stars[0].querySelector('svg')).toHaveClass('fill-yellow-400');
    expect(stars[1].querySelector('svg')).toHaveClass('fill-yellow-400');
    expect(stars[2].querySelector('svg')).toHaveClass('fill-yellow-400');
    expect(stars[3].querySelector('svg')).toHaveClass('fill-gray-200');
    expect(stars[4].querySelector('svg')).toHaveClass('fill-gray-200');
  });

  it('calls onChange when star is clicked', () => {
    const handleChange = jest.fn();
    render(<StarRating onChange={handleChange} />);
    
    const fourthStar = screen.getAllByRole('button')[3];
    fireEvent.click(fourthStar);
    
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it('does not call onChange when readOnly', () => {
    const handleChange = jest.fn();
    render(<StarRating readOnly onChange={handleChange} />);
    
    const firstStar = screen.getAllByRole('button')[0];
    fireEvent.click(firstStar);
    
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('shows rating value when showValue is true', () => {
    render(<StarRating value={4.5} showValue />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('has correct aria labels', () => {
    render(<StarRating />);
    expect(screen.getByLabelText('Rate 1 star')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 5 stars')).toBeInTheDocument();
  });
});

describe('RatingSubmission Component', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders rating form', () => {
    render(<RatingSubmission promptId="test-prompt" userId="test-user" />);
    
    expect(screen.getByText('Your Rating')).toBeInTheDocument();
    expect(screen.getByLabelText('Comment (Optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit rating/i })).toBeInTheDocument();
  });

  it('shows error when no rating selected', async () => {
    render(<RatingSubmission promptId="test-prompt" userId="test-user" />);
    
    const submitButton = screen.getByRole('button', { name: /submit rating/i });
    
    // Button should be disabled when no rating is selected
    expect(submitButton).toBeDisabled();
    
    // Force the form submission event
    const form = submitButton.closest('form')!;
    fireEvent.submit(form);
    
    expect(await screen.findByText('Please select a rating')).toBeInTheDocument();
  });

  it('submits rating successfully', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ message: 'Rating submitted successfully!' }),
    };
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as Response);
    
    const handleSubmit = jest.fn();
    render(
      <RatingSubmission 
        promptId="test-prompt" 
        userId="test-user" 
        onSubmit={handleSubmit}
      />
    );
    
    // Select rating
    const fourthStar = screen.getAllByRole('button')[3]; // 4 stars
    fireEvent.click(fourthStar);
    
    // Add comment
    const commentField = screen.getByLabelText('Comment (Optional)');
    fireEvent.change(commentField, { target: { value: 'Great prompt!' } });
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /submit rating/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/prompts/test-prompt/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          rating: 4,
          comment: 'Great prompt!',
        }),
      });
    });
    
    expect(await screen.findByText('Rating submitted successfully!')).toBeInTheDocument();
    expect(handleSubmit).toHaveBeenCalledWith({
      rating: 4,
      comment: 'Great prompt!',
    });
  });

  it('shows error on failed submission', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({ error: 'Validation failed' }),
    };
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as Response);
    
    render(<RatingSubmission promptId="test-prompt" userId="test-user" />);
    
    // Select rating
    const firstStar = screen.getAllByRole('button')[0];
    fireEvent.click(firstStar);
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /submit rating/i });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText('Validation failed')).toBeInTheDocument();
  });

  it('shows character count for comment', () => {
    render(<RatingSubmission promptId="test-prompt" userId="test-user" />);
    
    const commentField = screen.getByLabelText('Comment (Optional)');
    fireEvent.change(commentField, { target: { value: 'Hello' } });
    
    expect(screen.getByText('5/500 characters')).toBeInTheDocument();
  });

  it('shows existing rating and comment', () => {
    render(
      <RatingSubmission 
        promptId="test-prompt" 
        userId="test-user"
        existingRating={3}
        existingComment="Previously rated"
      />
    );
    
    const commentField = screen.getByLabelText('Comment (Optional)') as HTMLTextAreaElement;
    expect(commentField.value).toBe('Previously rated');
    expect(screen.getByRole('button', { name: /update rating/i })).toBeInTheDocument();
  });
});
