import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { getModel } from '../utils';

describe('utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getModel', () => {
    it('should return OpenAI model when LLM_PROVIDER is openai', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.OPENAI_MODEL = 'gpt-4';
      expect(getModel()).toBe('gpt-4');
    });

    it('should return default OpenAI model when OPENAI_MODEL not set', () => {
      process.env.LLM_PROVIDER = 'openai';
      delete process.env.OPENAI_MODEL;
      expect(getModel()).toBe('gpt-4o-mini');
    });

    it('should return Gemini model when LLM_PROVIDER is gemini', () => {
      process.env.LLM_PROVIDER = 'gemini';
      process.env.GEMINI_MODEL = 'gemini-pro';
      expect(getModel()).toBe('gemini-pro');
    });

    it('should return default Gemini model when GEMINI_MODEL not set', () => {
      process.env.LLM_PROVIDER = 'gemini';
      delete process.env.GEMINI_MODEL;
      expect(getModel()).toBe('gemini-1.5-flash');
    });

    it('should return Ollama model when LLM_PROVIDER is ollama', () => {
      process.env.LLM_PROVIDER = 'ollama';
      process.env.OLLAMA_MODEL = 'llama3:8b';
      expect(getModel()).toBe('llama3:8b');
    });

    it('should return default Ollama model when OLLAMA_MODEL not set', () => {
      process.env.LLM_PROVIDER = 'ollama';
      delete process.env.OLLAMA_MODEL;
      expect(getModel()).toBe('llama3.2:3b');
    });

    it('should default to Ollama when LLM_PROVIDER not set', () => {
      delete process.env.LLM_PROVIDER;
      delete process.env.OLLAMA_MODEL;
      expect(getModel()).toBe('llama3.2:3b');
    });

    it('should be case-insensitive for provider', () => {
      process.env.LLM_PROVIDER = 'OPENAI';
      process.env.OPENAI_MODEL = 'gpt-4';
      expect(getModel()).toBe('gpt-4');
    });
  });
});

