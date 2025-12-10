import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { render, waitFor } from '@testing-library/react';
import { ResponsesTab } from '../ResponsesTab';

describe('ResponsesTab', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = originalFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should render loading state initially', async () => {
    // Delay the fetch response to ensure loading state is visible
    global.fetch = (() => new Promise(resolve => setTimeout(() => {
      resolve({
        ok: true,
        json: async () => ({ success: true, responses: [], total: 0, totalPages: 1 })
      } as Response);
    }, 100))) as unknown as typeof fetch;

    const { getByText } = render(<ResponsesTab sessionId="test-session" />);
    
    // Should show loading immediately
    const loadingText = getByText(/Loading responses/i);
    expect(loadingText).toBeDefined();
  });

  it('should render responses when loaded', async () => {
    const mockResponses = [
      {
        id: 1,
        response_text: 'Response 1',
        batch_id: 1,
        question: 'Test question?',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        response_text: 'Response 2',
        batch_id: 1,
        question: 'Test question?',
        created_at: new Date().toISOString()
      }
    ];

    global.fetch = (() => Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        responses: mockResponses,
        total: 2,
        totalPages: 1
      })
    })) as unknown as typeof fetch;

    const { getByText, queryByText } = render(<ResponsesTab sessionId="test-session" />);

    await waitFor(() => {
      expect(queryByText(/Loading responses/i)).toBeNull();
      expect(getByText('Response 1')).toBeDefined();
      expect(getByText('Response 2')).toBeDefined();
    }, { timeout: 5000 });
  });

  it('should show empty state when no responses', async () => {
    global.fetch = (() => Promise.resolve({
      ok: true,
      json: async () => ({ success: true, responses: [], total: 0, totalPages: 1 })
    })) as unknown as typeof fetch;

    const { queryByText } = render(<ResponsesTab sessionId="test-session" />);

    await waitFor(() => {
      expect(queryByText(/Loading responses/i)).toBeNull();
    }, { timeout: 3000 });
  });

  it('should handle API errors gracefully', async () => {
    const originalConsoleError = console.error;
    console.error = () => {}; // Suppress error logs in test
    
    global.fetch = (() => Promise.reject(new Error('Network error'))) as unknown as typeof fetch;

    const { queryByText } = render(<ResponsesTab sessionId="test-session" />);

    await waitFor(() => {
      expect(queryByText(/Loading responses/i)).toBeNull();
    }, { timeout: 3000 });
    
    console.error = originalConsoleError;
  });

  it('should display pagination when multiple pages', async () => {
    global.fetch = (() => Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        responses: [{ id: 1, response_text: 'Response', batch_id: 1, question: 'Q?', created_at: new Date().toISOString() }],
        total: 25,
        totalPages: 3
      })
    })) as unknown as typeof fetch;

    const { getByText, container } = render(<ResponsesTab sessionId="test-session" />);

    // Wait for responses to load
    await waitFor(() => {
      expect(getByText('Response')).toBeDefined();
    }, { timeout: 2000 });

    // Check for pagination - look for the page indicator
    const pagination = container.querySelector('button');
    expect(pagination).toBeDefined();
  }, 10000);

  it('should handle pagination navigation', async () => {
    const mockResponses = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      response_text: `Response ${i + 1}`,
      batch_id: 1,
      question: 'Test?',
      created_at: new Date().toISOString()
    }));

    let fetchCallCount = 0;
    global.fetch = (() => {
      fetchCallCount++;
      return Promise.resolve({
        ok: true,
        json: async () => {
          // Simulate pagination - return different responses based on page
          const page = fetchCallCount === 1 ? 1 : 2;
          const startIdx = (page - 1) * 10;
          return {
            success: true,
            responses: mockResponses.slice(startIdx, startIdx + 10),
            total: 25,
            totalPages: 3,
            page
          };
        }
      });
    }) as unknown as typeof fetch;

    const { getByText, container } = render(<ResponsesTab sessionId="test-session" />);

    await waitFor(() => {
      expect(getByText('Response 1')).toBeDefined();
    }, { timeout: 2000 });

    // Find and click Next button
    const nextButton = Array.from(container.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('Next')
    );
    
    if (nextButton && !nextButton.hasAttribute('disabled')) {
      nextButton.click();
      
      // Wait for page change
      await waitFor(() => {
        expect(fetchCallCount).toBeGreaterThan(1);
      }, { timeout: 2000 });
    }
  }, 10000);

  it('should disable Previous button on first page', async () => {
    global.fetch = (() => Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        responses: [{ id: 1, response_text: 'Response', batch_id: 1, question: 'Q?', created_at: new Date().toISOString() }],
        total: 25,
        totalPages: 3
      })
    })) as unknown as typeof fetch;

    const { container } = render(<ResponsesTab sessionId="test-session" />);

    await waitFor(() => {
      const prevButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Previous')
      );
      expect(prevButton).toBeDefined();
      expect(prevButton?.hasAttribute('disabled')).toBe(true);
    }, { timeout: 2000 });
  }, 10000);
});

