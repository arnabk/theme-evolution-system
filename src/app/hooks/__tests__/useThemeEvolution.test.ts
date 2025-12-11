import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useThemeEvolution } from '../useThemeEvolution';

// Helper to ensure document.body exists for waitFor
function ensureBody() {
  if (!document.body || !(document.body instanceof HTMLElement)) {
    const body = document.createElement('body');
    body.className = 'antialiased';
    if (document.documentElement) {
      document.documentElement.appendChild(body);
    } else {
      const html = document.createElement('html');
      html.setAttribute('lang', 'en');
      html.appendChild(body);
    }
  }
}

// Wrapper component to ensure renderHook has a stable container
const Wrapper = ({ children }: { children: React.ReactNode }) => {
  ensureBody();
  return React.createElement('div', { 'data-testid': 'hook-wrapper' }, children);
};

// Custom polling function for hook tests that doesn't require a DOM container
async function waitForHook(
  assertion: () => void | Promise<void>,
  options?: { timeout?: number; interval?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 5000;
  const interval = options?.interval ?? 50;
  const startTime = Date.now();
  let lastError: Error | undefined;
  
  while (Date.now() - startTime < timeout) {
    try {
      await assertion();
      // If assertion passes, return successfully
      return;
    } catch (error) {
      lastError = error as Error;
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  // If we get here, the assertion never passed - throw the last error
  if (lastError) {
    throw lastError;
  }
  throw new Error(`waitForHook timed out after ${timeout}ms`);
}

describe('useThemeEvolution', () => {
  const originalConsoleError = console.error;
  const mockConsoleError = () => {}; // Suppress console.error in tests

  beforeEach(() => {
    console.error = mockConsoleError;
    // Reset fetch to default mock (test-setup.ts will handle this, but we ensure it's set)
    global.fetch = (() => Promise.resolve({
      ok: true,
      json: async () => ({ success: true, data: {} }),
      text: async () => '',
      headers: new Headers(),
      status: 200,
      statusText: 'OK'
    })) as unknown as typeof fetch;
    
    // Ensure document.body exists and is valid for renderHook
    // This must be done synchronously before renderHook is called
    if (!document.body) {
      const body = document.createElement('body');
      if (document.documentElement) {
        document.documentElement.appendChild(body);
      } else {
        const html = document.createElement('html');
        html.appendChild(body);
        if (document.documentElement) {
          document.replaceChild(html, document.documentElement);
        }
      }
    }
    
    // Ensure body is a valid HTMLElement
    if (!(document.body instanceof HTMLElement)) {
      const oldBody = document.body;
      const body = document.createElement('body');
      if (document.documentElement) {
        if (oldBody && oldBody.parentNode) {
          document.documentElement.replaceChild(body, oldBody);
        } else {
          document.documentElement.appendChild(body);
        }
      }
    }
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should initialize with default state', () => {
    global.fetch = (() => Promise.resolve({
      ok: true,
      json: async () => ({ success: true })
    })) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });

    expect(result.current.stats).toEqual({
      total_responses: 0,
      total_themes: 0,
      batches_generated: 0,
      batches_processed: 0
    });
    expect(result.current.currentQuestion).toBe('');
    expect(result.current.currentBatchId).toBeNull();
    expect(result.current.isGeneratingQuestion).toBe(false);
    expect(result.current.isGeneratingResponses).toBe(false);
    expect(result.current.isProcessingThemes).toBe(false);
    expect(result.current.responseProgress).toEqual({ current: 0, total: 0 });
    expect(result.current.themeProgress).toEqual({ message: '', progress: 0 });
    expect(result.current.refreshKey).toBe(0);
  });

  it('should load stats successfully', async () => {
    const mockStats = {
      success: true,
      total_responses: 10,
      total_themes: 3,
      batches_generated: 2,
      batches_processed: 1
    };

    global.fetch = (() => Promise.resolve({
      ok: true,
      json: async () => mockStats
    })) as unknown as typeof fetch;

    ensureBody();
    
    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });

    await result.current.loadStats();

    // Use custom waitFor that ensures container is available
    await waitForHook(() => {
      expect(result.current.stats).toEqual({
        total_responses: 10,
        total_themes: 3,
        batches_generated: 2,
        batches_processed: 1
      });
    }, { timeout: 5000 });
  });

  it('should handle loadStats error', async () => {
    global.fetch = (() => Promise.reject(new Error('Network error'))) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });

    await result.current.loadStats();

    // Stats should remain at default values
    expect(result.current.stats).toEqual({
      total_responses: 0,
      total_themes: 0,
      batches_generated: 0,
      batches_processed: 0
    });
  });

  it('should load current question successfully', async () => {
    global.fetch = (() => Promise.resolve({
      ok: true,
      json: async () => ({ success: true, question: 'Test question?' })
    })) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });

    await result.current.loadCurrentQuestion();

    await waitForHook(() => {
      expect(result.current.currentQuestion).toBe('Test question?');
    });
  });

  it('should handle loadCurrentQuestion when no question exists', async () => {
    global.fetch = (() => Promise.resolve({
      ok: true,
      json: async () => ({ success: true })
    })) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });

    await result.current.loadCurrentQuestion();

    // Question should remain empty
    expect(result.current.currentQuestion).toBe('');
  });

  it('should handle loadCurrentQuestion error', async () => {
    global.fetch = (() => Promise.reject(new Error('Network error'))) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });

    await result.current.loadCurrentQuestion();

    // Question should remain empty
    expect(result.current.currentQuestion).toBe('');
  });

  it('should generate question successfully', async () => {
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/questions/generate')) {
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
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });

    await result.current.generateQuestion();

    await waitForHook(() => {
      expect(result.current.currentQuestion).toBe('New question?');
      expect(result.current.currentBatchId).toBeNull();
      expect(result.current.isGeneratingQuestion).toBe(false);
      expect(result.current.refreshKey).toBe(1);
    });
  });

  it('should handle generateQuestion error', async () => {
    global.fetch = (() => Promise.reject(new Error('Network error'))) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });

    await result.current.generateQuestion();

    await waitForHook(() => {
      expect(result.current.isGeneratingQuestion).toBe(false);
    });
  });

  it('should generate responses successfully', async () => {
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/responses/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, batchId: 123 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 20, total_themes: 0, batches_generated: 1, batches_processed: 0 })
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });
    
    // First set a question by generating one
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/questions/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: 'Test question?' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, batchId: 123 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 20, total_themes: 0, batches_generated: 1, batches_processed: 0 })
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    await result.current.generateQuestion();
    
    await waitForHook(() => {
      expect(result.current.currentQuestion).toBe('Test question?');
    });

    await result.current.generateResponses();

    await waitForHook(() => {
      expect(result.current.currentBatchId).toBe(123);
      expect(result.current.isGeneratingResponses).toBe(false);
      expect(result.current.responseProgress).toEqual({ current: 0, total: 0 });
    }, { timeout: 3000 });
  });

  it('should handle generateResponses error', async () => {
    // First set a question
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/questions/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: 'Test question?' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 0, total_themes: 0, batches_generated: 0, batches_processed: 0 })
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });
    
    await result.current.generateQuestion();
    
    await waitForHook(() => {
      expect(result.current.currentQuestion).toBe('Test question?');
    });

    // Now test error case
    global.fetch = (() => Promise.reject(new Error('Network error'))) as unknown as typeof fetch;

    await result.current.generateResponses();

    await waitForHook(() => {
      expect(result.current.isGeneratingResponses).toBe(false);
      expect(result.current.responseProgress).toEqual({ current: 0, total: 0 });
    }, { timeout: 3000 });
  });

  it('should export data successfully', async () => {
    const mockData = { question: 'Test?', responses: [{ id: 1, text: 'Response 1' }] };
    
    global.fetch = (() => Promise.resolve({
      ok: true,
      json: async () => ({ success: true, data: mockData })
    })) as unknown as typeof fetch;

    // Store original methods
    const originalCreateElement = document.createElement.bind(document);
    const originalAppendChild = document.body.appendChild.bind(document.body);
    const originalRemoveChild = document.body.removeChild.bind(document.body);
    const originalCreateObjectURL = global.URL.createObjectURL;
    const originalRevokeObjectURL = global.URL.revokeObjectURL;

    // Mock DOM methods for export
    const mockClick = () => {};
    let anchorElement: HTMLAnchorElement | null = null;
    
    document.createElement = ((tagName: string) => {
      if (tagName === 'a') {
        anchorElement = originalCreateElement('a') as HTMLAnchorElement;
        anchorElement.href = '';
        anchorElement.download = '';
        anchorElement.click = mockClick;
        return anchorElement;
      }
      return originalCreateElement(tagName);
    }) as typeof document.createElement;
    
    document.body.appendChild = ((node: Node) => {
      // Allow appendChild to work for React, but track anchor elements
      return originalAppendChild(node);
    }) as typeof document.body.appendChild;
    
    document.body.removeChild = ((node: Node) => {
      return originalRemoveChild(node);
    }) as typeof document.body.removeChild;
    
    global.URL.createObjectURL = () => 'blob:url';
    global.URL.revokeObjectURL = () => {};
    global.Blob = class Blob {
      constructor() {}
    } as unknown as typeof Blob;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });

    const exportResult = await result.current.exportData();

    expect(exportResult).toBe(true);
    
    // Restore original methods
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('should handle exportData error', async () => {
    global.fetch = (() => Promise.reject(new Error('Network error'))) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });

    const exportResult = await result.current.exportData();

    expect(exportResult).toBe(false);
  });

  it('should handle exportData when API returns failure', async () => {
    global.fetch = (() => Promise.resolve({
      ok: true,
      json: async () => ({ success: false })
    })) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });

    const exportResult = await result.current.exportData();

    expect(exportResult).toBe(false);
  });

  it('should process themes with SSE streaming', async () => {
    let readCallCount = 0;
    const mockReader = {
      read: async () => {
        readCallCount++;
        if (readCallCount === 1) {
          return {
            done: false,
            value: new TextEncoder().encode('data: {"type":"status","message":"Processing...","progress":50}\n\n')
          };
        }
        return { done: true, value: undefined };
      }
    };

    global.fetch = (() => Promise.resolve({
      ok: true,
      body: {
        getReader: () => mockReader
      } as ReadableStream
    })) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });
    
    // Set question and batchId by generating them
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/questions/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: 'Test question?' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, batchId: 1 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 0, total_themes: 0, batches_generated: 0, batches_processed: 0 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/themes/process')) {
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => mockReader
          } as ReadableStream
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    await result.current.generateQuestion();
    await waitForHook(() => {
      expect(result.current.currentQuestion).toBe('Test question?');
    });

    await result.current.generateResponses();
    await waitForHook(() => {
      expect(result.current.currentBatchId).toBe(1);
    });

    await result.current.processThemes();

    await waitForHook(() => {
      expect(result.current.isProcessingThemes).toBe(false);
    }, { timeout: 3000 });
  });

  it('should handle processThemes complete event', async () => {
    let readCallCount = 0;
    const mockReader = {
      read: async () => {
        readCallCount++;
        if (readCallCount === 1) {
          return {
            done: false,
            value: new TextEncoder().encode('data: {"type":"complete","message":"Done!","progress":100}\n\n')
          };
        }
        return { done: true, value: undefined };
      }
    };

    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/questions/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: 'Test question?' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, batchId: 1 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/themes/process')) {
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => mockReader
          } as ReadableStream
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 0, total_themes: 0, batches_generated: 0, batches_processed: 0 })
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });
    
    await result.current.generateQuestion();
    await waitForHook(() => {
      expect(result.current.currentQuestion).toBe('Test question?');
    });

    await result.current.generateResponses();
    await waitForHook(() => {
      expect(result.current.currentBatchId).toBe(1);
    });

    await result.current.processThemes();

    await waitForHook(() => {
      expect(result.current.isProcessingThemes).toBe(false);
    }, { timeout: 3000 });
  });

  it('should handle processThemes error event', async () => {
    let readCallCount = 0;
    const mockReader = {
      read: async () => {
        readCallCount++;
        if (readCallCount === 1) {
          return {
            done: false,
            value: new TextEncoder().encode('data: {"type":"error","message":"Processing failed"}\n\n')
          };
        }
        return { done: true, value: undefined };
      }
    };

    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/questions/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: 'Test question?' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, batchId: 1 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 0, total_themes: 0, batches_generated: 0, batches_processed: 0 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/themes/process')) {
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => mockReader
          } as ReadableStream
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });
    
    await result.current.generateQuestion();
    await waitForHook(() => {
      expect(result.current.currentQuestion).toBe('Test question?');
    });

    await result.current.generateResponses();
    await waitForHook(() => {
      expect(result.current.currentBatchId).toBe(1);
    });

    await result.current.processThemes();

    await waitForHook(() => {
      expect(result.current.isProcessingThemes).toBe(false);
    }, { timeout: 3000 });
  });

  it('should handle processThemes network error', async () => {
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/questions/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: 'Test question?' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, batchId: 1 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 0, total_themes: 0, batches_generated: 0, batches_processed: 0 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/themes/process')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });
    
    await result.current.generateQuestion();
    await waitForHook(() => {
      expect(result.current.currentQuestion).toBe('Test question?');
    });

    await result.current.generateResponses();
    await waitForHook(() => {
      expect(result.current.currentBatchId).toBe(1);
    });

    await result.current.processThemes();

    await waitForHook(() => {
      expect(result.current.isProcessingThemes).toBe(false);
    });
  });

  it('should handle processThemes when response is not ok', async () => {
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/questions/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: 'Test question?' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, batchId: 1 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 0, total_themes: 0, batches_generated: 0, batches_processed: 0 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/themes/process')) {
        return Promise.resolve({
          ok: false,
          body: null
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });
    
    await result.current.generateQuestion();
    await waitForHook(() => {
      expect(result.current.currentQuestion).toBe('Test question?');
    });

    await result.current.generateResponses();
    await waitForHook(() => {
      expect(result.current.currentBatchId).toBe(1);
    });

    await result.current.processThemes();

    await waitForHook(() => {
      expect(result.current.isProcessingThemes).toBe(false);
    });
  });

  it('should handle processThemes when response body is null', async () => {
    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/questions/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: 'Test question?' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, batchId: 1 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 0, total_themes: 0, batches_generated: 0, batches_processed: 0 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/themes/process')) {
        return Promise.resolve({
          ok: true,
          body: null
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });
    
    await result.current.generateQuestion();
    await waitForHook(() => {
      expect(result.current.currentQuestion).toBe('Test question?');
    });

    await result.current.generateResponses();
    await waitForHook(() => {
      expect(result.current.currentBatchId).toBe(1);
    });

    await result.current.processThemes();

    await waitForHook(() => {
      expect(result.current.isProcessingThemes).toBe(false);
    });
  });

  it('should handle invalid SSE data parsing', async () => {
    let readCallCount = 0;
    const mockReader = {
      read: async () => {
        readCallCount++;
        if (readCallCount === 1) {
          return {
            done: false,
            value: new TextEncoder().encode('data: invalid json\n\n')
          };
        }
        return { done: true, value: undefined };
      }
    };

    global.fetch = ((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlString.includes('/api/questions/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, question: 'Test question?' })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/responses/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, batchId: 1 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, total_responses: 0, total_themes: 0, batches_generated: 0, batches_processed: 0 })
        }) as Promise<Response>;
      }
      if (urlString.includes('/api/themes/process')) {
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => mockReader
          } as ReadableStream
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      }) as Promise<Response>;
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useThemeEvolution('test-session'), {
      wrapper: Wrapper
    });
    
    await result.current.generateQuestion();
    await waitForHook(() => {
      expect(result.current.currentQuestion).toBe('Test question?');
    });

    await result.current.generateResponses();
    await waitForHook(() => {
      expect(result.current.currentBatchId).toBe(1);
    });

    await result.current.processThemes();

    await waitForHook(() => {
      expect(result.current.isProcessingThemes).toBe(false);
    }, { timeout: 3000 });
  });
});

