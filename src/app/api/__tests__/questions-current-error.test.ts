import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { GET } from '../questions/current/route';
import { db } from '@/lib/database';

describe('API: /api/questions/current - Error Handling', () => {
  const testSessionId = 'test-session-' + Date.now();

  beforeEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  afterEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  it('should handle database errors gracefully', async () => {
    // Mock database to throw error
    const spy = spyOn(db, 'getCurrentQuestion').mockRejectedValue(new Error('Database error'));

    try {
      const request = new Request('http://localhost/api/questions/current', {
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

