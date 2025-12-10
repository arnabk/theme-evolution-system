import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { LLMClient } from '../llm';

describe('LLMClient - Additional Methods', () => {
  let llm: LLMClient;
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Create a fresh client for each test
    // Note: LLM_PROVIDER is read at module load, so we need to mock based on actual provider
    process.env = { ...originalEnv };
    const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();
    
    // Set up fetch mock based on provider
    if (provider === 'ollama') {
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
      global.fetch = (() => Promise.resolve({
        ok: true,
        json: async () => ({ response: 'test response' })
      })) as unknown as typeof fetch;
    } else if (provider === 'openai') {
      global.fetch = (() => Promise.resolve({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'test response' } }] })
      })) as unknown as typeof fetch;
    } else {
      // gemini or default
      global.fetch = (() => Promise.resolve({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'test response' }] } }] })
      })) as unknown as typeof fetch;
    }
    
    llm = new LLMClient();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  describe('generateQuestion', () => {
    it('should generate a question string', async () => {
      // Note: LLM_PROVIDER is read at module load, so we test with whatever provider is configured
      // Mock fetch to return appropriate response based on provider
      const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();
      
      if (provider === 'ollama') {
        global.fetch = (() => Promise.resolve({
          ok: true,
          json: async () => ({ response: 'Test question?' })
        })) as unknown as typeof fetch;
      } else if (provider === 'openai') {
        global.fetch = (() => Promise.resolve({
          ok: true,
          json: async () => ({ choices: [{ message: { content: 'Test question?' } }] })
        })) as unknown as typeof fetch;
      } else {
        global.fetch = (() => Promise.resolve({
          ok: true,
          json: async () => ({ candidates: [{ content: { parts: [{ text: 'Test question?' }] } }] })
        })) as unknown as typeof fetch;
      }
      
      llm = new LLMClient();

      const question = await llm.generateQuestion();

      expect(typeof question).toBe('string');
      expect(question.length).toBeGreaterThan(0);
    }, 10000);

    it('should trim the response', async () => {
      // Mock based on actual provider
      const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();
      
      if (provider === 'ollama') {
        global.fetch = (() => Promise.resolve({
          ok: true,
          json: async () => ({ response: '  Test question?  ' })
        })) as unknown as typeof fetch;
      } else if (provider === 'openai') {
        global.fetch = (() => Promise.resolve({
          ok: true,
          json: async () => ({ choices: [{ message: { content: '  Test question?  ' } }] })
        })) as unknown as typeof fetch;
      } else {
        global.fetch = (() => Promise.resolve({
          ok: true,
          json: async () => ({ candidates: [{ content: { parts: [{ text: '  Test question?  ' }] } }] })
        })) as unknown as typeof fetch;
      }

      llm = new LLMClient();
      const question = await llm.generateQuestion();

      expect(question).toBe('Test question?');
    }, 10000);
  });

  describe('generateResponse', () => {
    it('should generate a response string', async () => {
      // Mock based on actual provider
      const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();
      
      if (provider === 'ollama') {
        global.fetch = (() => Promise.resolve({
          ok: true,
          json: async () => ({ response: 'Test response' })
        })) as unknown as typeof fetch;
      } else if (provider === 'openai') {
        global.fetch = (() => Promise.resolve({
          ok: true,
          json: async () => ({ choices: [{ message: { content: 'Test response' } }] })
        })) as unknown as typeof fetch;
      } else {
        global.fetch = (() => Promise.resolve({
          ok: true,
          json: async () => ({ candidates: [{ content: { parts: [{ text: 'Test response' }] } }] })
        })) as unknown as typeof fetch;
      }
      
      llm = new LLMClient();

      const response = await llm.generateResponse('Test question?');

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('generateMultipleResponses', () => {
    it('should generate multiple responses', async () => {
      // Mock based on actual provider
      const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();
      
      if (provider === 'ollama') {
        global.fetch = (() => Promise.resolve({
          ok: true,
          json: async () => ({ response: 'Test response' })
        })) as unknown as typeof fetch;
      } else if (provider === 'openai') {
        global.fetch = (() => Promise.resolve({
          ok: true,
          json: async () => ({ choices: [{ message: { content: 'Test response' } }] })
        })) as unknown as typeof fetch;
      } else {
        global.fetch = (() => Promise.resolve({
          ok: true,
          json: async () => ({ candidates: [{ content: { parts: [{ text: 'Test response' }] } }] })
        })) as unknown as typeof fetch;
      }
      
      llm = new LLMClient();

      const responses = await llm.generateMultipleResponses('Test question?', 3);

      expect(responses).toHaveLength(3);
      expect(responses.every(r => typeof r === 'string')).toBe(true);
    }, 10000);

    it('should handle count of 0', async () => {
      process.env.LLM_PROVIDER = 'ollama';
      llm = new LLMClient();

      const responses = await llm.generateMultipleResponses('Test?', 0);

      expect(responses).toHaveLength(0);
    });
  });
});

