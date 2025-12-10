import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { GET } from '../questions/current/route';
import { db } from '@/lib/database';

describe('API: /api/questions/current', () => {
  const testSessionId = 'test-session-' + Date.now();

  beforeEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  afterEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  describe('GET', () => {
    it('should return null if no question set', async () => {
      const request = new Request('http://localhost/api/questions/current', {
        headers: { 'x-session-id': testSessionId }
      });
      
      const response = await GET(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.question).toBeNull();
    });

    it('should return current question if set', async () => {
      await db.saveCurrentQuestion(testSessionId, 'Test question?');
      
      const request = new Request('http://localhost/api/questions/current', {
        headers: { 'x-session-id': testSessionId }
      });
      
      const response = await GET(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.question).toBe('Test question?');
    });

    it('should return 400 if session ID missing', async () => {
      const request = new Request('http://localhost/api/questions/current');
      
      const response = await GET(request);
      expect(response.status).toBe(400);
    });
  });

  // Note: POST endpoint doesn't exist in current/route.ts
  // Tests removed as the route only supports GET
});

