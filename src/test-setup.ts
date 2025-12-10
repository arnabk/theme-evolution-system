/**
 * Test setup for React Testing Library
 * This file is imported by Bun's test runner
 */
/* istanbul ignore file */

import '@testing-library/jest-dom';
import { afterEach, beforeEach } from 'bun:test';
import { cleanup } from '@testing-library/react';
import { Window } from 'happy-dom';

// Setup database mocks for all tests
import { mockDb } from './lib/__tests__/database-mock';
import { resetMockDataSource } from './lib/__tests__/data-source-mock';

// Setup mocks - will be initialized asynchronously before tests run
let dbMocksSetupPromise: Promise<void> | null = null;

function initializeDbMocks() {
  if (dbMocksSetupPromise) return dbMocksSetupPromise;
  
  // Check if we should skip mocking (for database.test.ts and data-source.test.ts)
  // These tests need the real database
  const stack = new Error().stack || '';
  const testFile = stack.split('\n').find(line => line.includes('.test.') && (line.includes('database.test') || line.includes('data-source.test')));
  
  if (testFile) {
    // Skip mocking for database tests
    return Promise.resolve();
  }
  
  // Initialize mocks synchronously if possible, otherwise async
  dbMocksSetupPromise = (async () => {
    try {
      const { setupDatabaseMocks } = await import('./lib/__tests__/setup-db-mock');
      await setupDatabaseMocks();
    } catch (error) {
      // If setup fails, it's likely because we're in a database test
      // which should skip mocking anyway
      console.error('Failed to setup database mocks:', error);
    }
  })();
  
  return dbMocksSetupPromise;
}

// Initialize mocks immediately, but only if not in database test
// Use a synchronous check to avoid timing issues
if (typeof Bun !== 'undefined') {
  // Try to initialize immediately, but handle async setup
  initializeDbMocks().catch(() => {
    // If initialization fails, it's likely because we're in a database test
    // which should skip mocking anyway
  });
}

// Set up DOM environment using happy-dom
const window = new Window({
  url: 'http://localhost',
  settings: {
    disableJavaScriptFileLoading: true,
    disableJavaScriptEvaluation: false,
    disableCSSFileLoading: true,
    enableFileSystemHttpRequests: false
  }
});

const document = window.document;

// Set up global DOM objects - must be set before React Testing Library imports
globalThis.window = window as unknown as Window & typeof globalThis;
globalThis.document = document;

// Set up other DOM globals
globalThis.HTMLElement = window.HTMLElement as unknown as typeof HTMLElement;
globalThis.Element = window.Element as unknown as typeof Element;
globalThis.Node = window.Node as unknown as typeof Node;
globalThis.DOMException = window.DOMException as unknown as typeof DOMException;
globalThis.Event = window.Event as unknown as typeof Event;
globalThis.EventTarget = window.EventTarget as unknown as typeof EventTarget;
globalThis.MouseEvent = window.MouseEvent as unknown as typeof MouseEvent;
globalThis.navigator = window.navigator as unknown as typeof navigator;
globalThis.location = window.location as unknown as typeof location;
globalThis.history = window.history as unknown as typeof history;

// Ensure document.body exists for React Testing Library
if (!document.body) {
  const body = document.createElement('body');
  document.appendChild(body);
}

// Mock IntersectionObserver for infinite scroll tests
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
} as unknown as typeof IntersectionObserver;

// Mock fetch globally - individual tests can override this
// Default mock returns empty successful response
global.fetch = (() => Promise.resolve({
  ok: true,
  json: async () => ({ success: true, data: {} }),
  text: async () => '',
  headers: new Headers(),
  status: 200,
  statusText: 'OK'
})) as unknown as typeof fetch;

// Setup before each test - ensure clean DOM
beforeEach(() => {
  // Ensure document.documentElement exists first
  if (!document.documentElement) {
    const html = document.createElement('html');
    html.setAttribute('lang', 'en');
    // In happy-dom, we need to ensure the structure is correct
  }
  
  // Clear any existing content
  if (document.body) {
    document.body.innerHTML = '';
  }
  
  // Ensure body exists - React Testing Library needs this
  if (!document.body) {
    const body = document.createElement('body');
    body.className = 'antialiased';
    // happy-dom automatically manages documentElement
    if (document.documentElement) {
      document.documentElement.appendChild(body);
    } else {
      // If documentElement doesn't exist, create it
      const html = document.createElement('html');
      html.setAttribute('lang', 'en');
      html.appendChild(body);
    }
  }
  
  // Verify body is a valid HTMLElement and ensure it's attached
  if (!(document.body instanceof HTMLElement)) {
    // Recreate body if it's not valid
    const oldBody = document.body;
    const body = document.createElement('body');
    body.className = 'antialiased';
    if (document.documentElement) {
      if (oldBody && oldBody.parentNode) {
        document.documentElement.replaceChild(body, oldBody);
      } else {
        document.documentElement.appendChild(body);
      }
    }
  }
  
  // Final verification
  if (!document.body || !(document.body instanceof HTMLElement)) {
    throw new Error('document.body is not a valid HTMLElement after setup');
  }
});

// Cleanup after each test
afterEach(() => {
  // Store body reference before cleanup
  const bodyExists = !!document.body;
  
  cleanup();
  
  // Immediately restore body if it was removed by cleanup
  // This is critical for renderHook/waitFor which need a container
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
  } else {
    // Clear content but keep the body element
    document.body.innerHTML = '';
  }
  
  // Reset fetch to default mock
  global.fetch = (() => Promise.resolve({
    ok: true,
    json: async () => ({ success: true, data: {} }),
    text: async () => '',
    headers: new Headers(),
    status: 200,
    statusText: 'OK'
  })) as unknown as typeof fetch;
  // Reset database mock state - but only if safe to do so
  // Don't reset if we're in the middle of a test that might still be using the database
  // The individual test's afterEach should handle session-specific cleanup
  // For now, we'll reset but this might cause test isolation issues
  // TODO: Make reset more selective or delay it
  mockDb.reset();
  resetMockDataSource();
});

