import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { GET } from '../themes/route';
import { db } from '@/lib/database';

describe('API: /api/themes', () => {
  const testSessionId = 'test-session-' + Date.now();

  beforeEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  afterEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  describe('GET', () => {
    it('should return themes for session', async () => {
      await db.saveThemes(testSessionId, [
        {
          name: 'Theme 1',
          description: 'Description 1',
          phrases: [{ text: 'phrase 1', class: 'user_goal' }],
          response_count: 5
        },
        {
          name: 'Theme 2',
          description: 'Description 2',
          phrases: [{ text: 'phrase 2', class: 'pain_point' }],
          response_count: 3
        }
      ]);

      const request = new Request('http://localhost/api/themes', {
        headers: { 'x-session-id': testSessionId }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.themes).toHaveLength(2);
      expect(data.count).toBe(2);
    });

    it('should return empty array for session with no themes', async () => {
      const request = new Request('http://localhost/api/themes', {
        headers: { 'x-session-id': testSessionId }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.themes).toHaveLength(0);
      expect(data.count).toBe(0);
    });

    it('should return 400 if session ID missing', async () => {
      const request = new Request('http://localhost/api/themes');

      const response = await GET(request);
      expect(response.status).toBe(400);
    });
  });
});

