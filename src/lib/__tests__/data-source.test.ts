import { describe, it, expect, beforeAll } from 'bun:test';
import { getDataSource } from '../data-source';
import { DataSource } from 'typeorm';

// Restore real data source before tests run
// This test file needs the real data source, not mocks
beforeAll(async () => {
  // Ensure mocks are not active for this test
  const setupModule = await import('./setup-db-mock');
  if (setupModule && typeof setupModule.restore === 'function') {
    setupModule.restore();
  }
});

describe('data-source', () => {
  describe('getDataSource', () => {
    it('should return a DataSource instance', async () => {
      const dataSource = await getDataSource();
      
      expect(dataSource).toBeInstanceOf(DataSource);
      expect(dataSource.isInitialized).toBe(true);
    });

    it('should return the same instance on multiple calls', async () => {
      const ds1 = await getDataSource();
      const ds2 = await getDataSource();
      
      expect(ds1).toBe(ds2);
    });

    it('should handle concurrent initialization', async () => {
      const [ds1, ds2, ds3] = await Promise.all([
        getDataSource(),
        getDataSource(),
        getDataSource()
      ]);
      
      expect(ds1).toBe(ds2);
      expect(ds2).toBe(ds3);
    });
  });
});

