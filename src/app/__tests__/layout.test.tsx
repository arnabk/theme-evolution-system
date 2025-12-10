import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import RootLayout, { metadata } from '../layout';

describe('RootLayout', () => {
  it('should export RootLayout component', () => {
    expect(RootLayout).toBeDefined();
    expect(typeof RootLayout).toBe('function');
  });

  it('should export metadata', () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Theme Evolution System');
    expect(metadata.description).toBe('AI-powered theme extraction and evolution');
  });

  it('should render with children', () => {
    const { getByText } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    expect(getByText('Test Content')).toBeDefined();
  });

  it('should render html and body elements', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    expect(container).toBeDefined();
    expect(container.textContent).toContain('Content');
    
    // Check that html element exists in the rendered tree
    const htmlElement = container.querySelector('html');
    expect(htmlElement).toBeDefined();
    if (htmlElement) {
      expect(htmlElement.getAttribute('lang')).toBe('en');
    }
    
    // Check that body element exists
    const bodyElement = container.querySelector('body');
    expect(bodyElement).toBeDefined();
    if (bodyElement) {
      expect(bodyElement.className).toContain('antialiased');
    }
  });

  it('should render multiple children', () => {
    const { getByText } = render(
      <RootLayout>
        <div>Child 1</div>
        <div>Child 2</div>
      </RootLayout>
    );

    expect(getByText('Child 1')).toBeDefined();
    expect(getByText('Child 2')).toBeDefined();
  });
});
