/**
 * Shared utilities for theme evolution
 */

/**
 * Get the correct model name based on configured LLM provider
 */
export function getModel(): string {
  const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();
  
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_MODEL || 'gpt-4o-mini';
    case 'gemini':
      return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    case 'ollama':
    default:
      return process.env.OLLAMA_MODEL || 'llama3.2:3b';
  }
}

