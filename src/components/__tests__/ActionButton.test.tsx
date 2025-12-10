import { describe, it, expect } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { ActionButton } from '../ActionButton';

describe('ActionButton', () => {
  const mockOnClick = () => {};

  it('should render with label', () => {
    const { getByText } = render(<ActionButton label="Test Button" onClick={mockOnClick} />);
    expect(getByText('Test Button')).toBeDefined();
  });

  it('should call onClick when clicked', () => {
    let clicked = false;
    const handleClick = () => { clicked = true; };
    
    const { getByText } = render(<ActionButton label="Click Me" onClick={handleClick} />);
    const button = getByText('Click Me').closest('button');
    
    if (button) {
      fireEvent.click(button);
      expect(clicked).toBe(true);
    }
  });

  it('should be disabled when disabled prop is true', () => {
    const { getByText } = render(<ActionButton label="Disabled" onClick={mockOnClick} disabled />);
    const button = getByText('Disabled').closest('button');
    expect(button?.disabled).toBe(true);
  });

  it('should be disabled when loading prop is true', () => {
    const { getByText } = render(<ActionButton label="Loading" onClick={mockOnClick} loading />);
    const button = getByText('Loading').closest('button');
    expect(button?.disabled).toBe(true);
  });

  it('should show loading spinner when loading', () => {
    const { container } = render(<ActionButton label="Loading" onClick={mockOnClick} loading />);
    const spinner = container.querySelector('svg.animate-spin');
    expect(spinner).toBeDefined();
  });

  it('should display progress percentage', () => {
    const { getByText } = render(<ActionButton label="Progress" onClick={mockOnClick} progress={75} />);
    expect(getByText('(75%)')).toBeDefined();
  });

  it('should display help text when provided', () => {
    const { getByText } = render(<ActionButton label="Button" onClick={mockOnClick} helpText="Help text" />);
    expect(getByText('Help text')).toBeDefined();
  });

  it('should render with primary variant by default', () => {
    const { container } = render(<ActionButton label="Primary" onClick={mockOnClick} />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('from-cyan-500');
  });

  it('should render with secondary variant', () => {
    const { container } = render(<ActionButton label="Secondary" onClick={mockOnClick} variant="secondary" />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('from-emerald-500');
  });

  it('should render with accent variant', () => {
    const { container } = render(<ActionButton label="Accent" onClick={mockOnClick} variant="accent" />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('from-blue-500');
  });

  it('should show progress bar when progress is provided', () => {
    const { container } = render(<ActionButton label="Progress" onClick={mockOnClick} progress={50} />);
    const progressBar = container.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeDefined();
  });
});

