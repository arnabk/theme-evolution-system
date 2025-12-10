import { describe, it, expect, spyOn } from 'bun:test';
import { clusterSpansIntoThemes } from '../span-clusterer';
import { llm } from '@/lib/llm';
import { createMockSpan } from '../../__tests__/test-utils';
import type { ResponseWithSpans } from '../span-extractor';

describe('span-clusterer - Error Handling', () => {
  it('should handle LLM errors in clusterSpansIntoThemes', async () => {
    spyOn(llm, 'generate').mockRejectedValue(new Error('LLM API error'));

    const responses: ResponseWithSpans[] = [
      {
        id: 1,
        text: 'Test response',
        spans: [createMockSpan('test', 0, 4, 1)]
      }
    ];

    const themes = await clusterSpansIntoThemes(responses, 'Test?');

    // Should return empty array on error
    expect(themes).toHaveLength(0);
  }, 10000);
});

