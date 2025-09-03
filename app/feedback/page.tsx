'use client';

import React, { useState } from 'react';
import { Star, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    rating: 0,
    subject: '',
    message: '',
    allowContact: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categories = [
    { value: 'bug', label: 'Bug Report', description: 'Report a technical issue or bug' },
    {
      value: 'feature',
      label: 'Feature Request',
      description: 'Suggest a new feature or improvement',
    },
    { value: 'usability', label: 'Usability Issue', description: 'Difficulty using the platform' },
    { value: 'content', label: 'Content Quality', description: 'Issues with prompts or content' },
    { value: 'performance', label: 'Performance', description: 'Speed or loading issues' },
    { value: 'other', label: 'Other', description: 'General feedback or suggestions' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (formData.rating === 0) {
      newErrors.rating = 'Please provide a rating';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors((prev) => ({ ...prev, rating: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        category: '',
        rating: 0,
        subject: '',
        message: '',
        allowContact: false,
      });
    }, 5000);
  };

  if (isSubmitted) {
    return (
      <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card p-12">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-heading mb-4">Thank You!</h1>
            <p className="text-lg text-subtext mb-6">
              Your feedback has been submitted successfully. We appreciate you taking the time to
              help us improve Prompt Hub.
            </p>
            <p className="text-subtext">
              We'll review your feedback and get back to you if you provided contact information.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="heading-xl mb-4">Share Your Feedback</h1>
          <p className="text-lg text-subtext max-w-2xl mx-auto">
            Help us improve Prompt Hub by sharing your thoughts, reporting issues, or suggesting new
            features. Your feedback is valuable to us!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feedback Form */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-heading mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.name ? 'border-red-500' : 'border-border'
                      }`}
                      placeholder="Your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-heading mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.email ? 'border-red-500' : 'border-border'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-heading mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.category ? 'border-red-500' : 'border-border'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">
                    Overall Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= formData.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-subtext">
                      {formData.rating > 0 &&
                        `${formData.rating} star${formData.rating > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  {errors.rating && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.rating}
                    </p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-heading mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.subject ? 'border-red-500' : 'border-border'
                    }`}
                    placeholder="Brief summary of your feedback"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.subject}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-heading mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-vertical ${
                      errors.message ? 'border-red-500' : 'border-border'
                    }`}
                    placeholder="Please provide detailed feedback..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Contact Permission */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="allowContact"
                    name="allowContact"
                    checked={formData.allowContact}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <label htmlFor="allowContact" className="text-sm text-subtext">
                    I allow Prompt Hub to contact me regarding this feedback for clarification or
                    follow-up questions.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category Info */}
            {formData.category && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-heading mb-3">Selected Category</h3>
                {(() => {
                  const selectedCat = categories.find((cat) => cat.value === formData.category);
                  return selectedCat ? (
                    <div>
                      <div className="font-medium text-heading">{selectedCat.label}</div>
                      <div className="text-sm text-subtext mt-1">{selectedCat.description}</div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Tips */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-heading mb-3">Tips for Better Feedback</h3>
              <ul className="space-y-2 text-sm text-subtext">
                <li>• Be specific about the issue or suggestion</li>
                <li>• Include steps to reproduce bugs</li>
                <li>• Mention your browser and device if relevant</li>
                <li>• Provide context about your use case</li>
              </ul>
            </div>

            {/* Alternative Contact */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-heading mb-3">Other Ways to Reach Us</h3>
              <div className="space-y-3">
                <a href="/contact" className="block text-primary hover:underline text-sm">
                  General Contact Form
                </a>
                <a href="/community" className="block text-primary hover:underline text-sm">
                  Community Forum
                </a>
                <a
                  href="mailto:feedback@prompt-hub.com"
                  className="block text-primary hover:underline text-sm"
                >
                  feedback@prompt-hub.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
