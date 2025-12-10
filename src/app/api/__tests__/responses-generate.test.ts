import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { POST } from '../responses/generate/route';
import { db } from '@/lib/database';
import { llm } from '@/lib/llm';

describe('API: /api/responses/generate', () => {
  const testSessionId = 'test-session-' + Date.now();

  beforeEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  afterEach(async () => {
    await db.clearSessionData(testSessionId);
  });

  describe('POST', () => {
    it('should generate and save responses', async () => {
      const mockResponses = ['Response 1', 'Response 2', 'Response 3'];
      spyOn(llm, 'generateMultipleResponses').mockResolvedValue(mockResponses);

      const request = new Request('http://localhost/api/responses/generate', {
        method: 'POST',
        headers: {
          'x-session-id': testSessionId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: 'Test question?', count: 3 })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.responses).toHaveLength(3);
      expect(data.batchId).toBe(1);

      // Verify responses were saved
      const stats = await db.getStats(testSessionId);
      expect(stats.total_responses).toBe(3);
    });

    it('should use default count if not provided', async () => {
      const mockResponses = Array(20).fill('Response');
      spyOn(llm, 'generateMultipleResponses').mockResolvedValue(mockResponses);

      const request = new Request('http://localhost/api/responses/generate', {
        method: 'POST',
        headers: {
          'x-session-id': testSessionId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: 'Test question?' })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return 400 if question missing', async () => {
      const request = new Request('http://localhost/api/responses/generate', {
        method: 'POST',
        headers: {
          'x-session-id': testSessionId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count: 10 })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 if session ID missing', async () => {
      const request = new Request('http://localhost/api/responses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Test?' })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should handle LLM errors gracefully', async () => {
      spyOn(llm, 'generateMultipleResponses').mockRejectedValue(new Error('LLM error'));

      const request = new Request('http://localhost/api/responses/generate', {
        method: 'POST',
        headers: {
          'x-session-id': testSessionId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: 'Test question?', count: 5 })
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
});

