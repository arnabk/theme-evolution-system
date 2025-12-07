/**
 * Multi-Provider LLM Client
 * Supports: Ollama (default), Gemini, OpenAI
 */

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'ollama';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export interface GenerateOptions {
  model: string;
  prompt: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
}

export class LLMClient {
  private provider: string;

  constructor() {
    this.provider = LLM_PROVIDER.toLowerCase();
  }

  async generate(options: GenerateOptions): Promise<string> {
    switch (this.provider) {
      case 'openai':
        return this.generateOpenAI(options);
      case 'gemini':
        return this.generateGemini(options);
      case 'ollama':
      default:
        return this.generateOllama(options);
    }
  }

  private async generateOllama(options: GenerateOptions): Promise<string> {
    const url = `${OLLAMA_BASE_URL}/api/generate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        prompt: options.prompt,
        stream: false,
        options: {
          temperature: options.temperature,
          top_p: options.top_p,
          top_k: options.top_k,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  private async generateOpenAI(options: GenerateOptions): Promise<string> {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: options.prompt }],
        temperature: options.temperature || 0.7,
        top_p: options.top_p,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async generateGemini(options: GenerateOptions): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const model = options.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: options.prompt }]
        }],
        generationConfig: {
          temperature: options.temperature || 0.7,
          topP: options.top_p,
          topK: options.top_k,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async generateQuestion(): Promise<string> {
    const topics = [
      "workplace challenges", "technology adoption", "productivity", 
      "team collaboration", "career development", "work-life balance",
      "AI and automation", "data privacy", "remote work", "digital transformation",
      "employee wellbeing", "innovation", "change management", "sustainability"
    ];
    
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    const prompt = `Generate a single thoughtful, open-ended survey question about ${topic}. The question should encourage detailed responses and be relevant to modern workplace contexts. Only output the question itself, nothing else.`;

    const model = this.getDefaultModel();
    const response = await this.generate({
      model,
      prompt,
      temperature: 0.8
    });

    return response.trim();
  }

  async generateResponse(question: string): Promise<string> {
    const personas = [
      'an enthusiastic early adopter who loves new technology',
      'a skeptical veteran employee who prefers traditional methods',
      'a middle manager concerned about team productivity',
      'a junior employee excited about career growth',
      'a remote worker focused on work-life balance',
      'a team leader worried about collaboration challenges',
      'an efficiency-focused individual who values automation',
      'a cautious person concerned about job security',
      'an innovative thinker who sees opportunities',
      'a practical person focused on day-to-day operations',
      'someone who values personal development',
      'a budget-conscious employee thinking about costs',
      'a technically-minded person interested in tools',
      'someone prioritizing mental health and stress reduction',
      'a collaborative team player focused on communication'
    ];
    
    const sentiments = [
      'with optimism',
      'with some concerns',
      'with mixed feelings',
      'with enthusiasm',
      'with skepticism',
      'with practical considerations',
      'with a balanced perspective'
    ];
    
    const lengths = [
      'in 1-2 sentences',
      'in 2-3 sentences',
      'in 1 brief sentence',
      'briefly in 2 sentences'
    ];
    
    const persona = personas[Math.floor(Math.random() * personas.length)];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const lengthInstruction = lengths[Math.floor(Math.random() * lengths.length)];
    
    const prompt = `You are ${persona}. Answer this survey question ${sentiment}, ${lengthInstruction}:\n\n"${question}"\n\nProvide a genuine, authentic response that reflects your perspective:`;

    const model = this.getDefaultModel();
    const response = await this.generate({
      model,
      prompt,
      temperature: 0.95,
      top_p: 0.9
    });

    return response.trim();
  }

  async generateMultipleResponses(question: string, count: number): Promise<string[]> {
    const responses: string[] = [];
    
    // Generate in parallel batches of 5 for speed
    const batchSize = 5;
    for (let i = 0; i < count; i += batchSize) {
      const batchCount = Math.min(batchSize, count - i);
      const batch = await Promise.all(
        Array(batchCount).fill(0).map(() => this.generateResponse(question))
      );
      responses.push(...batch);
    }
    
    return responses;
  }

  private getDefaultModel(): string {
    switch (this.provider) {
      case 'openai':
        return process.env.OPENAI_MODEL || 'gpt-4o-mini';
      case 'gemini':
        return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      case 'ollama':
      default:
        return process.env.OLLAMA_MODEL || 'llama3.2:3b';
    }
  }
}

export const llm = new LLMClient();

// Legacy export for backward compatibility
export const ollama = llm;

