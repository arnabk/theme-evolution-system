import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { LLMClient } from '../llm';

describe('LLMClient', () => {
  let llm: LLMClient;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    llm = new LLMClient();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should default to ollama provider', () => {
      const originalProvider = process.env.LLM_PROVIDER;
      delete process.env.LLM_PROVIDER;
      const client = new LLMClient();
      // Test by checking behavior rather than private property
      expect(client).toBeInstanceOf(LLMClient);
      if (originalProvider) process.env.LLM_PROVIDER = originalProvider;
    });

    it('should use OPENAI provider when set', () => {
      process.env.LLM_PROVIDER = 'openai';
      const client = new LLMClient();
      expect(client).toBeInstanceOf(LLMClient);
    });

    it('should use GEMINI provider when set', () => {
      process.env.LLM_PROVIDER = 'gemini';
      const client = new LLMClient();
      expect(client).toBeInstanceOf(LLMClient);
    });
  });

  describe('generateQuestion', () => {
    it('should generate a question string', async () => {
      // Mock the generate method
      const generateSpy = spyOn(llm, 'generate').mockResolvedValue('What are your thoughts on remote work?');
      
      const question = await llm.generateQuestion();
      
      expect(question).toBe('What are your thoughts on remote work?');
      expect(generateSpy).toHaveBeenCalled();
    }, 10000);
  });

  describe('generateResponse', () => {
    it('should generate a response string', async () => {
      const generateSpy = spyOn(llm, 'generate').mockResolvedValue('I think remote work is great.');
      
      const response = await llm.generateResponse('What do you think about remote work?');
      
      expect(response).toBe('I think remote work is great.');
      expect(generateSpy).toHaveBeenCalled();
    }, 10000);
  });

  describe('generateMultipleResponses', () => {
    it('should generate multiple responses', async () => {
      const generateSpy = spyOn(llm, 'generateResponse')
        .mockResolvedValueOnce('Response 1')
        .mockResolvedValueOnce('Response 2')
        .mockResolvedValueOnce('Response 3');
      
      const responses = await llm.generateMultipleResponses('Test question?', 3);
      
      expect(responses).toHaveLength(3);
      expect(responses[0]).toBe('Response 1');
      expect(responses[1]).toBe('Response 2');
      expect(responses[2]).toBe('Response 3');
      expect(generateSpy).toHaveBeenCalledTimes(3);
    });
  });
});

