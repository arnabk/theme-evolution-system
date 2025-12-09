/**
 * Batch Theme Merger
 * Merges similar themes within a single batch (before merging with existing themes)
 */

import { llm } from '@/lib/llm';
import { getErrorMessage } from '@/lib/types';
import { getModel } from './utils';
import { ThemeWithResponses } from './span-clusterer';

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

