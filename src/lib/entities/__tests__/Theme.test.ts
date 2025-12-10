import { describe, it, expect } from 'bun:test';
import { Theme } from '../Theme';

describe('Theme Entity', () => {
  describe('getPhrases', () => {
    it('should return empty array when phrases is null', () => {
      const theme = new Theme();
      theme.phrases = null;
      
      const phrases = theme.getPhrases();
      expect(phrases).toEqual([]);
    });

    it('should return empty array when phrases is empty string', () => {
      const theme = new Theme();
      theme.phrases = '';
      
      const phrases = theme.getPhrases();
      expect(phrases).toEqual([]);
    });

    it('should parse valid JSON phrases', () => {
      const theme = new Theme();
      theme.phrases = JSON.stringify([
        { text: 'test phrase', class: 'user_goal' },
        { text: 'another phrase', class: 'emotion' }
      ]);
      
      const phrases = theme.getPhrases();
      expect(phrases).toHaveLength(2);
      expect(phrases[0].text).toBe('test phrase');
      expect(phrases[0].class).toBe('user_goal');
      expect(phrases[1].text).toBe('another phrase');
      expect(phrases[1].class).toBe('emotion');
    });

    it('should return empty array when JSON is invalid', () => {
      const theme = new Theme();
      theme.phrases = 'invalid json {';
      
      const phrases = theme.getPhrases();
      expect(phrases).toEqual([]);
    });

    it('should return parsed object when JSON is not an array', () => {
      const theme = new Theme();
      theme.phrases = '{"not": "an array"}';
      
      const phrases = theme.getPhrases();
      // getPhrases doesn't validate that it's an array, it just parses JSON
      // So it will return the parsed object, not an empty array
      expect(Array.isArray(phrases)).toBe(false);
      expect(phrases).toEqual({ not: 'an array' });
    });
  });
});

