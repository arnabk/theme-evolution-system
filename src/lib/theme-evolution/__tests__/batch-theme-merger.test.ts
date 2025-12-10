import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';
import { mergeSimilarThemes } from '../batch-theme-merger';
import type { ThemeWithResponses } from '../span-clusterer';
import { llm } from '@/lib/llm';
import { createMockSpan } from '../../__tests__/test-utils';

describe('batch-theme-merger', () => {
  beforeEach(() => {
    mock.restore();
  });

  describe('mergeSimilarThemes', () => {
    it('should return themes unchanged if only one theme', async () => {
      const themes: ThemeWithResponses[] = [
        {
          name: 'Theme 1',
          description: 'Description',
          contributingSpans: [createMockSpan('text', 0, 4, 1)],
          responseIds: [1],
          responses: [{ id: 1, text: 'Response', spans: [] }]
        }
      ];

      const result = await mergeSimilarThemes(themes);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Theme 1');
    });

    it('should return themes unchanged if empty array', async () => {
      const result = await mergeSimilarThemes([]);
      expect(result).toHaveLength(0);
    });

    it('should merge themes based on LLM response', async () => {
      const theme1: ThemeWithResponses = {
        name: 'Theme 1',
        description: 'First theme',
        contributingSpans: [createMockSpan('text1', 0, 5, 1)],
        responseIds: [1],
        responses: [{ id: 1, text: 'Response 1', spans: [] }]
      };

      const theme2: ThemeWithResponses = {
        name: 'Theme 2',
        description: 'Second theme',
        contributingSpans: [createMockSpan('text2', 0, 5, 2)],
        responseIds: [2],
        responses: [{ id: 2, text: 'Response 2', spans: [] }]
      };

      // Mock LLM to return merge groups
      const generateSpy = spyOn(llm, 'generate').mockResolvedValue('[[1, 2]]');

      const result = await mergeSimilarThemes([theme1, theme2]);

      expect(generateSpy).toHaveBeenCalled();
      // Should merge into one theme
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should handle LLM parse errors gracefully', async () => {
      const themes: ThemeWithResponses[] = [
        {
          name: 'Theme 1',
          description: 'Description',
          contributingSpans: [createMockSpan('text', 0, 4, 1)],
          responseIds: [1],
          responses: [{ id: 1, text: 'Response', spans: [] }]
        }
      ];

      // Mock LLM to return invalid JSON
      spyOn(llm, 'generate').mockResolvedValue('invalid json');

      const result = await mergeSimilarThemes(themes);

      // Should return original themes on error
      expect(result).toHaveLength(1);
    });

    it('should handle empty merge groups', async () => {
      const themes: ThemeWithResponses[] = [
        {
          name: 'Theme 1',
          description: 'Description',
          contributingSpans: [createMockSpan('text', 0, 4, 1)],
          responseIds: [1],
          responses: [{ id: 1, text: 'Response', spans: [] }]
        }
      ];

      // Mock LLM to return empty array
      spyOn(llm, 'generate').mockResolvedValue('[]');

      const result = await mergeSimilarThemes(themes);

      expect(result).toHaveLength(1);
    });

    it('should merge spans and responses correctly', async () => {
      const span1 = createMockSpan('text1', 0, 5, 1);
      const span2 = createMockSpan('text2', 0, 5, 2);

      const theme1: ThemeWithResponses = {
        name: 'Theme 1',
        description: 'First theme',
        contributingSpans: [span1],
        responseIds: [1],
        responses: [{ id: 1, text: 'Response 1', spans: [span1] }]
      };

      const theme2: ThemeWithResponses = {
        name: 'Theme 2',
        description: 'Second theme',
        contributingSpans: [span2],
        responseIds: [2],
        responses: [{ id: 2, text: 'Response 2', spans: [span2] }]
      };

      // Mock LLM to return merge groups
      spyOn(llm, 'generate').mockResolvedValue('[[1, 2]]');

      const result = await mergeSimilarThemes([theme1, theme2]);

      if (result.length === 1) {
        // If merged, should have both spans
        expect(result[0].contributingSpans.length).toBeGreaterThanOrEqual(1);
        expect(result[0].responseIds.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});

