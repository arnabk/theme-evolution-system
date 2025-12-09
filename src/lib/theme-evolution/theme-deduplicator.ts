/**
 * Theme Deduplicator
 * Removes duplicate spans across themes - each span should belong to only one theme
 */

import { ExtractedSpan } from './span-extractor';
import { ThemeWithResponses } from './span-clusterer';

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

