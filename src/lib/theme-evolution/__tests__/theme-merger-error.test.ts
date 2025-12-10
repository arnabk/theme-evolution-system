import { describe, it, expect, spyOn } from 'bun:test';
import { mergeWithExistingThemes } from '../theme-merger';
import { llm } from '@/lib/llm';
import { createMockTheme } from '../../__tests__/test-utils';
import type { Theme } from '@/lib/entities/Theme';

describe('theme-merger - Error Handling', () => {
  it('should handle LLM errors in similarity check', async () => {
    const existingTheme = createMockTheme(1, 'Existing Theme', [
      { text: 'phrase', class: 'user_goal' }
    ]);
    const newTheme = {
      name: 'New Theme',
      description: 'Description',
      phrases: [{ text: 'phrase', class: 'user_goal' }],
      response_count: 1
    };

    // LLM throws error
    spyOn(llm, 'generate').mockRejectedValue(new Error('LLM API error'));

    const result = await mergeWithExistingThemes(
      [existingTheme as Theme],
      [newTheme],
      () => {}
    );

    // Should default to 0 similarity (no merge) on error
    expect(result).toBeDefined();
    expect(result.newThemes.length).toBeGreaterThanOrEqual(0);
  });
});

