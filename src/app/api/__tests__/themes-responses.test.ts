import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'bun:test';
import { GET } from '../themes/[themeId]/responses/route';
import { db } from '@/lib/database';
import { setupDatabaseMocks } from '@/lib/__tests__/setup-db-mock';

describe('API: /api/themes/[themeId]/responses', () => {
  const testSessionId = 'test-session-' + Date.now();

  beforeAll(async () => {
    await setupDatabaseMocks();
  });

  beforeEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  afterEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  describe('GET', () => {
    it('should return responses matching theme phrases', async () => {
      // Create theme with phrases
      await db.saveThemes(testSessionId, [{
        name: 'Support Theme',
        description: 'About support',
        phrases: [
          { text: 'support', class: 'request' },
          { text: 'help', class: 'request' }
        ],
        response_count: 0
      }]);

      // Create responses
      await db.saveResponses(testSessionId, 'Test?', [
        'I need support with this',
        'This is unrelated',
        'Can you help me?'
      ], 1);

      const themes = await db.getThemes(testSessionId);
      const themeId = themes[0].id;

      const request = new Request(`http://localhost/api/themes/${themeId}/responses`, {
        headers: { 'x-session-id': testSessionId }
      });

      const response = await GET(request, { params: Promise.resolve({ themeId: themeId.toString() }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.responses.length).toBeGreaterThanOrEqual(2); // At least 2 match
    });

    it('should return empty array if theme has no phrases', async () => {
      await db.saveThemes(testSessionId, [{
        name: 'Empty Theme',
        description: 'No phrases',
        phrases: [],
        response_count: 0
      }]);

      const themes = await db.getThemes(testSessionId);
      const themeId = themes[0].id;

      const request = new Request(`http://localhost/api/themes/${themeId}/responses`, {
        headers: { 'x-session-id': testSessionId }
      });

      const response = await GET(request, { params: Promise.resolve({ themeId: themeId.toString() }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.responses).toHaveLength(0);
      expect(data.total).toBe(0);
    });

    it('should return 404 if theme not found', async () => {
      const request = new Request('http://localhost/api/themes/99999/responses', {
        headers: { 'x-session-id': testSessionId }
      });

      const response = await GET(request, { params: Promise.resolve({ themeId: '99999' }) });
      expect(response.status).toBe(404);
    });

    it('should support pagination', async () => {
      await db.saveThemes(testSessionId, [{
        name: 'Test Theme',
        description: 'Test',
        phrases: [{ text: 'test', class: 'user_goal' }],
        response_count: 0
      }]);

      await db.saveResponses(testSessionId, 'Test?', [
        'This is a test',
        'Another test',
        'Third test'
      ], 1);

      const themes = await db.getThemes(testSessionId);
      const themeId = themes[0].id;

      const request = new Request(`http://localhost/api/themes/${themeId}/responses?page=1&pageSize=2`, {
        headers: { 'x-session-id': testSessionId }
      });

      const response = await GET(request, { params: Promise.resolve({ themeId: themeId.toString() }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(2);
    });

    it('should return 400 if session ID missing', async () => {
      const request = new Request('http://localhost/api/themes/1/responses');

      const response = await GET(request, { params: Promise.resolve({ themeId: '1' }) });
      expect(response.status).toBe(400);
    });

    it('should handle overlapping phrase matches correctly', async () => {
      // Create theme with overlapping phrases
      await db.saveThemes(testSessionId, [{
        name: 'Overlap Theme',
        description: 'Test overlapping phrases',
        phrases: [
          { text: 'support', class: 'request' },
          { text: 'port team', class: 'user_goal' }, // Overlaps with "support"
          { text: 'help', class: 'request' }
        ],
        response_count: 0
      }]);

      // Create response with overlapping phrase matches
      await db.saveResponses(testSessionId, 'Test?', [
        'I need support team help', // "support" and "port team" overlap
        'Help me please' // Just "help"
      ], 1);

      const themes = await db.getThemes(testSessionId);
      const themeId = themes[0].id;

      const request = new Request(`http://localhost/api/themes/${themeId}/responses`, {
        headers: { 'x-session-id': testSessionId }
      });

      const response = await GET(request, { params: Promise.resolve({ themeId: themeId.toString() }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.responses.length).toBeGreaterThan(0);
      
      // Check that overlapping highlights are handled (first response should have highlights)
      const firstResponse = data.responses.find((r: { text: string }) => r.text.includes('support'));
      expect(firstResponse).toBeDefined();
      if (firstResponse) {
        // Should have highlights but overlapping ones should be filtered
        expect(firstResponse.highlights.length).toBeGreaterThan(0);
      }
    });

    it('should handle phrase matches that completely contain other matches', async () => {
      // Create theme with phrases where one contains another
      await db.saveThemes(testSessionId, [{
        name: 'Containment Theme',
        description: 'Test phrase containment',
        phrases: [
          { text: 'support team', class: 'request' },
          { text: 'support', class: 'user_goal' }, // Contained in "support team"
          { text: 'team', class: 'user_goal' } // Also contained
        ],
        response_count: 0
      }]);

      await db.saveResponses(testSessionId, 'Test?', [
        'I need support team assistance'
      ], 1);

      const themes = await db.getThemes(testSessionId);
      const themeId = themes[0].id;

      const request = new Request(`http://localhost/api/themes/${themeId}/responses`, {
        headers: { 'x-session-id': testSessionId }
      });

      const response = await GET(request, { params: Promise.resolve({ themeId: themeId.toString() }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.responses.length).toBe(1);
      
      // Should handle containment overlaps
      const responseData = data.responses[0];
      expect(responseData.highlights.length).toBeGreaterThan(0);
    });

    it('should handle phrase matches that start before and end after existing highlights', async () => {
      // Create theme with phrases that create various overlap scenarios
      await db.saveThemes(testSessionId, [{
        name: 'Complex Overlap Theme',
        description: 'Test complex overlaps',
        phrases: [
          { text: 'abc', class: 'request' },
          { text: 'bcd', class: 'user_goal' }, // Overlaps with "abc"
          { text: 'abcd', class: 'emotion' } // Contains both
        ],
        response_count: 0
      }]);

      await db.saveResponses(testSessionId, 'Test?', [
        'I have abcdefg issue' // Multiple overlapping matches
      ], 1);

      const themes = await db.getThemes(testSessionId);
      const themeId = themes[0].id;

      const request = new Request(`http://localhost/api/themes/${themeId}/responses`, {
        headers: { 'x-session-id': testSessionId }
      });

      const response = await GET(request, { params: Promise.resolve({ themeId: themeId.toString() }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.responses.length).toBe(1);
      
      // Should handle all overlap cases
      const responseData = data.responses[0];
      expect(responseData.highlights.length).toBeGreaterThan(0);
    });

    it('should handle pagination edge cases', async () => {
      await db.saveThemes(testSessionId, [{
        name: 'Pagination Theme',
        description: 'Test pagination',
        phrases: [{ text: 'test', class: 'user_goal' }],
        response_count: 0
      }]);

      // Create 15 responses to test pagination - all should match "test" (case-insensitive)
      const responses = Array.from({ length: 15 }, (_, i) => `test response ${i + 1}`);
      await db.saveResponses(testSessionId, 'Test?', responses, 1);

      const themes = await db.getThemes(testSessionId);
      const themeId = themes[0].id;

      // Test page 1 first to verify all responses match
      const request1 = new Request(`http://localhost/api/themes/${themeId}/responses?page=1&pageSize=10`, {
        headers: { 'x-session-id': testSessionId }
      });

      const response1 = await GET(request1, { params: Promise.resolve({ themeId: themeId.toString() }) });
      expect(response1.status).toBe(200);
      const data1 = await response1.json();
      expect(data1.success).toBe(true);
      expect(data1.total).toBe(15); // All 15 should match

      // Test page 2
      const request = new Request(`http://localhost/api/themes/${themeId}/responses?page=2&pageSize=10`, {
        headers: { 'x-session-id': testSessionId }
      });

      const response = await GET(request, { params: Promise.resolve({ themeId: themeId.toString() }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.page).toBe(2);
      expect(data.pageSize).toBe(10);
      expect(data.responses.length).toBe(5); // Remaining 5 responses
      // hasMore = startIdx + paginatedResponses.length < total
      // For page 2: startIdx = 10, paginatedResponses.length = 5, total = 15
      // hasMore = 10 + 5 < 15 = 15 < 15 = false (correct - no more after page 2)
      expect(data.hasMore).toBe(false);
    });

    it('should handle invalid themeId parameter', async () => {
      const request = new Request('http://localhost/api/themes/invalid/responses', {
        headers: { 'x-session-id': testSessionId }
      });

      const response = await GET(request, { params: Promise.resolve({ themeId: 'invalid' }) });
      // Should return 400 for invalid theme ID (NaN)
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid theme ID');
    });

    it('should handle theme with no phrases', async () => {
      await db.saveThemes(testSessionId, [{
        name: 'Empty Theme',
        description: 'Theme with no phrases',
        phrases: [],
        response_count: 0
      }]);
      await db.saveResponses(testSessionId, 'Test?', ['Some response'], 1);
      
      const themes = await db.getThemes(testSessionId);
      const themeId = themes[0].id;
      
      const request = new Request(`http://localhost/api/themes/${themeId}/responses`, {
        headers: { 'x-session-id': testSessionId }
      });
      
      const response = await GET(request, { params: Promise.resolve({ themeId: themeId.toString() }) });
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.responses).toEqual([]);
      expect(data.total).toBe(0);
      expect(data.hasMore).toBe(false);
    });
  });
});

