import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { StatsCard } from '../StatsCard';

describe('StatsCard', () => {
  it('should render icon, label, and value', () => {
    const { getByText } = render(<StatsCard icon="📊" label="Total Responses" value={123} />);
    
    expect(getByText('📊')).toBeDefined();
    expect(getByText('Total Responses')).toBeDefined();
    expect(getByText('123')).toBeDefined();
  });

  it('should render with blue color by default', () => {
    const { container } = render(<StatsCard icon="📊" label="Test" value={0} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('from-blue-500/20');
  });

  it('should render with purple color', () => {
    const { container } = render(<StatsCard icon="💡" label="Themes" value={5} color="purple" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('from-indigo-500/20');
  });

  it('should render with pink color', () => {
    const { container } = render(<StatsCard icon="📦" label="Batches" value={10} color="pink" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('from-teal-500/20');
  });

  it('should render with green color', () => {
    const { container } = render(<StatsCard icon="✨" label="Processed" value={8} color="green" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('from-green-500/20');
  });

  it('should handle zero value', () => {
    const { getByText } = render(<StatsCard icon="📊" label="Zero" value={0} />);
    expect(getByText('0')).toBeDefined();
  });

  it('should handle large values', () => {
    const { getByText } = render(<StatsCard icon="📊" label="Large" value={999999} />);
    expect(getByText('999999')).toBeDefined();
  });

  it('should display all required elements', () => {
    const { container, getByText } = render(<StatsCard icon="🎯" label="Test Label" value={42} />);
    
    // Check for icon
    expect(getByText('🎯')).toBeDefined();
    
    // Check for label
    expect(getByText('Test Label')).toBeDefined();
    
    // Check for value
    expect(getByText('42')).toBeDefined();
    
    // Check for pulse indicator
    const pulseIndicator = container.querySelector('.animate-pulse');
    expect(pulseIndicator).toBeDefined();
  });
});

