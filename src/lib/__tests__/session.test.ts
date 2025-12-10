import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { getSessionId, clearSession, getSessionInfo } from '../session';

describe('session', () => {
  const originalLocalStorage = global.localStorage;
  const mockLocalStorage = {
    getItem: mock(() => null),
    setItem: mock(() => {}),
    removeItem: mock(() => {}),
    clear: mock(() => {}),
    key: mock(() => null),
    length: 0
  };

  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    Object.defineProperty(global, 'window', {
      value: { localStorage: mockLocalStorage },
      writable: true
    });
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  afterEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
  });

  describe('getSessionId', () => {
    it('should return existing session ID from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('existing-session-id');
      
      const sessionId = getSessionId();
      
      expect(sessionId).toBe('existing-session-id');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme-evolution-session-id');
    });

    it('should create new session ID if none exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const sessionId = getSessionId();
      
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should return empty string in SSR context', () => {
      // Mock SSR by setting window to undefined
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR
      global.window = undefined as unknown as Window & typeof globalThis;
      
      const sessionId = getSessionId();
      
      expect(sessionId).toBe('');
      
      // Restore
      global.window = originalWindow;
    });
  });

  describe('clearSession', () => {
    it('should remove session from localStorage', () => {
      clearSession();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('theme-evolution-session-id');
    });

    it('should not throw in SSR context', () => {
      // Mock SSR by setting window to undefined
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR
      global.window = undefined as unknown as Window & typeof globalThis;
      
      expect(() => clearSession()).not.toThrow();
      
      // Restore
      global.window = originalWindow;
    });
  });

  describe('getSessionInfo', () => {
    it('should return session info with valid timestamp', () => {
      mockLocalStorage.getItem.mockReturnValue('session_1234567890_abc123');
      
      const info = getSessionInfo();
      
      expect(info).not.toBeNull();
      expect(info?.id).toBe('session_1234567890_abc123');
      expect(info?.created).not.toBe('Unknown');
    });

    it('should return null in SSR context', () => {
      // Mock SSR by setting window to undefined
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR
      global.window = undefined as unknown as Window & typeof globalThis;
      
      const info = getSessionInfo();
      
      expect(info).toBeNull();
      
      // Restore
      global.window = originalWindow;
    });

    it('should handle invalid session ID format', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-session');
      
      const info = getSessionInfo();
      
      expect(info).not.toBeNull();
      expect(info?.created).toBe('Unknown');
    });
  });
});

