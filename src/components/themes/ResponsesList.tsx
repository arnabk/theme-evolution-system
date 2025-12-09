/**
 * ResponsesList - Right panel showing responses with highlighted semantic spans
 */

interface Highlight {
  text: string;
  start: number;
  end: number;
  class?: string;  // Semantic class: user_goal, pain_point, emotion, etc.
}

interface ThemeResponse {
  id: number;
  text: string;
  keywords: string[];
  highlights: Highlight[];
  confidence: number;
}

interface ResponsesListProps {
  selectedTheme: { id: number; name: string; response_count: number } | null;
  responses: ThemeResponse[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
}

// Color mapping for different span classes
const SPAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  user_goal: { bg: 'bg-emerald-400/30', text: 'text-emerald-200', border: 'border-emerald-400' },
  pain_point: { bg: 'bg-rose-400/30', text: 'text-rose-200', border: 'border-rose-400' },
  emotion: { bg: 'bg-violet-400/30', text: 'text-violet-200', border: 'border-violet-400' },
  request: { bg: 'bg-amber-400/30', text: 'text-amber-200', border: 'border-amber-400' },
  insight: { bg: 'bg-cyan-400/30', text: 'text-cyan-200', border: 'border-cyan-400' },
  suggestion: { bg: 'bg-teal-400/30', text: 'text-teal-200', border: 'border-teal-400' },
  concern: { bg: 'bg-orange-400/30', text: 'text-orange-200', border: 'border-orange-400' },
  keyword: { bg: 'bg-cyan-400/30', text: 'text-cyan-200', border: 'border-cyan-400' },  // Legacy fallback
};

// Friendly labels for span classes
const SPAN_LABELS: Record<string, string> = {
  user_goal: '🎯 Goal',
  pain_point: '😤 Pain Point',
  emotion: '💭 Emotion',
  request: '📣 Request',
  insight: '💡 Insight',
  suggestion: '✨ Suggestion',
  concern: '⚠️ Concern',
  keyword: '🔑 Keyword',
};

export function ResponsesList({ 
  selectedTheme, 
  responses, 
  loading, 
  loadingMore, 
  hasMore 
}: ResponsesListProps) {
  
  /**
   * Highlight text using exact span positions
   */
  const highlightWithSpans = (text: string, highlights: Highlight[]) => {
    if (!highlights || highlights.length === 0) {
      return <span>{text}</span>;
    }

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);
    
    // Build segments
    const segments: React.ReactNode[] = [];
    let lastEnd = 0;

    for (const highlight of sortedHighlights) {
      // Validate positions
      if (highlight.start < 0 || highlight.end > text.length || highlight.start >= highlight.end) {
        continue;
      }

      // Add text before this highlight
      if (highlight.start > lastEnd) {
        segments.push(
          <span key={`text-${lastEnd}`}>{text.substring(lastEnd, highlight.start)}</span>
        );
      }

      // Add highlighted span
      const colors = SPAN_COLORS[highlight.class || 'keyword'] || SPAN_COLORS.keyword;
      segments.push(
        <mark 
          key={`hl-${highlight.start}`}
          className={`${colors.bg} ${colors.text} px-1 rounded-sm font-medium cursor-help`}
          title={`${SPAN_LABELS[highlight.class || 'keyword'] || highlight.class}: "${highlight.text}"`}
        >
          {text.substring(highlight.start, highlight.end)}
        </mark>
      );

      lastEnd = highlight.end;
    }

    // Add remaining text
    if (lastEnd < text.length) {
      segments.push(
        <span key={`text-${lastEnd}`}>{text.substring(lastEnd)}</span>
      );
    }

    return <>{segments}</>;
  };

  /**
   * Get unique span classes from highlights
   */
  const getUniqueClasses = (highlights: Highlight[]): string[] => {
    const classes = new Set(highlights.map(h => h.class || 'keyword'));
    return Array.from(classes);
  };

  if (!selectedTheme) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/40">Select a theme to view matching responses</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-4">
        <h3 className="text-2xl font-black text-white mb-2">
          {selectedTheme.name}
        </h3>
        <p className="text-white/60 text-sm">
          {selectedTheme.response_count || 0} response{selectedTheme.response_count !== 1 ? 's' : ''} with semantic matches
        </p>
      </div>

      {/* Legend for span colors */}
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(SPAN_LABELS).map(([cls, label]) => {
          const colors = SPAN_COLORS[cls];
          return (
            <span
              key={cls}
              className={`px-2 py-0.5 rounded text-xs ${colors.bg} ${colors.text} border ${colors.border}/30`}
            >
              {label}
            </span>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div>
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4 mx-auto"></div>
            <p className="text-white/40 text-sm">Loading responses...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4 pb-20">
            {responses.length > 0 ? (
              <>
                {responses.map((response) => {
                  const spanClasses = getUniqueClasses(response.highlights);
                  
                  return (
                    <div
                      key={response.id}
                      className="glass rounded-lg p-5 border-l-4 border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <span className="text-xs font-semibold text-cyan-400">
                          Response #{response.id}
                        </span>
                        <div className="flex items-center gap-2">
                          {spanClasses.map(cls => {
                            const colors = SPAN_COLORS[cls] || SPAN_COLORS.keyword;
                            return (
                              <span
                                key={cls}
                                className={`px-1.5 py-0.5 rounded text-[10px] ${colors.bg} ${colors.text}`}
                              >
                                {SPAN_LABELS[cls] || cls}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      
                      <p className="text-white/90 leading-relaxed text-base">
                        {highlightWithSpans(response.text, response.highlights)}
                      </p>

                      {/* Show extracted phrases */}
                      {response.highlights && response.highlights.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs text-white/40 mb-2">Contributing phrases:</p>
                          <div className="flex flex-wrap gap-2">
                            {response.highlights.map((highlight, hidx) => {
                              const colors = SPAN_COLORS[highlight.class || 'keyword'] || SPAN_COLORS.keyword;
                              return (
                                <span
                                  key={hidx}
                                  className={`px-2 py-0.5 rounded text-xs ${colors.text} ${colors.bg} border ${colors.border}/30`}
                                >
                                  &ldquo;{highlight.text}&rdquo;
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {loadingMore && (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    <p className="text-white/40 text-sm mt-2">Loading more...</p>
                  </div>
                )}
                
                {!hasMore && responses.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-white/30 text-sm">
                      All {responses.length} matching responses loaded
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-20">
                <p className="text-white/40">No matching responses found</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
