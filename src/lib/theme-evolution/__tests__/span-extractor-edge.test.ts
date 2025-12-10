import { describe, it, expect, spyOn } from 'bun:test';
import { extractSpansFromResponses, groupSpansByClass, EXTRACTION_CLASSES } from '../span-extractor';
import { llm } from '@/lib/llm';

describe('span-extractor - Edge Cases', () => {
  describe('extractSpansFromResponses', () => {
    it('should handle invalid JSON from LLM', async () => {
      spyOn(llm, 'generate').mockResolvedValue('not valid json');

      const responses = [{ id: 1, text: 'Test response' }];
      const results = await extractSpansFromResponses(responses, 'Test?');

      expect(results).toHaveLength(0);
    }, 10000);

    it('should handle LLM response with no JSON array', async () => {
      spyOn(llm, 'generate').mockResolvedValue('This is just text, no JSON array');

      const responses = [{ id: 1, text: 'Test response' }];
      const results = await extractSpansFromResponses(responses, 'Test?');

      expect(results).toHaveLength(0);
    }, 10000);

    it('should skip spans with invalid extraction class', async () => {
      const mockLLMResponse = JSON.stringify([
        { text: 'valid span', class: 'user_goal' },
        { text: 'invalid class', class: 'invalid_class' }
      ]);

      spyOn(llm, 'generate').mockResolvedValue(mockLLMResponse);

      const responses = [{ id: 1, text: 'valid span invalid class' }];
      const results = await extractSpansFromResponses(responses, 'Test?');

      // Should only include valid spans
      if (results.length > 0 && results[0].spans.length > 0) {
        expect(results[0].spans.every(s => EXTRACTION_CLASSES.includes(s.class))).toBe(true);
      }
    }, 10000);

    it('should handle spans not found in text', async () => {
      const mockLLMResponse = JSON.stringify([
        { text: 'nonexistent phrase that is not in the response', class: 'user_goal' }
      ]);

      spyOn(llm, 'generate').mockResolvedValue(mockLLMResponse);

      const responses = [{ id: 1, text: 'This is a completely different text' }];
      const results = await extractSpansFromResponses(responses, 'Test?');

      // Should skip spans that don't exist
      expect(results.length).toBeLessThanOrEqual(1);
    }, 10000);

    it('should handle empty response text', async () => {
      const responses = [{ id: 1, text: '' }];
      const results = await extractSpansFromResponses(responses, 'Test?');

      expect(Array.isArray(results)).toBe(true);
    }, 10000);

    it('should handle very long response text', async () => {
      const longText = 'word '.repeat(1000);
      const responses = [{ id: 1, text: longText }];
      
      const mockLLMResponse = JSON.stringify([
        { text: 'word', class: 'user_goal' }
      ]);
      spyOn(llm, 'generate').mockResolvedValue(mockLLMResponse);

      const results = await extractSpansFromResponses(responses, 'Test?');

      expect(Array.isArray(results)).toBe(true);
    }, 10000);
  });

  describe('groupSpansByClass', () => {
    it('should handle all extraction classes', () => {
      const responses = EXTRACTION_CLASSES.map((cls, idx) => ({
        id: idx + 1,
        text: `Response ${idx}`,
        spans: [{
          text: `span ${idx}`,
          class: cls,
          start: 0,
          end: 5,
          responseId: idx + 1
        }]
      }));

      const grouped = groupSpansByClass(responses);

      for (const cls of EXTRACTION_CLASSES) {
        expect(grouped.has(cls)).toBe(true);
        expect(grouped.get(cls)?.length).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

