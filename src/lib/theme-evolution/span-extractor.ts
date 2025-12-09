/**
 * Semantic Span Extractor
 * Extracts meaningful spans (goals, pain points, emotions, etc.) from responses
 * using direct LLM calls for reliability
 */

import { llm } from '@/lib/llm';
import { getErrorMessage } from '@/lib/types';
import { getModel } from './utils';

// Extraction classes for semantic understanding
export const EXTRACTION_CLASSES = [
  'user_goal',      // What the user wants to achieve
  'pain_point',     // What's frustrating or bothering them
  'emotion',        // How they feel about the topic
  'request',        // What they're asking for
  'insight',        // Key observation or opinion
  'suggestion',     // Ideas or recommendations
  'concern'         // Worries or apprehensions
] as const;

export type ExtractionClass = typeof EXTRACTION_CLASSES[number];

export interface ExtractedSpan {
  text: string;           // The exact phrase extracted
  class: ExtractionClass; // Type of semantic meaning
  start: number;          // Start position in original text
  end: number;            // End position in original text
  responseId: number;     // ID of the source response
}

export interface ResponseWithSpans {
  id: number;
  text: string;
  spans: ExtractedSpan[];
}

/**
 * Extract semantic spans from a single response using direct LLM call
 */
async function extractSpansFromResponse(
  response: { id: number; text: string },
  question: string
): Promise<ExtractedSpan[]> {
  const prompt = `Extract meaningful phrases from this survey response that reveal what the user is trying to communicate.

QUESTION: "${question}"

RESPONSE: "${response.text}"

For each phrase, classify it as ONE of:
- user_goal: What they want to achieve or wish for
- pain_point: What frustrates or bothers them
- emotion: How they feel (frustrated, excited, worried, etc.)
- request: Specific things they're asking for
- insight: Key observations or realizations
- suggestion: Ideas or solutions they propose
- concern: Worries or fears they express

RULES:
1. Extract 3-6 phrases that capture the user's key messages
2. Each phrase MUST be an EXACT substring from the response text
3. Phrases should be meaningful (3-15 words typically)
4. Cover different aspects if possible

Return ONLY a JSON array, no other text:
[
  {"text": "exact phrase from response", "class": "pain_point"},
  {"text": "another exact phrase", "class": "user_goal"}
]`;

  try {
    const model = getModel();
    const result = await llm.generate({
      model,
      prompt,
      temperature: 0.2
    });

    // Parse JSON from response
    const jsonMatch = result.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      console.log(`  ⚠️ Response ${response.id}: No JSON array in LLM response`);
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{ text: string; class: string }>;
    const spans: ExtractedSpan[] = [];

    for (const item of parsed) {
      if (!item.text || !item.class) continue;
      
      // Validate extraction class
      if (!EXTRACTION_CLASSES.includes(item.class as ExtractionClass)) {
        console.log(`     Skipping unknown class: ${item.class}`);
        continue;
      }

      // Find exact position in text (case-insensitive search)
      const lowerText = response.text.toLowerCase();
      const lowerPhrase = item.text.toLowerCase();
      const start = lowerText.indexOf(lowerPhrase);
      
      if (start === -1) {
        console.log(`     Skipping (not found): "${item.text.substring(0, 40)}..."`);
        continue;
      }

      spans.push({
        text: response.text.substring(start, start + item.text.length), // Use original case
        class: item.class as ExtractionClass,
        start,
        end: start + item.text.length,
        responseId: response.id
      });
    }

    return spans;
    
  } catch (error) {
    console.error(`  ❌ Response ${response.id}: extraction failed:`, getErrorMessage(error));
    return [];
  }
}

/**
 * MAIN FUNCTION: Extract semantic spans from all responses
 */
export async function extractSpansFromResponses(
  responses: Array<{ id: number; text: string }>,
  question: string,
  onProgress?: (done: number, total: number) => void
): Promise<ResponseWithSpans[]> {
  console.log(`🔍 Extracting spans from ${responses.length} responses using direct LLM...`);
  console.log(`🤖 Model: ${getModel()}`);

  const results: ResponseWithSpans[] = [];

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    
    console.log(`\n  🔄 Response ${response.id} (${i + 1}/${responses.length})...`);
    
    const spans = await extractSpansFromResponse(response, question);
    
    if (spans.length > 0) {
      results.push({
        id: response.id,
        text: response.text,
        spans
      });
      console.log(`  ✅ Response ${response.id}: ${spans.length} spans [${spans.map(s => s.class).join(', ')}]`);
    } else {
      console.log(`  ⚠️ Response ${response.id}: no valid spans extracted`);
    }

    if (onProgress) {
      onProgress(i + 1, responses.length);
    }
  }

  console.log(`\n✅ Extracted spans from ${results.length}/${responses.length} responses`);
  
  // Log span class distribution
  const classCounts = new Map<string, number>();
  results.forEach(r => r.spans.forEach(s => {
    classCounts.set(s.class, (classCounts.get(s.class) || 0) + 1);
  }));
  console.log('📊 Span distribution:', Object.fromEntries(classCounts));

  return results;
}

/**
 * Get all unique spans across responses grouped by class
 */
export function groupSpansByClass(responses: ResponseWithSpans[]): Map<ExtractionClass, ExtractedSpan[]> {
  const grouped = new Map<ExtractionClass, ExtractedSpan[]>();
  
  for (const cls of EXTRACTION_CLASSES) {
    grouped.set(cls, []);
  }

  for (const response of responses) {
    for (const span of response.spans) {
      grouped.get(span.class)!.push(span);
    }
  }

  return grouped;
}
