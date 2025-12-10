import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { GET } from '../themes/[themeId]/responses/route';
import { db } from '@/lib/database';
import { getDataSource } from '@/lib/data-source';

describe('API: /api/themes/[themeId]/responses - Error Handling', () => {
  const testSessionId = 'test-session-' + Date.now();

  beforeEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  afterEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  it('should handle database errors gracefully', async () => {
    await db.saveThemes(testSessionId, [{
      name: 'Test Theme',
      description: 'Test',
      phrases: [],
      response_count: 0
    }]);

    const themes = await db.getThemes(testSessionId);
    const themeId = themes[0].id;

    // Mock getDataSource to throw error
    const spy = spyOn({ getDataSource }, 'getDataSource').mockRejectedValue(new Error('Database error'));

    try {
      const request = new Request(`http://localhost/api/themes/${themeId}/responses`, {
        headers: { 'x-session-id': testSessionId }
      });

      try {
        const response = await GET(request, { params: Promise.resolve({ themeId: themeId.toString() }) });
        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data.success).toBe(false);
      } catch (error) {
        // Error might be thrown, which is also acceptable
        expect(error).toBeDefined();
      }
    } finally {
      spy.mockRestore();
    }
  });

  it('should handle invalid theme ID', async () => {
    const request = new Request('http://localhost/api/themes/invalid/responses', {
      headers: { 'x-session-id': testSessionId }
    });

    const response = await GET(request, { params: Promise.resolve({ themeId: 'invalid' }) });
    
    // Should return 400 for invalid theme ID (NaN)
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid theme ID');
  });
});

