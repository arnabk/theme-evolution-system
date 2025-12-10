import { describe, it, expect } from 'bun:test';
import { deduplicateSpansAcrossThemes } from '../theme-deduplicator';
import type { ExtractedSpan, ExtractionClass } from '../span-extractor';
import type { ThemeWithResponses } from '../span-clusterer';

describe('theme-deduplicator', () => {
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

  describe('deduplicateSpansAcrossThemes', () => {
    it('should remove duplicate spans across themes', () => {
      const span1 = createSpan('feels ignored', 0, 12, 1);
      const span2 = createSpan('wants support', 13, 25, 2);
      const span3 = createSpan('feels ignored', 0, 12, 1); // Duplicate of span1

      const themes: ThemeWithResponses[] = [
        {
          name: 'Theme 1',
          description: 'First theme',
          contributingSpans: [span1, span2],
          responseIds: [1, 2],
          responses: [
            { id: 1, text: 'Response 1', spans: [span1] },
            { id: 2, text: 'Response 2', spans: [span2] }
          ]
        },
        {
          name: 'Theme 2',
          description: 'Second theme',
          contributingSpans: [span3], // Duplicate span
          responseIds: [1],
          responses: [
            { id: 1, text: 'Response 1', spans: [span3] }
          ]
        }
      ];

      const result = deduplicateSpansAcrossThemes(themes);

      expect(result).toHaveLength(1); // Second theme removed (no spans after dedup)
      expect(result[0].contributingSpans).toHaveLength(2);
      expect(result[0].name).toBe('Theme 1');
    });

    it('should keep spans that appear in different positions', () => {
      const span1 = createSpan('feels ignored', 0, 12, 1);
      const span2 = createSpan('feels ignored', 5, 17, 2); // Different position

      const themes: ThemeWithResponses[] = [
        {
          name: 'Theme 1',
          description: 'First theme',
          contributingSpans: [span1],
          responseIds: [1],
          responses: [{ id: 1, text: 'Response 1', spans: [span1] }]
        },
        {
          name: 'Theme 2',
          description: 'Second theme',
          contributingSpans: [span2],
          responseIds: [2],
          responses: [{ id: 2, text: 'Response 2', spans: [span2] }]
        }
      ];

      const result = deduplicateSpansAcrossThemes(themes);

      expect(result).toHaveLength(2);
      expect(result[0].contributingSpans).toHaveLength(1);
      expect(result[1].contributingSpans).toHaveLength(1); // Different position, kept
    });

    it('should remove themes with no spans after deduplication', () => {
      const span1 = createSpan('feels ignored', 0, 12, 1);
      const span2 = createSpan('feels ignored', 0, 12, 1); // Exact duplicate

      const themes: ThemeWithResponses[] = [
        {
          name: 'Theme 1',
          description: 'First theme',
          contributingSpans: [span1],
          responseIds: [1],
          responses: [{ id: 1, text: 'Response 1', spans: [span1] }]
        },
        {
          name: 'Theme 2',
          description: 'Second theme',
          contributingSpans: [span2], // Duplicate
          responseIds: [1],
          responses: [{ id: 1, text: 'Response 1', spans: [span2] }]
        }
      ];

      const result = deduplicateSpansAcrossThemes(themes);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Theme 1');
    });

    it('should handle empty themes array', () => {
      const result = deduplicateSpansAcrossThemes([]);
      expect(result).toHaveLength(0);
    });

    it('should update responseIds after deduplication', () => {
      const span1 = createSpan('feels ignored', 0, 12, 1);
      const span2 = createSpan('wants support', 13, 25, 2);
      const span3 = createSpan('needs help', 26, 35, 1);

      const themes: ThemeWithResponses[] = [
        {
          name: 'Theme 1',
          description: 'First theme',
          contributingSpans: [span1, span2, span3],
          responseIds: [1, 2],
          responses: [
            { id: 1, text: 'Response 1', spans: [span1, span3] },
            { id: 2, text: 'Response 2', spans: [span2] }
          ]
        }
      ];

      const result = deduplicateSpansAcrossThemes(themes);

      expect(result[0].responseIds).toEqual([1, 2]);
      expect(result[0].responseIds.length).toBe(2);
    });

    it('should filter out responses with no spans after deduplication', () => {
      const span1 = createSpan('feels ignored', 0, 12, 1);
      const span2 = createSpan('feels ignored', 0, 12, 1); // Duplicate

      const themes: ThemeWithResponses[] = [
        {
          name: 'Theme 1',
          description: 'First theme',
          contributingSpans: [span1],
          responseIds: [1],
          responses: [
            { id: 1, text: 'Response 1', spans: [span1] }
          ]
        },
        {
          name: 'Theme 2',
          description: 'Second theme',
          contributingSpans: [span2], // Will be removed
          responseIds: [1],
          responses: [
            { id: 1, text: 'Response 1', spans: [span2] }
          ]
        }
      ];

      const result = deduplicateSpansAcrossThemes(themes);

      // Theme 2 should be completely removed (no spans after dedup)
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Theme 1');
    });
  });
});

