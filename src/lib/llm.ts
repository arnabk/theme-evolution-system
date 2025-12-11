/**
 * Multi-Provider LLM Client
 * Supports: Ollama (default), Gemini, OpenAI
 */

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
    // Handle empty strings as undefined (CI might set empty env vars)
    const provider = process.env.LLM_PROVIDER?.trim() || 'ollama';
    this.provider = provider.toLowerCase();
  }

  private getOllamaBaseUrl(): string {
    // Handle empty strings as undefined
    return process.env.OLLAMA_BASE_URL?.trim() || 'http://localhost:11434';
  }

  private getOpenAIApiKey(): string {
    // Handle empty strings as undefined
    return process.env.OPENAI_API_KEY?.trim() || '';
  }

  private getGeminiApiKey(): string {
    // Handle empty strings as undefined
    return process.env.GEMINI_API_KEY?.trim() || '';
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
    const url = `${this.getOllamaBaseUrl()}/api/generate`;
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
    const apiKey = this.getOpenAIApiKey();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
    const apiKey = this.getGeminiApiKey();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const model = options.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
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
    // More diverse, provocative topics
    const topics = [
      "ethical implications of AI in hiring decisions",
      "four-day work week and productivity myths",
      "digital nomad lifestyle and organizational culture",
      "Gen Z expectations vs traditional workplace norms",
      "impact of ChatGPT on creative industries",
      "quiet quitting vs work-life boundaries",
      "cryptocurrency compensation and financial wellbeing",
      "metaverse meetings and virtual collaboration fatigue",
      "surveillance capitalism in employee monitoring",
      "neurodiversity in tech workplace design",
      "climate anxiety and career choices",
      "side hustles and corporate loyalty",
      "automation anxiety and job security",
      "social media influencers as legitimate careers",
      "remote work's impact on urban development",
      "burnout culture in startup environments",
      "AI pair programming and skill development",
      "hybrid work's effect on career advancement",
      "mental health days vs unlimited PTO",
      "DEI initiatives and reverse discrimination concerns"
    ];
    
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    const prompt = `Generate ONE provocative, open-ended survey question about: ${topic}

Requirements:
- Make it thought-provoking and current (2024-2025 context)
- Encourage diverse, passionate responses
- No yes/no questions
- Focus on personal experiences and opinions
- Be specific, not generic

Output ONLY the question, nothing else:`;

    const model = this.getDefaultModel();
    const response = await this.generate({
      model,
      prompt,
      temperature: 0.9  // Higher for creativity
    });

    return response.trim();
  }

  async generateResponse(question: string): Promise<string> {
    // EXPANDED persona categories for maximum diversity
    const demographics = [
      'a 22-year-old Gen Z fresh grad drowning in student debt',
      'a 35-year-old millennial with two kids and no savings',
      'a 50-year-old Gen X executive questioning everything',
      'a 60-year-old boomer forced into "digital transformation"',
      'a 28-year-old immigrant navigating cultural workplace differences',
      'a single parent working three part-time jobs',
      'a fresh PhD unable to find academic positions',
      'a high school dropout who became a successful founder',
      'a veteran transitioning to civilian work culture',
      'a formerly incarcerated person facing employment barriers'
    ];

    const workSituations = [
      'just got laid off after 15 years at the same company',
      'surviving in a toxic workplace they can\'t leave',
      'thriving in a genuinely good company (rare!)',
      'running a failing startup on fumes',
      'working remotely from a country with no labor laws',
      'making $200K but feeling completely empty inside',
      'earning minimum wage with a master\'s degree',
      'freelancing and terrified of the next paycheck',
      'just promoted to a job they hate',
      'secretly job searching while pretending to be engaged'
    ];

    const perspectives = [
      'deeply cynical and jaded from years of corporate BS',
      'naively optimistic and still believes in "culture"',
      'radically anti-capitalist but trapped in the system',
      'fiercely pro-business and tired of "snowflakes"',
      'spiritual/philosophical about work\'s meaning',
      'purely transactional about employment',
      'obsessed with productivity optimization',
      'anti-hustle culture warrior',
      'nostalgic for "the way things used to be"',
      'excited about AI replacing everything',
      'terrified AI will make them obsolete',
      'believes unions are the only answer',
      'thinks individual negotiation beats collective action'
    ];

    const struggles = [
      'with severe anxiety that makes meetings torture',
      'with ADHD in an open-plan office nightmare',
      'with chronic fatigue that makes 9-5 impossible',
      'with caregiver burnout for aging parents',
      'with addiction recovery while maintaining appearances',
      'with grief after losing a loved one',
      'with financial desperation after divorce',
      'with visa status anxiety affecting every decision',
      'with discrimination they can\'t prove',
      'with perfectionism that makes everything take 10x longer'
    ];

    const tones = [
      'ranting with barely contained rage',
      'with dark humor hiding real pain',
      'with vulnerable honesty that surprises even them',
      'with cold, analytical detachment',
      'with infectious enthusiasm',
      'with world-weary wisdom',
      'with provocative contrarianism',
      'with genuine confusion and questions',
      'with resigned acceptance',
      'with revolutionary fervor',
      'with quiet desperation',
      'with surprising gratitude'
    ];

    const styles = [
      'Share a specific story that happened last week',
      'Use numbers and data to back up your point',
      'Be brutally honest, even if it\'s uncomfortable',
      'Challenge the premise of the question',
      'Offer a completely unexpected perspective',
      'Connect this to bigger systemic issues',
      'Make it personal and emotional',
      'Be practical and solution-focused',
      'Express what others are afraid to say',
      'Share what you\'ve never told anyone at work'
    ];

    // Randomly combine elements for unique perspectives
    const demo = demographics[Math.floor(Math.random() * demographics.length)];
    const situation = workSituations[Math.floor(Math.random() * workSituations.length)];
    const perspective = perspectives[Math.floor(Math.random() * perspectives.length)];
    const struggle = struggles[Math.floor(Math.random() * struggles.length)];
    const tone = tones[Math.floor(Math.random() * tones.length)];
    const style = styles[Math.floor(Math.random() * styles.length)];

    // Randomly decide which elements to include (2-4 elements)
    const elements = [demo, situation, perspective, struggle];
    const shuffled = elements.sort(() => Math.random() - 0.5);
    const numElements = 2 + Math.floor(Math.random() * 3); // 2-4 elements
    const selectedElements = shuffled.slice(0, numElements);

    const prompt = `You are ${selectedElements.join(', who is also ')}.

Answer this survey question ${tone}:
"${question}"

${style}. 

Write 1-3 authentic sentences. Be DIFFERENT from typical corporate responses. No buzzwords. Real human voice:`;

    const model = this.getDefaultModel();
    const response = await this.generate({
      model,
      prompt,
      temperature: 1.2,  // Even higher for maximum diversity
      top_p: 0.98,       // Near-maximum randomness
      top_k: 100         // Very wide sampling
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
        return process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
      case 'gemini':
        return process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-flash';
      case 'ollama':
      default:
        return process.env.OLLAMA_MODEL?.trim() || 'llama3.2:3b';
    }
  }
}

export const llm = new LLMClient();

// Legacy export for backward compatibility
export const ollama = llm;

