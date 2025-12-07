/**
 * ResponsesList - Right panel showing responses with highlighted keywords
 */

interface ThemeResponse {
  id: number;
  text: string;
  keywords: string[];
  highlights: any[];
  confidence: number;
}

interface ResponsesListProps {
  selectedTheme: { id: number; name: string; contributing_responses?: number } | null;
  responses: ThemeResponse[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
}

export function ResponsesList({ 
  selectedTheme, 
  responses, 
  loading, 
  loadingMore, 
  hasMore 
}: ResponsesListProps) {
  
  const highlightKeywords = (text: string, keywords: string[]) => {
    if (!keywords || keywords.length === 0) {
      return <span>{text}</span>;
    }

    const pattern = keywords
      .filter(k => k && k.length > 0)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    
    if (!pattern) {
      return <span>{text}</span>;
    }

    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => {
          const isKeyword = keywords.some(k => 
            k && k.toLowerCase() === part.toLowerCase()
          );
          
          if (isKeyword) {
            return (
              <mark 
                key={i} 
                className="bg-cyan-400/30 text-cyan-200 px-1 rounded-sm font-medium"
              >
                {part}
              </mark>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
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
          {selectedTheme.contributing_responses || 0} response{(selectedTheme.contributing_responses || 0) !== 1 ? 's' : ''} with matching keywords
        </p>
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
                {responses.map((response) => (
                  <div
                    key={response.id}
                    className="glass rounded-lg p-5 border-l-4 border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <span className="text-xs font-semibold text-cyan-400">
                        Response #{response.id}
                      </span>
                      <span className="text-xs text-white/40">
                        Confidence: {(response.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    <p className="text-white/90 leading-relaxed text-base">
                      {highlightKeywords(response.text, response.keywords)}
                    </p>

                    {response.keywords && response.keywords.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {response.keywords.map((keyword, kidx) => (
                          <span
                            key={kidx}
                            className="px-2 py-0.5 rounded text-xs text-cyan-300 bg-cyan-500/20 border border-cyan-400/30"
                          >
                            {keyword.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
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

