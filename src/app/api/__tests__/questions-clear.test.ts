import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { POST } from '../questions/clear/route';
import { db } from '@/lib/database';

describe('API: /api/questions/clear', () => {
  const testSessionId = 'test-session-' + Date.now();

  beforeEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  afterEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  describe('POST', () => {
    it('should clear all session data', async () => {
      // Set up test data
      await db.saveCurrentQuestion(testSessionId, 'Test question?');
      await db.saveResponses(testSessionId, 'Test?', ['Response 1', 'Response 2'], 1);
      await db.saveThemes(testSessionId, [{
        name: 'Test Theme',
        description: 'Test',
        phrases: [],
        response_count: 0
      }]);

      const request = new Request('http://localhost/api/questions/clear', {
        method: 'POST',
        headers: { 'x-session-id': testSessionId }
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify data was cleared
      const stats = await db.getStats(testSessionId);
      expect(stats.total_responses).toBe(0);
      expect(stats.total_themes).toBe(0);
    });

    it('should return 400 if session ID missing', async () => {
      const request = new Request('http://localhost/api/questions/clear', {
        method: 'POST'
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});

