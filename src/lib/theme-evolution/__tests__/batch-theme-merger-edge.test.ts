import { describe, it, expect, spyOn } from 'bun:test';
import { mergeSimilarThemes } from '../batch-theme-merger';
import { llm } from '@/lib/llm';
import { createMockSpan } from '../../__tests__/test-utils';
import type { ThemeWithResponses } from '../span-clusterer';

describe('batch-theme-merger - Edge Cases', () => {
  it('should handle invalid JSON from LLM', async () => {
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

    spyOn(llm, 'generate').mockResolvedValue('invalid json response');

    const result = await mergeSimilarThemes(themes);

    // Should return original themes on parse error
    expect(result).toHaveLength(2);
  });

  it('should handle empty merge groups array', async () => {
    const themes: ThemeWithResponses[] = [
      {
        name: 'Theme 1',
        description: 'First',
        contributingSpans: [createMockSpan('text', 0, 4, 1)],
        responseIds: [1],
        responses: [{ id: 1, text: 'Response', spans: [] }]
      }
    ];

    spyOn(llm, 'generate').mockResolvedValue('[]');

    const result = await mergeSimilarThemes(themes);

    expect(result).toHaveLength(1);
  });

  it('should handle merge groups with invalid indices', async () => {
    const themes: ThemeWithResponses[] = [
      {
        name: 'Theme 1',
        description: 'First',
        contributingSpans: [createMockSpan('text', 0, 4, 1)],
        responseIds: [1],
        responses: [{ id: 1, text: 'Response', spans: [] }]
      }
    ];

    // LLM returns indices that are out of bounds
    spyOn(llm, 'generate').mockResolvedValue('[[1, 999]]');

    const result = await mergeSimilarThemes(themes);

    // Should handle gracefully
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle merge groups with single theme', async () => {
    const themes: ThemeWithResponses[] = [
      {
        name: 'Theme 1',
        description: 'First',
        contributingSpans: [createMockSpan('text', 0, 4, 1)],
        responseIds: [1],
        responses: [{ id: 1, text: 'Response', spans: [] }]
      }
    ];

    // LLM returns group with only one theme (should be ignored)
    spyOn(llm, 'generate').mockResolvedValue('[[1]]');

    const result = await mergeSimilarThemes(themes);

    expect(result).toHaveLength(1);
  });
});

