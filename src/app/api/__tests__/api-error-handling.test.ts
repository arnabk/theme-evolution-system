import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { POST } from '../questions/clear/route';
import { GET as getStats } from '../stats/route';
import { GET as getThemes } from '../themes/route';
import { GET as getResponses } from '../responses/route';
import { db } from '@/lib/database';

describe('API Routes - Error Handling', () => {
  const testSessionId = 'test-session-' + Date.now();

  beforeEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  afterEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  describe('questions/clear', () => {
    it('should handle database errors', async () => {
      const spy = spyOn(db, 'clearSessionData').mockRejectedValue(new Error('Database error'));

      try {
        const request = new Request('http://localhost/api/questions/clear', {
          method: 'POST',
          headers: { 'x-session-id': testSessionId }
        });

        const response = await POST(request);
        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data.success).toBe(false);
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('stats', () => {
    it('should handle database errors', async () => {
      const spy = spyOn(db, 'getStats').mockRejectedValue(new Error('Database error'));

      try {
        const request = new Request('http://localhost/api/stats', {
          headers: { 'x-session-id': testSessionId }
        });

        const response = await getStats(request);
        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data.success).toBe(false);
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('themes', () => {
    it('should handle database errors', async () => {
      const spy = spyOn(db, 'getThemes').mockRejectedValue(new Error('Database error'));

      try {
        const request = new Request('http://localhost/api/themes', {
          headers: { 'x-session-id': testSessionId }
        });

        const response = await getThemes(request);
        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data.success).toBe(false);
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('responses', () => {
    it('should handle database errors', async () => {
      const spy = spyOn(db, 'getResponses').mockRejectedValue(new Error('Database error'));

      try {
        const request = new Request('http://localhost/api/responses', {
          headers: { 'x-session-id': testSessionId }
        });

        const response = await getResponses(request);
        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data.success).toBe(false);
      } finally {
        spy.mockRestore();
      }
    });
  });
});

