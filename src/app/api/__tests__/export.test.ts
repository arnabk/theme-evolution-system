import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { GET } from '../export/route';
import { db } from '@/lib/database';

describe('API: /api/export', () => {
  const testSessionId = 'test-session-' + Date.now();

  beforeEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  afterEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  describe('GET', () => {
    it('should export question and responses', async () => {
      // Ensure session exists first
      await db.getOrCreateSession(testSessionId);
      
      await db.saveCurrentQuestion(testSessionId, 'Test question?');
      await db.saveResponses(testSessionId, 'Test question?', [
        'Response 1',
        'Response 2',
        'Response 3'
      ], 1);

      const request = new Request(`http://localhost/api/export?sessionId=${testSessionId}`);

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      if (data.data) {
        expect(data.data.question).toBe('Test question?');
        expect(data.data.responses).toBeDefined();
        expect(Array.isArray(data.data.responses)).toBe(true);
        expect(data.data.metadata.session_id).toBe(testSessionId);
      }
    });

    it('should return 404 if no question found', async () => {
      // Use a completely fresh session ID to ensure no question exists
      const freshSessionId = testSessionId + '-fresh-' + Date.now();
      await db.clearSessionData(freshSessionId);
      await db.getOrCreateSession(freshSessionId);
      
      // Verify question is actually null
      const question = await db.getCurrentQuestion(freshSessionId);
      expect(question).toBeNull(); // Ensure test setup is correct
      
      const request = new Request(`http://localhost/api/export?sessionId=${freshSessionId}`);

      const response = await GET(request);
      
      // Route should return 404 when question is null
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('No question found');
    });

    it('should return 400 if session ID missing', async () => {
      const request = new Request('http://localhost/api/export');

      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      const spy = spyOn(db, 'getCurrentQuestion').mockRejectedValue(new Error('Database error'));

      try {
        const request = new Request(`http://localhost/api/export?sessionId=${testSessionId}`);

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

