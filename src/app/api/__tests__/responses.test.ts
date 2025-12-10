import { describe, it, expect, beforeEach, afterEach, spyOn, beforeAll } from 'bun:test';
import { GET } from '../responses/route';
import { db } from '@/lib/database';

describe('API: /api/responses', () => {
  // Generate a unique session ID for each test to avoid conflicts
  let testSessionId: string;

  beforeAll(async () => {
    // Ensure database mocks are set up before tests run
    const { setupDatabaseMocks } = await import('@/lib/__tests__/setup-db-mock');
    await setupDatabaseMocks();
  });

  beforeEach(async () => {
    // Generate a new unique session ID for each test using high-resolution time and multiple random values
    testSessionId = `test-session-responses-${Date.now()}-${performance.now()}-${Math.random()}-${Math.random()}-${Math.random()}`;
    // The mock database should be reset by test-setup.ts's afterEach, so we just need to create a session
    await db.getOrCreateSession(testSessionId);
  });

  afterEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  describe('GET', () => {
    it('should use default pagination if not provided', async () => {
      await db.saveResponses(testSessionId, 'Test?', ['Response 1'], 1);

      const request = new Request('http://localhost/api/responses', {
        headers: { 'x-session-id': testSessionId }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(10);
    });

    it('should return 400 if session ID missing', async () => {
      const request = new Request('http://localhost/api/responses');

      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      const spy = spyOn(db, 'getResponses').mockRejectedValue(new Error('Database error'));

      try {
        const request = new Request('http://localhost/api/responses', {
          headers: { 'x-session-id': testSessionId }
        });

        const response = await GET(request);
        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      } finally {
        spy.mockRestore();
      }
    });
  });
});

