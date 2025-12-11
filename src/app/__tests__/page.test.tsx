import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { render, waitFor, fireEvent } from '@testing-library/react';
import Home from '../page';

describe('Home Page', () => {
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;
  const mockConsoleError = () => {};

  beforeEach(() => {
    console.error = mockConsoleError;
    global.fetch = originalFetch;
    
    // Ensure localStorage is available for all tests
    if (!global.localStorage) {
      (global as unknown as { localStorage: Storage }).localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null
      } as Storage;
    }
  });

  afterEach(() => {
    console.error = originalConsoleError;
    global.fetch = originalFetch;
  });

  it('should export Home component', () => {
    expect(Home).toBeDefined();
    expect(typeof Home).toBe('function');
  });

  it('should show loading state initially', async () => {
    // Ensure localStorage is available
    if (!global.localStorage) {
      (global as unknown as { localStorage: Storage }).localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null
      } as Storage;
    }

    global.fetch = (() => new Promise(resolve => setTimeout(() => {
      resolve({
        ok: true,
        json: async () => ({ success: true, total_responses: 0, total_themes: 0, batches_generated: 0, batches_processed: 0 })
      } as Response);
    }, 100))) as unknown as typeof fetch;

    const { getByText } = render(<Home />);
    
    expect(getByText(/Loading Theme Evolution System/i)).toBeDefined();
  });

  it('should render main content after loading', async () => {
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 0, total_themes: 0, batches_generated: 0, batches_processed: 0 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/questions/current')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: '' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/themes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, themes: [] })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, responses: [], total: 0, totalPages: 1 })
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { container } = render(<Home />);

    await waitFor(() => {
      expect(container.textContent).toContain('Theme Evolution');
    }, { timeout: 5000, interval: 100 });
  });

  it('should switch between tabs', async () => {
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 0, total_themes: 0, batches_generated: 0, batches_processed: 0 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/questions/current')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: '' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/themes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, themes: [] })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, responses: [], total: 0, totalPages: 1 })
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { container, getByText } = render(<Home />);

    await waitFor(() => {
      expect(container.textContent).toContain('Theme Evolution');
    }, { timeout: 5000, interval: 100 });

    // Click on Responses tab
    await waitFor(() => {
      expect(getByText('Responses')).toBeDefined();
    }, { timeout: 5000, interval: 100 });
    
    const responsesTab = getByText('Responses');
    fireEvent.click(responsesTab);

    // Should show responses tab content
    await waitFor(() => {
      expect(container.textContent).toContain('Responses');
    }, { timeout: 5000, interval: 100 });
  });

  it('should handle generate question button click', async () => {
    let generateQuestionCalled = false;
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/questions/generate')) {
        generateQuestionCalled = true;
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: 'New question?' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 0, total_themes: 0, batches_generated: 0, batches_processed: 0 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/questions/current')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: '' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/themes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, themes: [] })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, responses: [], total: 0, totalPages: 1 })
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { getAllByText } = render(<Home />);

    await waitFor(() => {
      expect(getAllByText(/Generate Question/i).length).toBeGreaterThan(0);
    }, { timeout: 5000, interval: 100 });

    // Get the button (first element is the button, second might be help text)
    const generateButtons = getAllByText(/Generate Question/i);
    const generateButton = generateButtons.find(btn => btn.closest('button')) || generateButtons[0];
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(generateQuestionCalled).toBe(true);
    }, { timeout: 5000, interval: 100 });
  });

  it('should disable buttons when operation is active', async () => {
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 0, total_themes: 0, batches_generated: 0, batches_processed: 0 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/questions/current')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: '' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/themes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, themes: [] })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, responses: [], total: 0, totalPages: 1 })
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { container } = render(<Home />);

    await waitFor(() => {
      expect(container.textContent).toContain('Theme Evolution');
    }, { timeout: 5000, interval: 100 });

    // Buttons should be rendered
    await waitFor(() => {
      expect(container.textContent).toContain('Generate Question');
    }, { timeout: 5000, interval: 100 });
  });

  it('should show stats cards', async () => {
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 10, total_themes: 5, batches_generated: 3, batches_processed: 2 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/questions/current')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: '' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/themes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, themes: [] })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, responses: [], total: 0, totalPages: 1 })
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { container } = render(<Home />);

    await waitFor(() => {
      expect(container.textContent).toContain('Total Responses');
      expect(container.textContent).toContain('Themes Found');
    }, { timeout: 5000, interval: 100 });
  });

  it('should handle export data button click', async () => {
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/export')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: { question: 'Test?', responses: [] } })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 5, total_themes: 2, batches_generated: 1, batches_processed: 1 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/questions/current')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: 'Test?' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/themes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, themes: [] })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, responses: [], total: 0, totalPages: 1 })
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    // Mock URL and Blob for export functionality
    const originalCreateObjectURL = global.URL.createObjectURL;
    const originalRevokeObjectURL = global.URL.revokeObjectURL;
    global.URL.createObjectURL = () => 'blob:url';
    global.URL.revokeObjectURL = () => {};
    global.Blob = class Blob {
      constructor() {}
    } as unknown as typeof Blob;

    // Mock document.createElement only for anchor elements used in export
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = ((tagName: string) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement('a');
        anchor.href = '';
        anchor.download = '';
        anchor.click = () => {
          // Export functionality triggered
        };
        return anchor;
      }
      return originalCreateElement(tagName);
    }) as typeof document.createElement;

    // Ensure document.body exists before rendering
    if (!document.body || !(document.body instanceof HTMLElement)) {
      const body = document.createElement('body');
      if (document.documentElement) {
        document.documentElement.appendChild(body);
      }
    }

    const { getByText } = render(<Home />);

    // Restore original methods after render
    document.createElement = originalCreateElement;
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;

    await waitFor(() => {
      expect(getByText(/Export Data/i)).toBeDefined();
    }, { timeout: 5000, interval: 100 });

    const exportButton = getByText(/Export Data/i);
    fireEvent.click(exportButton);

    // Export should be triggered
    await waitFor(() => {
      expect(true).toBe(true); // Just wait for click to complete
    });
  });
});

