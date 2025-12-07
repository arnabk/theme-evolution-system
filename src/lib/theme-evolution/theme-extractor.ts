/**
 * Theme Extraction - Extract themes from responses using LLM
 */

import { llm } from '../llm';

export interface ExtractedTheme {
  name: string;
  description: string;
  keywords: string;
  keywordArray?: string[];
  is_new?: boolean;
}

export async function extractInitialThemes(
  question: string,
  responses: string[]
): Promise<ExtractedTheme[]> {
  const combinedText = responses.map((r, i) => `Response ${i + 1}: ${r}`).join('\n\n');
  
  const prompt = `Analyze these survey responses and extract 3-5 DISTINCT, NON-OVERLAPPING themes.

Question: "${question}"

${combinedText}

CRITICAL INSTRUCTIONS:
1. Each theme must be CLEARLY DISTINCT - no overlap
2. Themes represent different aspects/dimensions
3. Avoid similar themes that could be merged
4. Each theme = unique perspective
5. **Keywords MUST be unique to each theme - NO keyword overlap between themes**
6. If two themes share keywords, they should be merged into one
7. Quality over quantity - 3 distinct > 7 overlapping

Format response as JSON array:
[
  {
    "name": "Clear descriptive statement",
    "description": "Brief explanation with context",
    "keywords": "keyword1, keyword2, keyword3"
  }
]

EXAMPLE (Note how keywords are completely distinct):
[
  {
    "name": "Users prioritize work-life balance",
    "description": "Focus on flexibility and personal time",
    "keywords": "balance, flexibility, personal time"
  },
  {
    "name": "Concerns about implementation costs",
    "description": "Budget and ROI are key considerations",
    "keywords": "cost, budget, ROI"
  },
  {
    "name": "Need for comprehensive training",
    "description": "Learning curve and support requirements",
    "keywords": "training, learning, support"
  }
]

IMPORTANT: Respond ONLY with JSON array. Make themes AND keywords MUTUALLY EXCLUSIVE.`;

  const response = await llm.generate({
    model: 'llama3.2:3b',
    prompt,
    temperature: 0.3,
  });

  return parseThemesFromResponse(response);
}

export async function evolveExistingThemes(
  question: string,
  responses: string[],
  existingThemes: any[]
): Promise<ExtractedTheme[]> {
  const combinedText = responses.map((r, i) => `Response ${i + 1}: ${r}`).join('\n\n');
  
  const prompt = `You are evolving an existing theme taxonomy. 

EXISTING THEMES:
${existingThemes.map((t, i) => `${i + 1}. ${t.name}\n   Description: ${t.description}`).join('\n\n')}

NEW RESPONSES to analyze:
${combinedText}

TASK: Analyze if these new responses fit into the existing themes above, OR if they reveal NEW distinct themes.

CRITICAL RULES:
1. PREFER fitting responses into existing themes if they match
2. ONLY create NEW themes if responses reveal truly DISTINCT topics not covered
3. Do NOT create overlapping themes
4. **Ensure keywords are UNIQUE to each theme - NO keyword overlap**
5. If new responses suggest a keyword already used by an existing theme, assign to that theme instead
6. Aim for 3-7 total themes (existing + any new ones)
7. Return ALL themes (existing ones that still apply + any new distinct ones)

Format response as JSON array (include existing themes that still apply + any new ones):
[
  {
    "name": "Theme name (keep existing name if it's an existing theme)",
    "description": "Updated or original description",
    "keywords": "keyword1, keyword2, keyword3",
    "is_new": false
  }
]

IMPORTANT: Respond ONLY with JSON array. Keywords MUST be mutually exclusive across all themes.`;

  const response = await llm.generate({
    model: 'llama3.2:3b',
    prompt,
    temperature: 0.3,
  });

  return parseThemesFromResponse(response);
}

function parseThemesFromResponse(response: string): ExtractedTheme[] {
  // Clean the response - remove markdown code blocks if present
  let cleanedResponse = response
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
  
  // Try to extract JSON array from response
  const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
  
  if (jsonMatch) {
    try {
      const themes = JSON.parse(jsonMatch[0]);
      return themes;
    } catch (e) {
      // If parsing fails, try to fix common issues
      let jsonStr = jsonMatch[0];
      // Fix trailing commas
      jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      return JSON.parse(jsonStr);
    }
  }
  
  throw new Error('No JSON array found in response');
}

