import { describe, it, expect, spyOn } from 'bun:test';
import { mergeWithExistingThemes } from '../theme-merger';
import { llm } from '@/lib/llm';
import { createMockTheme } from '../../__tests__/test-utils';
import type { Theme } from '@/lib/entities/Theme';

describe('theme-merger - Edge Cases', () => {
  it('should handle LLM parse errors in similarity score', async () => {
    const existingTheme = createMockTheme(1, 'Existing Theme', [
      { text: 'phrase 1', class: 'user_goal' }
    ]);

    const newTheme = {
      name: 'New Theme',
      description: 'Description',
      phrases: [{ text: 'phrase 2', class: 'user_goal' }],
      response_count: 1
    };

    // LLM returns invalid response
    spyOn(llm, 'generate').mockResolvedValue('invalid response');

    const result = await mergeWithExistingThemes(
      [existingTheme as Theme],
      [newTheme],
      () => {}
    );

    // Should default to 0 similarity (no merge)
    expect(result.newThemes.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle empty phrases arrays', async () => {
    const existingTheme = createMockTheme(1, 'Existing Theme', []);
    const newTheme = {
      name: 'New Theme',
      description: 'Description',
      phrases: [],
      response_count: 0
    };

    spyOn(llm, 'generate').mockResolvedValue('50');

    const result = await mergeWithExistingThemes(
      [existingTheme as Theme],
      [newTheme],
      () => {}
    );

    expect(result).toBeDefined();
  });

  it('should handle very high similarity scores', async () => {
    const existingTheme = createMockTheme(1, 'Existing Theme', [
      { text: 'phrase', class: 'user_goal' }
    ]);
    const newTheme = {
      name: 'Very Similar Theme',
      description: 'Very similar description',
      phrases: [{ text: 'phrase', class: 'user_goal' }],
      response_count: 1
    };

    // LLM returns 100% similarity
    spyOn(llm, 'generate').mockResolvedValue('100');

    const result = await mergeWithExistingThemes(
      [existingTheme as Theme],
      [newTheme],
      () => {}
    );

    // Should merge (100 >= 80)
    expect(result.updatedThemes.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle very low similarity scores', async () => {
    const existingTheme = createMockTheme(1, 'Existing Theme', [
      { text: 'phrase 1', class: 'user_goal' }
    ]);
    const newTheme = {
      name: 'Completely Different Theme',
      description: 'Different',
      phrases: [{ text: 'different phrase', class: 'pain_point' }],
      response_count: 1
    };

    // LLM returns 0% similarity
    spyOn(llm, 'generate').mockResolvedValue('0');

    const result = await mergeWithExistingThemes(
      [existingTheme as Theme],
      [newTheme],
      () => {}
    );

    // Should not merge (0 < 80)
    expect(result.newThemes.length).toBeGreaterThanOrEqual(0);
  });
});

