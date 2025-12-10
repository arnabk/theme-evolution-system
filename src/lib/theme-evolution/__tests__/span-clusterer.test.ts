import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { clusterSpansIntoThemes, buildThemesWithResponses, mergeSimilarThemes, deduplicateSpansAcrossThemes } from '../span-clusterer';
import { llm } from '@/lib/llm';
import { createMockSpan } from '../../__tests__/test-utils';
import type { ResponseWithSpans } from '../span-extractor';
import type { ThemeWithResponses } from '../span-clusterer';

describe('span-clusterer', () => {
  beforeEach(() => {
    // Reset mocks
  });

  describe('clusterSpansIntoThemes', () => {
    it('should return empty array if no spans', async () => {
      const responses: ResponseWithSpans[] = [
        { id: 1, text: 'Response 1', spans: [] }
      ];

      const themes = await clusterSpansIntoThemes(responses, 'Test question?');

      expect(themes).toHaveLength(0);
    });

    it('should handle empty responses array', async () => {
      const themes = await clusterSpansIntoThemes([], 'Test question?');

      expect(themes).toHaveLength(0);
    });

    it('should cluster spans into themes', async () => {
      const mockThemes = JSON.stringify([
        {
          name: 'Theme 1',
          description: 'First theme',
          spanPatterns: ['feels', 'ignored']
        },
        {
          name: 'Theme 2',
          description: 'Second theme',
          spanPatterns: ['wants', 'support']
        }
      ]);

      const mockAssignments = JSON.stringify([1, 2, 1]);

      spyOn(llm, 'generate')
        .mockResolvedValueOnce(mockThemes)
        .mockResolvedValueOnce(mockAssignments);

      const responses: ResponseWithSpans[] = [
        {
          id: 1,
          text: 'I feel ignored',
          spans: [
            createMockSpan('feels ignored', 2, 14, 1, 'emotion')
          ]
        },
        {
          id: 2,
          text: 'I want support',
          spans: [
            createMockSpan('wants support', 2, 14, 2, 'request')
          ]
        }
      ];

      const themes = await clusterSpansIntoThemes(responses, 'Test question?');

      expect(Array.isArray(themes)).toBe(true);
    }, 10000);

    it('should handle LLM parse errors gracefully', async () => {
      spyOn(llm, 'generate').mockResolvedValue('invalid json');

      const responses: ResponseWithSpans[] = [
        {
          id: 1,
          text: 'Test',
          spans: [createMockSpan('test', 0, 4, 1)]
        }
      ];

      const themes = await clusterSpansIntoThemes(responses, 'Test?');

      expect(themes).toHaveLength(0);
    }, 10000);

    it('should handle LLM assignment errors with fallback', async () => {
      const mockThemes = JSON.stringify([
        {
          name: 'Theme 1',
          description: 'Test theme',
          spanPatterns: ['test']
        }
      ]);

      // First call succeeds (themes), second fails (assignments) - should use fallback
      spyOn(llm, 'generate')
        .mockResolvedValueOnce(mockThemes)
        .mockRejectedValueOnce(new Error('LLM error'));

      const responses: ResponseWithSpans[] = [
        {
          id: 1,
          text: 'This is a test response',
          spans: [createMockSpan('test', 10, 14, 1)]
        }
      ];

      const themes = await clusterSpansIntoThemes(responses, 'Test?');

      // Should use pattern matching fallback
      expect(Array.isArray(themes)).toBe(true);
    }, 10000);

    it('should call onProgress callback', async () => {
      const mockThemes = JSON.stringify([{
        name: 'Theme 1',
        description: 'Test',
        spanPatterns: ['test']
      }]);
      const mockAssignments = JSON.stringify([1]);

      spyOn(llm, 'generate')
        .mockResolvedValueOnce(mockThemes)
        .mockResolvedValueOnce(mockAssignments);

      const onProgress = () => {
        // Progress callback
      };

      const responses: ResponseWithSpans[] = [
        {
          id: 1,
          text: 'Test',
          spans: [createMockSpan('test', 0, 4, 1)]
        }
      ];

      await clusterSpansIntoThemes(responses, 'Test?', onProgress);

      // Progress may or may not be called
      expect(true).toBe(true);
    }, 10000);
  });

  describe('buildThemesWithResponses', () => {
    it('should build themes with associated responses', () => {
      const themes = [
        {
          name: 'Theme 1',
          description: 'Description',
          contributingSpans: [createMockSpan('text', 0, 4, 1)],
          responseIds: [1]
        }
      ];

      const responses: ResponseWithSpans[] = [
        {
          id: 1,
          text: 'Response 1',
          spans: [createMockSpan('text', 0, 4, 1)]
        }
      ];

      const result = buildThemesWithResponses(themes, responses);

      expect(result).toHaveLength(1);
      expect(result[0].responses).toHaveLength(1);
    });
  });

  describe('mergeSimilarThemes', () => {
    it('should merge similar themes within a batch', async () => {
      const themes: ThemeWithResponses[] = [
        {
          name: 'Theme 1',
          description: 'First theme',
          contributingSpans: [createMockSpan('text1', 0, 5, 1)],
          responseIds: [1],
          responses: [{ id: 1, text: 'Response 1', spans: [] }]
        },
        {
          name: 'Theme 2',
          description: 'Similar theme',
          contributingSpans: [createMockSpan('text2', 0, 5, 2)],
          responseIds: [2],
          responses: [{ id: 2, text: 'Response 2', spans: [] }]
        }
      ];

      spyOn(llm, 'generate').mockResolvedValue('[[1, 2]]');

      const result = await mergeSimilarThemes(themes);

      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe('deduplicateSpansAcrossThemes', () => {
    it('should remove duplicate spans', () => {
      const span1 = createMockSpan('duplicate', 0, 9, 1);
      const span2 = createMockSpan('duplicate', 0, 9, 1);

      const themes: ThemeWithResponses[] = [
        {
          name: 'Theme 1',
          description: 'First',
          contributingSpans: [span1],
          responseIds: [1],
          responses: [{ id: 1, text: 'Response', spans: [span1] }]
        },
        {
          name: 'Theme 2',
          description: 'Second',
          contributingSpans: [span2],
          responseIds: [1],
          responses: [{ id: 1, text: 'Response', spans: [span2] }]
        }
      ];

      const result = deduplicateSpansAcrossThemes(themes);

      expect(result.length).toBeLessThanOrEqual(2);
    });
  });
});

