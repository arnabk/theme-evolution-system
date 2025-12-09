/**
 * Semantic Span Clustering
 * Clusters similar spans and generates human-readable theme names
 */

import { llm } from '@/lib/llm';
import { getErrorMessage } from '@/lib/types';
import { ExtractedSpan, ResponseWithSpans, ExtractionClass } from './span-extractor';
import { getModel } from './utils';

export interface SemanticTheme {
  name: string;                     // Human-readable theme (e.g., "feels ignored by support")
  description: string;              // What this theme represents
  contributingSpans: ExtractedSpan[]; // Spans that led to this theme
  responseIds: number[];            // Unique response IDs associated with this theme
}

export interface ThemeWithResponses extends SemanticTheme {
  responses: Array<{
    id: number;
    text: string;
    spans: ExtractedSpan[];  // Only spans relevant to this theme
  }>;
}

/**
 * Cluster spans semantically and generate themes
 * Uses LLM to understand the semantic meaning of spans and group them
 */
export async function clusterSpansIntoThemes(
  responsesWithSpans: ResponseWithSpans[],
  question: string,
  onProgress?: (message: string) => void
): Promise<SemanticTheme[]> {
  // Collect all spans
  const allSpans = responsesWithSpans.flatMap(r => r.spans);
  
  if (allSpans.length === 0) {
    console.log('⚠️ No spans to cluster');
    return [];
  }

  console.log(`🎯 Clustering ${allSpans.length} spans from ${responsesWithSpans.length} responses...`);
  onProgress?.('Analyzing semantic patterns...');

  // Format spans for LLM analysis - group by class for better understanding
  const spansByClass = new Map<ExtractionClass, ExtractedSpan[]>();
  for (const span of allSpans) {
    if (!spansByClass.has(span.class)) {
      spansByClass.set(span.class, []);
    }
    spansByClass.get(span.class)!.push(span);
  }

  // Create span summary for LLM
  const spanSummary = Array.from(spansByClass.entries())
    .map(([cls, spans]) => {
      const uniqueTexts = [...new Set(spans.map(s => s.text))].slice(0, 10);
      return `${cls.toUpperCase()}:\n${uniqueTexts.map(t => `  - "${t}"`).join('\n')}`;
    })
    .join('\n\n');

  const prompt = `Analyze these extracted semantic spans from survey responses to the question: "${question}"

${spanSummary}

Based on these spans, identify 3-7 DISTINCT themes that capture what users are trying to communicate.
Each theme should represent a coherent "inner message" - what users truly mean or feel.

CRITICAL RULES:
1. Theme names should be human-readable insights (e.g., "feels ignored by support", "wants more control over settings")
2. Each theme should be DISTINCT - no overlapping meanings
3. Focus on the UNDERLYING message, not just the surface words
4. Group spans that express similar sentiments or goals, even if worded differently

Respond with ONLY a JSON array:
[
  {
    "name": "Theme name capturing the inner message",
    "description": "What this theme represents and why it matters",
    "spanPatterns": ["pattern1", "pattern2", "pattern3"]
  }
]

spanPatterns should be keywords/phrases that would match spans belonging to this theme.

Example good themes:
- "Users feel overwhelmed by rapid changes"
- "Desire for meaningful human connection"
- "Frustration with lack of transparency"

Example bad themes:
- "work" (too generic)
- "flexibility, remote, balance" (just keywords)
- "Theme 1" (not descriptive)`;

  try {
    const response = await llm.generate({
      model: getModel(),
      prompt,
      temperature: 0.3
    });

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Failed to parse themes JSON from response');
      return [];
    }

    const rawThemes = JSON.parse(jsonMatch[0]) as Array<{
      name: string;
      description: string;
      spanPatterns: string[];
    }>;

    onProgress?.('Assigning spans to themes...');

    // Now assign spans to themes based on semantic similarity
    const themes: SemanticTheme[] = await assignSpansToThemes(
      rawThemes,
      allSpans,
      question
    );

    console.log(`✅ Generated ${themes.length} semantic themes`);
    return themes;

  } catch (error) {
    console.error('Span clustering failed:', getErrorMessage(error));
    return [];
  }
}

/**
 * Assign spans to themes using LLM for semantic matching
 */
async function assignSpansToThemes(
  themes: Array<{ name: string; description: string; spanPatterns: string[] }>,
  spans: ExtractedSpan[],
  question: string
): Promise<SemanticTheme[]> {
  const themeSpans = new Map<number, ExtractedSpan[]>();
  themes.forEach((_, idx) => themeSpans.set(idx, []));

  // Process spans in batches for efficiency
  const batchSize = 20;
  for (let i = 0; i < spans.length; i += batchSize) {
    const batch = spans.slice(i, i + batchSize);
    
    const assignPrompt = `Assign each span to the most relevant theme (or "none" if it doesn't fit).

Question: "${question}"

Themes:
${themes.map((t, idx) => `${idx + 1}. "${t.name}" - ${t.description}`).join('\n')}

Spans to assign:
${batch.map((s, idx) => `${idx + 1}. [${s.class}] "${s.text}"`).join('\n')}

Respond with ONLY a JSON array of theme numbers (1-${themes.length}) or 0 for none:
Example: [1, 2, 0, 1, 3]`;

    try {
      const response = await llm.generate({
        model: getModel(),
        prompt: assignPrompt,
        temperature: 0.1
      });

      const assignments = JSON.parse(response.match(/\[[\s\S]*?\]/)?.[0] || '[]') as number[];
      
      batch.forEach((span, idx) => {
        const themeIdx = assignments[idx];
        if (themeIdx && themeIdx > 0 && themeIdx <= themes.length) {
          themeSpans.get(themeIdx - 1)!.push(span);
        }
      });
    } catch (error) {
      console.warn('Batch assignment failed, using pattern matching fallback');
      // Fallback: use simple pattern matching
      batch.forEach(span => {
        const spanLower = span.text.toLowerCase();
        themes.forEach((theme, idx) => {
          if (theme.spanPatterns.some(p => spanLower.includes(p.toLowerCase()))) {
            themeSpans.get(idx)!.push(span);
          }
        });
      });
    }
  }

  // Build final themes with their assigned spans
  return themes
    .map((theme, idx) => {
      const assignedSpans = themeSpans.get(idx) || [];
      const responseIds = [...new Set(assignedSpans.map(s => s.responseId))];
      
      return {
        name: theme.name,
        description: theme.description,
        contributingSpans: assignedSpans,
        responseIds
      };
    })
    .filter(theme => theme.contributingSpans.length > 0); // Only keep themes with assigned spans
}

// Re-export for backward compatibility
export { buildThemesWithResponses } from './theme-builder';
export { mergeSimilarThemes } from './batch-theme-merger';
export { deduplicateSpansAcrossThemes } from './theme-deduplicator';

