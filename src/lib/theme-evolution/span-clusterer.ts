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

/**
 * Build full theme objects with response data
 */
export function buildThemesWithResponses(
  themes: SemanticTheme[],
  responsesWithSpans: ResponseWithSpans[]
): ThemeWithResponses[] {
  const responseMap = new Map(responsesWithSpans.map(r => [r.id, r]));

  return themes.map(theme => {
    // Get all unique response IDs for this theme
    const responseIds = [...new Set(theme.contributingSpans.map(s => s.responseId))];

    // Build response objects with only spans relevant to this theme
    const responses = responseIds
      .map(id => {
        const response = responseMap.get(id);
        if (!response) return null;

        // Filter to only spans that contributed to this theme
        const relevantSpans = theme.contributingSpans.filter(s => s.responseId === id);

        return {
          id: response.id,
          text: response.text,
          spans: relevantSpans
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return {
      ...theme,
      responses
    };
  });
}

/**
 * Merge themes that are semantically similar (within a batch)
 */
export async function mergeSimilarThemes(
  themes: ThemeWithResponses[]
): Promise<ThemeWithResponses[]> {
  if (themes.length <= 1) return themes;

  console.log(`🔄 Checking ${themes.length} themes for similarity...`);

  // Use LLM to identify which themes should be merged
  const themeList = themes.map((t, i) => `${i + 1}. "${t.name}" - ${t.description}`).join('\n');
  
  const prompt = `Analyze these themes and identify which ones should be MERGED because they express the same underlying message.

Themes:
${themeList}

Respond with a JSON array of merge groups. Each group contains theme numbers that should be combined:
Example: [[1, 3], [2, 5]] means merge themes 1+3 and merge themes 2+5

If themes 4, 6, 7 should remain separate, don't include them in any group.

Rules:
- Only merge themes that are TRULY similar in meaning
- Don't merge just because they share a word
- Theme 1 is usually the primary one in a merge group

Respond with ONLY the JSON array:`;

  try {
    const response = await llm.generate({
      model: getModel(),
      prompt,
      temperature: 0.1
    });

    const mergeGroups = JSON.parse(response.match(/\[[\s\S]*\]/)?.[0] || '[]') as number[][];
    
    if (mergeGroups.length === 0) {
      console.log('✅ No themes to merge');
      return themes;
    }

    // Track which themes have been merged
    const mergedIndices = new Set<number>();
    const result: ThemeWithResponses[] = [];

    // Process merge groups
    for (const group of mergeGroups) {
      if (group.length < 2) continue;
      
      const indices = group.map(n => n - 1).filter(i => i >= 0 && i < themes.length);
      if (indices.length < 2) continue;

      // Merge all themes in the group
      const primary = themes[indices[0]];
      const merged: ThemeWithResponses = {
        name: primary.name,
        description: primary.description,
        contributingSpans: [...primary.contributingSpans],
        responseIds: [...primary.responseIds],
        responses: [...primary.responses]
      };

      for (let i = 1; i < indices.length; i++) {
        const toMerge = themes[indices[i]];
        merged.contributingSpans.push(...toMerge.contributingSpans);
        merged.responseIds = [...new Set([...merged.responseIds, ...toMerge.responseIds])];
        
        // Add responses that aren't already included
        for (const resp of toMerge.responses) {
          if (!merged.responses.some(r => r.id === resp.id)) {
            merged.responses.push(resp);
          } else {
            // Merge spans for existing response
            const existing = merged.responses.find(r => r.id === resp.id)!;
            existing.spans.push(...resp.spans.filter(s => 
              !existing.spans.some(es => es.start === s.start && es.end === s.end)
            ));
          }
        }
      }

      result.push(merged);
      indices.forEach(i => mergedIndices.add(i));
      console.log(`  🔗 Merged: ${group.map(n => themes[n-1]?.name).join(' + ')}`);
    }

    // Add unmerged themes
    themes.forEach((theme, idx) => {
      if (!mergedIndices.has(idx)) {
        result.push(theme);
      }
    });

    console.log(`✅ Merged into ${result.length} final themes`);
    return result;

  } catch (error) {
    console.warn('Theme merge failed:', getErrorMessage(error));
    return themes;
  }
}

/**
 * Remove duplicate spans across themes - each span should belong to only one theme
 */
export function deduplicateSpansAcrossThemes(themes: ThemeWithResponses[]): ThemeWithResponses[] {
  const usedSpans = new Set<string>();
  
  const makeSpanKey = (span: ExtractedSpan) => 
    `${span.responseId}:${span.start}:${span.end}`;

  return themes.map(theme => {
    const uniqueSpans = theme.contributingSpans.filter(span => {
      const key = makeSpanKey(span);
      if (usedSpans.has(key)) return false;
      usedSpans.add(key);
      return true;
    });

    // Update responses to only include unique spans
    const updatedResponses = theme.responses
      .map(resp => ({
        ...resp,
        spans: resp.spans.filter(span => {
          const key = makeSpanKey(span);
          return theme.contributingSpans.some(s => makeSpanKey(s) === key);
        })
      }))
      .filter(resp => resp.spans.length > 0);

    return {
      ...theme,
      contributingSpans: uniqueSpans,
      responseIds: [...new Set(uniqueSpans.map(s => s.responseId))],
      responses: updatedResponses
    };
  }).filter(theme => theme.contributingSpans.length > 0);
}

