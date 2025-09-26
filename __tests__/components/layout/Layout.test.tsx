import { render } from '@testing-library/react';
import { expect } from '@jest/globals';
import '@testing-library/jest-dom';
import { Container, Grid, Section } from '@/components/layout';

describe('Layout Components', () => {
  describe('Container', () => {
    it('renders with default props', () => {
      const { container } = render(<Container>Test content</Container>);
      const div = container.firstChild;
      expect(div).toHaveClass('mx-auto');
      expect(div).toHaveClass('max-w-xl');
      expect(div).toHaveClass('px-4');
    });

    it('accepts custom max width', () => {
      const { container } = render(<Container maxWidth="md">Test content</Container>);
      const div = container.firstChild;
      expect(div).toHaveClass('max-w-md');
    });

    it('renders as different element', () => {
      const { container } = render(<Container as="section">Test content</Container>);
      expect(container.querySelector('section')).toBeInTheDocument();
    });
  });

  describe('Grid', () => {
    it('renders with default props', () => {
      const { container } = render(<Grid>Test content</Grid>);
      const div = container.firstChild;
      expect(div).toHaveClass('grid');
      expect(div).toHaveClass('grid-cols-1');
      expect(div).toHaveClass('sm:grid-cols-2');
      expect(div).toHaveClass('md:grid-cols-3');
      expect(div).toHaveClass('lg:grid-cols-4');
    });

    it('accepts custom columns config', () => {
      const { container } = render(<Grid cols={{ default: 2, md: 4 }}>Test content</Grid>);
      const div = container.firstChild;
      expect(div).toHaveClass('grid-cols-2');
      expect(div).toHaveClass('md:grid-cols-4');
    });
  });

  describe('Section', () => {
    it('renders with default props', () => {
      const { container } = render(<Section>Test content</Section>);
      const section = container.firstChild as HTMLElement;
      expect(section).toHaveClass('py-12');
      expect(section.tagName.toLowerCase()).toBe('section');
    });

    it('accepts custom component type', () => {
      const { container } = render(<Section as="div">Test content</Section>);
      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });
});
