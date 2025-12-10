import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { POST } from '../questions/generate/route';
import { db } from '@/lib/database';
import { llm } from '@/lib/llm';

describe('API: /api/questions/generate', () => {
  const testSessionId = 'test-session-' + Date.now();

  beforeEach(async () => {
    // Ensure we're using the real implementation for setup
    await db.clearSessionData(testSessionId);
  });

  afterEach(async () => {
    // Restore real implementation for cleanup
    await db.clearSessionData(testSessionId);
  });

  describe('POST', () => {
    it('should generate a new question and clear session data', async () => {
      // Ensure session exists first
      await db.getOrCreateSession(testSessionId);
      
      // Set up existing data
      await db.saveCurrentQuestion(testSessionId, 'Old question?');
      await db.saveResponses(testSessionId, 'Old question?', ['Response 1'], 1);

      const mockQuestion = 'New generated question?';
      const generateQuestionSpy = spyOn(llm, 'generateQuestion').mockResolvedValue(mockQuestion);

      const request = new Request('http://localhost/api/questions/generate', {
        method: 'POST',
        headers: { 'x-session-id': testSessionId }
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.question).toBe(mockQuestion);
      expect(generateQuestionSpy).toHaveBeenCalled();

      // Verify old data was cleared
      const stats = await db.getStats(testSessionId);
      expect(stats.total_responses).toBe(0);

      // Verify new question was saved - need to ensure session exists
      await db.getOrCreateSession(testSessionId);
      const question = await db.getCurrentQuestion(testSessionId);
      expect(question).toBe(mockQuestion);
    });

    it('should return 400 if session ID missing', async () => {
      const request = new Request('http://localhost/api/questions/generate', {
        method: 'POST'
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should handle LLM errors gracefully', async () => {
      spyOn(llm, 'generateQuestion').mockRejectedValue(new Error('LLM error'));

      const request = new Request('http://localhost/api/questions/generate', {
        method: 'POST',
        headers: { 'x-session-id': testSessionId }
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      const spy = spyOn(db, 'clearSessionData').mockRejectedValue(new Error('Database error'));

      try {
        const request = new Request('http://localhost/api/questions/generate', {
          method: 'POST',
          headers: { 'x-session-id': testSessionId }
        });

        const response = await POST(request);
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

