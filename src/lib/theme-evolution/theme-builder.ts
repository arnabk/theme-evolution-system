/**
 * Theme Builder
 * Builds theme objects with associated response data
 */

import { SemanticTheme, ThemeWithResponses } from './span-clusterer';
import { ResponseWithSpans } from './span-extractor';

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

