import { describe, it, expect } from 'bun:test';
import { buildThemesWithResponses } from '../theme-builder';
import type { SemanticTheme } from '../span-clusterer';
import type { ResponseWithSpans, ExtractedSpan, ExtractionClass } from '../span-extractor';

describe('theme-builder', () => {
  const createSpan = (
    text: string,
    start: number,
    end: number,
    responseId: number,
    className: ExtractionClass = 'user_goal'
  ): ExtractedSpan => ({
    text,
    start,
    end,
    class: className,
    responseId
  });

  describe('buildThemesWithResponses', () => {
    it('should build themes with associated responses', () => {
      const span1 = createSpan('feels ignored', 0, 12, 1);
      const span2 = createSpan('wants support', 13, 25, 2);

      const themes: SemanticTheme[] = [
        {
          name: 'Theme 1',
          description: 'First theme',
          contributingSpans: [span1, span2],
          responseIds: [1, 2]
        }
      ];

      const responsesWithSpans: ResponseWithSpans[] = [
        {
          id: 1,
          text: 'Response 1 text',
          spans: [span1]
        },
        {
          id: 2,
          text: 'Response 2 text',
          spans: [span2]
        }
      ];

      const result = buildThemesWithResponses(themes, responsesWithSpans);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Theme 1');
      expect(result[0].responses).toHaveLength(2);
      expect(result[0].responses[0].id).toBe(1);
      expect(result[0].responses[0].spans).toHaveLength(1);
      expect(result[0].responses[1].id).toBe(2);
      expect(result[0].responses[1].spans).toHaveLength(1);
    });

    it('should filter spans to only those relevant to each theme', () => {
      const span1 = createSpan('feels ignored', 0, 12, 1);
      const span2 = createSpan('wants support', 13, 25, 1);
      const span3 = createSpan('needs help', 26, 35, 2);

      const themes: SemanticTheme[] = [
        {
          name: 'Theme 1',
          description: 'First theme',
          contributingSpans: [span1, span2], // Only spans from response 1
          responseIds: [1]
        },
        {
          name: 'Theme 2',
          description: 'Second theme',
          contributingSpans: [span3], // Only span from response 2
          responseIds: [2]
        }
      ];

      const responsesWithSpans: ResponseWithSpans[] = [
        {
          id: 1,
          text: 'Response 1 text',
          spans: [span1, span2, span3] // Has all spans
        },
        {
          id: 2,
          text: 'Response 2 text',
          spans: [span3]
        }
      ];

      const result = buildThemesWithResponses(themes, responsesWithSpans);

      expect(result).toHaveLength(2);
      expect(result[0].responses[0].spans).toHaveLength(2); // Only relevant spans
      expect(result[0].responses[0].spans).toEqual([span1, span2]);
      expect(result[1].responses[0].spans).toHaveLength(1);
      expect(result[1].responses[0].spans).toEqual([span3]);
    });

    it('should handle missing responses gracefully', () => {
      const span1 = createSpan('feels ignored', 0, 12, 1);
      const span2 = createSpan('wants support', 13, 25, 999); // Non-existent response

      const themes: SemanticTheme[] = [
        {
          name: 'Theme 1',
          description: 'First theme',
          contributingSpans: [span1, span2],
          responseIds: [1, 999]
        }
      ];

      const responsesWithSpans: ResponseWithSpans[] = [
        {
          id: 1,
          text: 'Response 1 text',
          spans: [span1]
        }
      ];

      const result = buildThemesWithResponses(themes, responsesWithSpans);

      expect(result).toHaveLength(1);
      expect(result[0].responses).toHaveLength(1); // Only response 1, 999 is missing
      expect(result[0].responses[0].id).toBe(1);
    });

    it('should handle empty themes array', () => {
      const responsesWithSpans: ResponseWithSpans[] = [
        {
          id: 1,
          text: 'Response 1 text',
          spans: []
        }
      ];

      const result = buildThemesWithResponses([], responsesWithSpans);

      expect(result).toHaveLength(0);
    });

    it('should handle empty responses array', () => {
      const span1 = createSpan('feels ignored', 0, 12, 1);

      const themes: SemanticTheme[] = [
        {
          name: 'Theme 1',
          description: 'First theme',
          contributingSpans: [span1],
          responseIds: [1]
        }
      ];

      const result = buildThemesWithResponses(themes, []);

      expect(result).toHaveLength(1);
      expect(result[0].responses).toHaveLength(0);
    });

    it('should deduplicate responseIds', () => {
      const span1 = createSpan('feels ignored', 0, 12, 1);
      const span2 = createSpan('wants support', 13, 25, 1); // Same response

      const themes: SemanticTheme[] = [
        {
          name: 'Theme 1',
          description: 'First theme',
          contributingSpans: [span1, span2],
          responseIds: [1, 1] // Duplicate
        }
      ];

      const responsesWithSpans: ResponseWithSpans[] = [
        {
          id: 1,
          text: 'Response 1 text',
          spans: [span1, span2]
        }
      ];

      const result = buildThemesWithResponses(themes, responsesWithSpans);

      expect(result[0].responses).toHaveLength(1); // Should not duplicate
    });
  });
});

