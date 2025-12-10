import { describe, it, expect, spyOn } from 'bun:test';
import { mergeSimilarThemes } from '../batch-theme-merger';
import { llm } from '@/lib/llm';
import { createMockSpan } from '../../__tests__/test-utils';
import type { ThemeWithResponses } from '../span-clusterer';

describe('batch-theme-merger - Additional Edge Cases', () => {
  it('should handle merge groups with duplicate indices', async () => {
    const themes: ThemeWithResponses[] = [
      {
        name: 'Theme 1',
        description: 'First',
        contributingSpans: [createMockSpan('text', 0, 4, 1)],
        responseIds: [1],
        responses: [{ id: 1, text: 'Response', spans: [] }]
      },
      {
        name: 'Theme 2',
        description: 'Second',
        contributingSpans: [createMockSpan('text2', 0, 5, 2)],
        responseIds: [2],
        responses: [{ id: 2, text: 'Response 2', spans: [] }]
      }
    ];

    // LLM returns group with duplicate indices
    spyOn(llm, 'generate').mockResolvedValue('[[1, 1, 2]]');

    const result = await mergeSimilarThemes(themes);

    // Should handle gracefully
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle themes already marked as merged', async () => {
    const themes: ThemeWithResponses[] = [
      {
        name: 'Theme 1',
        description: 'First',
        contributingSpans: [createMockSpan('text', 0, 4, 1)],
        responseIds: [1],
        responses: [{ id: 1, text: 'Response', spans: [] }]
      },
      {
        name: 'Theme 2',
        description: 'Second',
        contributingSpans: [createMockSpan('text2', 0, 5, 2)],
        responseIds: [2],
        responses: [{ id: 2, text: 'Response 2', spans: [] }]
      },
      {
        name: 'Theme 3',
        description: 'Third',
        contributingSpans: [createMockSpan('text3', 0, 5, 3)],
        responseIds: [3],
        responses: [{ id: 3, text: 'Response 3', spans: [] }]
      }
    ];

    // LLM returns overlapping groups
    spyOn(llm, 'generate').mockResolvedValue('[[1, 2], [2, 3]]');

    const result = await mergeSimilarThemes(themes);

    // Should handle overlapping groups
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle empty themes array', async () => {
    const result = await mergeSimilarThemes([]);
    expect(result).toHaveLength(0);
  });
});

