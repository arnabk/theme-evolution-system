/**
 * Theme Merger - Consolidate similar themes based on keyword overlap
 */

export interface ThemeWithKeywords {
  name: string;
  description: string;
  keywords: string;
  keywordArray: string[];
  isExisting?: boolean;
  id?: number;
  [key: string]: any;
}

export function calculateKeywordOverlap(
  keywords1: string[],
  keywords2: string[]
): number {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;
  
  const set1 = new Set(keywords1.map(k => k.toLowerCase()));
  const set2 = new Set(keywords2.map(k => k.toLowerCase()));
  
  const intersection = new Set([...set1].filter(k => set2.has(k)));
  const smaller = Math.min(set1.size, set2.size);
  
  return smaller > 0 ? (intersection.size / smaller) * 100 : 0;
}

export function mergeThemesWithOverlap(
  themes: ThemeWithKeywords[],
  overlapThreshold: number = 50
): ThemeWithKeywords[] {
  let consolidatedThemes = [...themes];
  let consolidationHappened = true;
  
  while (consolidationHappened) {
    consolidationHappened = false;
    
    for (let i = 0; i < consolidatedThemes.length; i++) {
      for (let j = i + 1; j < consolidatedThemes.length; j++) {
        const overlapPct = calculateKeywordOverlap(
          consolidatedThemes[i].keywordArray,
          consolidatedThemes[j].keywordArray
        );
        
        if (overlapPct > overlapThreshold) {
          console.log(`🔄 Consolidating: "${consolidatedThemes[i].name}" + "${consolidatedThemes[j].name}" (${overlapPct.toFixed(0)}% overlap)`);
          
          // Merge j into i (prefer keeping existing theme)
          const combinedKeywords = [
            ...new Set([
              ...consolidatedThemes[i].keywordArray,
              ...consolidatedThemes[j].keywordArray
            ])
          ];
          
          consolidatedThemes[i] = {
            ...consolidatedThemes[i],
            keywordArray: combinedKeywords,
            keywords: combinedKeywords.join(', '),
            description: consolidatedThemes[i].isExisting 
              ? consolidatedThemes[i].description 
              : `${consolidatedThemes[i].description} ${consolidatedThemes[j].description}`.trim()
          };
          
          consolidatedThemes.splice(j, 1);
          consolidationHappened = true;
          break;
        }
      }
      if (consolidationHappened) break;
    }
  }
  
  return consolidatedThemes;
}

export function deduplicateKeywords(themes: ThemeWithKeywords[]): ThemeWithKeywords[] {
  const keywordToTheme = new Map<string, number>();
  
  return themes.map((theme, index) => {
    const uniqueKeywords: string[] = [];
    
    for (const keyword of theme.keywordArray) {
      const keyLower = keyword.toLowerCase();
      if (!keywordToTheme.has(keyLower)) {
        keywordToTheme.set(keyLower, index);
        uniqueKeywords.push(keyword);
      } else if (keywordToTheme.get(keyLower) === index) {
        uniqueKeywords.push(keyword);
      }
    }
    
    return {
      ...theme,
      keywords: uniqueKeywords.join(', '),
      keywordArray: uniqueKeywords
    };
  }).filter(theme => theme.keywordArray.length > 0); // Remove themes with no unique keywords
}

