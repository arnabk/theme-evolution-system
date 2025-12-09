/**
 * ThemesList - Left sidebar showing all themes
 */

interface ThemePhrase {
  text: string;
  class: string;
}

interface Theme {
  id: number;
  name: string;
  description: string;
  phrases?: string;
  response_count: number;
  created_at: string;
  updated_at?: string;
}

interface ThemesListProps {
  themes: Theme[];
  selectedTheme: Theme | null;
  onSelectTheme: (theme: Theme) => void;
}

// Parse phrases JSON string
function getPhraseCount(theme: Theme): number {
  if (!theme.phrases) return 0;
  try {
    const parsed = JSON.parse(theme.phrases) as ThemePhrase[];
    return parsed.length;
  } catch {
    return 0;
  }
}

export function ThemesList({ themes, selectedTheme, onSelectTheme }: ThemesListProps) {
  return (
    <div className="w-1/3 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-black gradient-text">Themes</h3>
        <span className="glass-dark px-4 py-1.5 rounded-full text-white/60 text-sm font-semibold">
          {themes.length} found
        </span>
      </div>
      
      <div className="flex-1 space-y-3 pr-2 pb-8">
        {themes.map((theme) => {
          const phraseCount = getPhraseCount(theme);
          
          return (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(theme)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-300 border-2 ${
                selectedTheme?.id === theme.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'glass border-white/10 hover:border-cyan-400/50 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {/* Response Count Badge */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                  selectedTheme?.id === theme.id
                    ? 'bg-cyan-500/30 border-cyan-400'
                    : 'bg-cyan-500/10 border-cyan-400/30'
                }`}>
                  <span className="text-lg font-bold text-cyan-400">
                    {theme.response_count || 0}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className={`text-base font-semibold leading-snug ${
                    selectedTheme?.id === theme.id ? 'text-white' : 'text-white/80'
                  }`}>
                    {theme.name}
                  </h4>
                  {/* Phrase count indicator */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white/40">
                      {phraseCount} phrases
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedTheme?.id === theme.id && theme.description && (
                <p className="text-white/60 text-xs leading-relaxed mt-2 pl-13">
                  {theme.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

