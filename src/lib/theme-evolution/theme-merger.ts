/**
 * Theme Merger
 * Handles merging new themes with existing themes
 */

import { llm } from '@/lib/llm';
import { Theme, ThemePhrase } from '@/lib/entities/Theme';
import { getErrorMessage } from '@/lib/types';
import { getModel } from './utils';

export interface ThemeData {
  name: string;
  description: string;
  phrases: ThemePhrase[];
  response_count: number;
}

export interface MergeResult {
  updatedThemes: Array<{ id: number; theme: ThemeData }>;  // Existing themes to update
  newThemes: ThemeData[];  // New themes to add
}

/**
 * Use LLM to determine if two themes represent the EXACT SAME insight
 * Returns a similarity score (0-100)
 */
async function getThemeSimilarityScore(
  theme1: { name: string; description: string; phrases: ThemePhrase[] },
  theme2: { name: string; description: string; phrases: ThemePhrase[] }
): Promise<number> {
  const prompt = `Rate the similarity between these two themes from 0-100.

Theme A: "${theme1.name}"
- ${theme1.description}
- Phrases: ${theme1.phrases.slice(0, 3).map(p => `"${p.text}"`).join(', ')}

Theme B: "${theme2.name}"
- ${theme2.description}
- Phrases: ${theme2.phrases.slice(0, 3).map(p => `"${p.text}"`).join(', ')}

Scoring guide:
- 90-100: IDENTICAL insight, just worded differently (e.g., "need for flexibility" vs "wanting flexible work")
- 70-89: Very similar core message, minor differences
- 50-69: Related topics but different specific insights
- 30-49: Some overlap but distinct themes
- 0-29: Completely different topics

Respond with ONLY a number (0-100):`;

  try {
    const response = await llm.generate({
      model: getModel(),
      prompt,
      temperature: 0.1
    });

    const match = response.match(/\d+/);
    const score = match ? parseInt(match[0]) : 0;
    return Math.min(100, Math.max(0, score));
  } catch (error) {
    console.error('LLM similarity check failed:', getErrorMessage(error));
    return 0;
  }
}

// Minimum similarity score to merge themes (80% = very similar)
const MERGE_THRESHOLD = 80;

/**
 * Merge phrases from two themes, removing duplicates
 */
function mergePhrases(phrases1: ThemePhrase[], phrases2: ThemePhrase[]): ThemePhrase[] {
  const seen = new Set<string>();
  const merged: ThemePhrase[] = [];

  for (const phrase of [...phrases1, ...phrases2]) {
    const key = phrase.text.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(phrase);
    }
  }

  return merged;
}

/**
 * Main function: Merge new themes with existing themes
 * Only merges if similarity >= 80% (very similar)
 */
export async function mergeWithExistingThemes(
  existingThemes: Theme[],
  newThemes: ThemeData[],
  onProgress?: (message: string) => void
): Promise<MergeResult> {
  const result: MergeResult = {
    updatedThemes: [],
    newThemes: []
  };

  // If no existing themes, all are new
  if (existingThemes.length === 0) {
    console.log(`📝 No existing themes - all ${newThemes.length} are new`);
    result.newThemes = [...newThemes];
    return result;
  }

  console.log(`\n🔍 Comparing ${newThemes.length} new themes against ${existingThemes.length} existing themes...`);
  console.log(`   Merge threshold: ${MERGE_THRESHOLD}% similarity\n`);

  // Track which existing themes have been matched
  const matchedExistingIds = new Set<number>();

  for (const newTheme of newThemes) {
    let bestMatch: { theme: Theme; score: number } | null = null;

    // Compare with existing themes using LLM similarity scoring
    for (const existingTheme of existingThemes) {
      if (matchedExistingIds.has(existingTheme.id)) continue;

      const existingPhrases = existingTheme.getPhrases();
      
      onProgress?.(`Checking: "${newTheme.name.substring(0, 25)}..." vs "${existingTheme.name.substring(0, 25)}..."`);
      
      // Get similarity score from LLM (0-100)
      const similarityScore = await getThemeSimilarityScore(
        { name: existingTheme.name, description: existingTheme.description, phrases: existingPhrases },
        newTheme
      );

      console.log(`  📊 "${newTheme.name.substring(0, 30)}..." vs "${existingTheme.name.substring(0, 30)}..." = ${similarityScore}%`);

      // Only merge if similarity >= 80%
      if (similarityScore >= MERGE_THRESHOLD) {
        if (!bestMatch || similarityScore > bestMatch.score) {
          bestMatch = { theme: existingTheme, score: similarityScore };
        }
      }
    }

    if (bestMatch && bestMatch.score >= MERGE_THRESHOLD) {
      // Merge with existing theme (similarity >= 80%)
      matchedExistingIds.add(bestMatch.theme.id);
      
      const existingPhrases = bestMatch.theme.getPhrases();
      const mergedPhrases = mergePhrases(existingPhrases, newTheme.phrases);
      const newPhrasesAdded = mergedPhrases.length - existingPhrases.length;
      
      console.log(`\n🔄 MERGING (${bestMatch.score}% similar):`);
      console.log(`   "${newTheme.name}" → "${bestMatch.theme.name}"`);
      console.log(`   📊 Phrases: ${existingPhrases.length} + ${newTheme.phrases.length} → ${mergedPhrases.length} (${newPhrasesAdded} new)`);
      
      result.updatedThemes.push({
        id: bestMatch.theme.id,
        theme: {
          name: bestMatch.theme.name,
          description: bestMatch.theme.description,
          phrases: mergedPhrases,
          response_count: bestMatch.theme.response_count + newTheme.response_count
        }
      });
    } else {
      // Add as NEW theme (no match above 80% threshold)
      const highestScore = bestMatch ? bestMatch.score : 0;
      console.log(`\n➕ NEW THEME (highest match was ${highestScore}%, below ${MERGE_THRESHOLD}% threshold):`);
      console.log(`   "${newTheme.name}"`);
      console.log(`   📊 ${newTheme.phrases.length} phrases, ${newTheme.response_count} responses`);
      result.newThemes.push(newTheme);
    }
  }

  return result;
}

