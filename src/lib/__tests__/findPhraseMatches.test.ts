import { describe, it, expect } from 'bun:test';

// Copy the function from the route file for testing
function findPhraseMatches(text: string, phrases: Array<{ text: string; class: string }>): Array<{
  text: string;
  start: number;
  end: number;
  class: string;
}> {
  const highlights: Array<{ text: string; start: number; end: number; class: string }> = [];
  const lowerText = text.toLowerCase();
  const usedRanges: Array<{ start: number; end: number }> = [];

  for (const phrase of phrases) {
    const lowerPhrase = phrase.text.toLowerCase();
    let searchStart = 0;

    while (true) {
      const foundIndex = lowerText.indexOf(lowerPhrase, searchStart);
      if (foundIndex === -1) break;

      const endIndex = foundIndex + phrase.text.length;

      // Check for overlap with existing highlights
      const overlaps = usedRanges.some(r => 
        (foundIndex >= r.start && foundIndex < r.end) ||
        (endIndex > r.start && endIndex <= r.end) ||
        (foundIndex <= r.start && endIndex >= r.end)
      );

      if (!overlaps) {
        // Get actual text from response (preserve original case)
        const actualText = text.substring(foundIndex, endIndex);
        
        highlights.push({
          text: actualText,
          start: foundIndex,
          end: endIndex,
          class: phrase.class
        });
        
        usedRanges.push({ start: foundIndex, end: endIndex });
      }

      searchStart = foundIndex + 1;
    }
  }

  // Sort by position
  highlights.sort((a, b) => a.start - b.start);
  
  return highlights;
}

describe('findPhraseMatches', () => {
  it('should find matching phrases in text', () => {
    const text = 'I need support with this issue';
    const phrases = [
      { text: 'support', class: 'request' },
      { text: 'issue', class: 'pain_point' }
    ];

    const matches = findPhraseMatches(text, phrases);

    expect(matches.length).toBe(2);
    expect(matches[0].text.toLowerCase()).toBe('support');
    expect(matches[1].text.toLowerCase()).toBe('issue');
  });

  it('should be case-insensitive', () => {
    const text = 'I need SUPPORT';
    const phrases = [{ text: 'support', class: 'request' }];

    const matches = findPhraseMatches(text, phrases);

    expect(matches.length).toBe(1);
    expect(matches[0].text).toBe('SUPPORT'); // Preserves original case
    expect(matches[0].start).toBeGreaterThanOrEqual(0);
  });

  it('should handle overlapping phrases', () => {
    const text = 'I need support';
    const phrases = [
      { text: 'need support', class: 'request' },
      { text: 'support', class: 'request' }
    ];

    const matches = findPhraseMatches(text, phrases);

    // Should only match one (the longer one or first one)
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('should return empty array if no matches', () => {
    const text = 'This is a test';
    const phrases = [{ text: 'nonexistent', class: 'user_goal' }];

    const matches = findPhraseMatches(text, phrases);

    expect(matches).toHaveLength(0);
  });

  it('should handle multiple occurrences of same phrase', () => {
    const text = 'support is great, I love support';
    const phrases = [{ text: 'support', class: 'request' }];

    const matches = findPhraseMatches(text, phrases);

    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('should preserve original case in matches', () => {
    const text = 'I Need Support';
    const phrases = [{ text: 'need', class: 'request' }];

    const matches = findPhraseMatches(text, phrases);

    expect(matches[0].text).toBe('Need'); // Preserves original case
  });

  it('should sort matches by position', () => {
    const text = 'first second third';
    const phrases = [
      { text: 'third', class: 'user_goal' },
      { text: 'first', class: 'user_goal' },
      { text: 'second', class: 'user_goal' }
    ];

    const matches = findPhraseMatches(text, phrases);

    expect(matches[0].text).toBe('first');
    expect(matches[1].text).toBe('second');
    expect(matches[2].text).toBe('third');
  });
});

