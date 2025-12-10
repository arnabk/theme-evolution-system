/**
 * Setup database mocks for tests
 * This replaces the real database with mocks to prevent actual DB calls
 */

import { spyOn } from 'bun:test';
import { mockDb } from './database-mock';
import { getMockDataSource, resetMockDataSource } from './data-source-mock';

// Type for Bun's spy object
interface BunSpy {
  mockRestore?: () => void;
  mockImplementation?: (fn: unknown) => BunSpy;
  mockResolvedValue?: (value: unknown) => BunSpy;
  mockRejectedValue?: (error: unknown) => BunSpy;
  [key: string]: unknown;
}

// Type for database method names
type DatabaseMethodName = 
  | 'getOrCreateSession'
  | 'saveCurrentQuestion'
  | 'getCurrentQuestion'
  | 'clearSessionData'
  | 'getStats'
  | 'getThemes'
  | 'getUnprocessedResponses'
  | 'markResponsesProcessed'
  | 'getResponses'
  | 'saveResponses'
  | 'saveThemes'
  | 'updateTheme'
  | 'getAllResponses'
  | 'countMatchingResponses'
  | 'recalculateThemeResponseCounts'
  | 'getDataSource';

let isSetup = false;
let spies: BunSpy[] = [];
let originalMethods: Map<DatabaseMethodName, unknown> = new Map();

// Track all active spies across the test suite
const activeSpies = new Set<BunSpy>();

export function restore() {
  if (!isSetup) return;
  
  mockDb.reset();
  
  // Restore all tracked spies
  activeSpies.forEach(spy => {
    if (spy && typeof spy.mockRestore === 'function') {
      try {
        spy.mockRestore();
      } catch (e) {
        // Ignore errors if spy is already restored
      }
    }
  });
  activeSpies.clear();
  
  spies.forEach(spy => {
    if (spy && typeof spy.mockRestore === 'function') {
      try {
        spy.mockRestore();
      } catch (e) {
        // Ignore errors if spy is already restored
      }
    }
  });
  spies = [];
  isSetup = false;
  originalMethods.clear();
}

// Export function to track spies created in individual tests
export function trackSpy(spy: BunSpy) {
  activeSpies.add(spy);
}

// Export function to untrack spies
export function untrackSpy(spy: BunSpy) {
  activeSpies.delete(spy);
}

export async function setupDatabaseMocks(force = false) {
  // Check if we're in a test that needs real database (database.test.ts, data-source.test.ts)
  // These tests should use the real database, not mocks
  const stack = new Error().stack || '';
  const shouldSkipMocking = stack.includes('database.test.ts') || stack.includes('data-source.test.ts');
  
  if (shouldSkipMocking) {
    // Don't set up mocks for database tests - they need real database
    return { mockDb, restore };
  }
  
  // If already set up and not forcing, return early
  if (isSetup && !force) return { mockDb, restore };
  
  // If already set up and forcing, we need to restore and re-setup
  if (isSetup && force) {
    // Restore existing spies first
    spies.forEach(spy => {
      if (spy && typeof spy.mockRestore === 'function') {
        try {
          spy.mockRestore();
        } catch (e) {
          // Ignore errors if spy is already restored
        }
      }
    });
    activeSpies.forEach(spy => {
      if (spy && typeof spy.mockRestore === 'function') {
        try {
          spy.mockRestore();
        } catch (e) {
          // Ignore errors if spy is already restored
        }
      }
    });
    spies = [];
    activeSpies.clear();
    isSetup = false;
    // Continue to set up fresh mocks below
  }
  
  // Import modules
  const databaseModule = await import('../database');
  const dataSourceModule = await import('../data-source');
  
  // Mock all database methods
  const db = databaseModule.db;
  
  // Store original methods
  originalMethods.set('getOrCreateSession', db.getOrCreateSession);
  originalMethods.set('saveCurrentQuestion', db.saveCurrentQuestion);
  originalMethods.set('getCurrentQuestion', db.getCurrentQuestion);
  originalMethods.set('clearSessionData', db.clearSessionData);
  originalMethods.set('getStats', db.getStats);
  originalMethods.set('getThemes', db.getThemes);
  originalMethods.set('getUnprocessedResponses', db.getUnprocessedResponses);
  originalMethods.set('markResponsesProcessed', db.markResponsesProcessed);
  originalMethods.set('getResponses', db.getResponses);
  originalMethods.set('saveResponses', db.saveResponses);
  originalMethods.set('saveThemes', db.saveThemes);
  originalMethods.set('updateTheme', db.updateTheme);
  originalMethods.set('getAllResponses', db.getAllResponses);
  originalMethods.set('countMatchingResponses', db.countMatchingResponses);
  originalMethods.set('recalculateThemeResponseCounts', db.recalculateThemeResponseCounts);
  originalMethods.set('getDataSource', dataSourceModule.getDataSource);
  
  // Create spies and track them
  const dbSpies = [
    spyOn(db, 'getOrCreateSession').mockImplementation(mockDb.getOrCreateSession.bind(mockDb)),
    spyOn(db, 'saveCurrentQuestion').mockImplementation(mockDb.saveCurrentQuestion.bind(mockDb)),
    spyOn(db, 'getCurrentQuestion').mockImplementation(mockDb.getCurrentQuestion.bind(mockDb)),
    spyOn(db, 'clearSessionData').mockImplementation(mockDb.clearSessionData.bind(mockDb)),
    spyOn(db, 'getStats').mockImplementation(mockDb.getStats.bind(mockDb)),
    spyOn(db, 'getThemes').mockImplementation(mockDb.getThemes.bind(mockDb)),
    spyOn(db, 'getUnprocessedResponses').mockImplementation(mockDb.getUnprocessedResponses.bind(mockDb)),
    spyOn(db, 'markResponsesProcessed').mockImplementation(mockDb.markResponsesProcessed.bind(mockDb)),
    spyOn(db, 'getResponses').mockImplementation(mockDb.getResponses.bind(mockDb)),
    spyOn(db, 'saveResponses').mockImplementation(mockDb.saveResponses.bind(mockDb)),
    spyOn(db, 'saveThemes').mockImplementation(mockDb.saveThemes.bind(mockDb)),
    spyOn(db, 'updateTheme').mockImplementation(mockDb.updateTheme.bind(mockDb)),
    spyOn(db, 'getAllResponses').mockImplementation(mockDb.getAllResponses.bind(mockDb)),
    spyOn(db, 'countMatchingResponses').mockImplementation(mockDb.countMatchingResponses.bind(mockDb)),
    spyOn(db, 'recalculateThemeResponseCounts').mockImplementation(mockDb.recalculateThemeResponseCounts.bind(mockDb))
  ];
  
  // Mock getDataSource
  const dataSourceSpy = spyOn(dataSourceModule, 'getDataSource').mockImplementation(async () => getMockDataSource());
  
  // Track all spies
  dbSpies.forEach(spy => {
    spies.push(spy);
    activeSpies.add(spy);
  });
  spies.push(dataSourceSpy);
  activeSpies.add(dataSourceSpy);
  
  isSetup = true;
  
  return {
    mockDb,
    restore
  };
}
