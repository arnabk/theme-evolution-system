/**
 * ThemesList - Left sidebar showing all themes
 */

interface Theme {
  id: number;
  name: string;
  description: string;
  confidence: number;
  created_at: string;
  contributing_responses?: number;
  keywords?: string[];
}

interface ThemesListProps {
  themes: Theme[];
  selectedTheme: Theme | null;
  onSelectTheme: (theme: Theme) => void;
}

export function ThemesList({ themes, selectedTheme, onSelectTheme }: ThemesListProps) {
  return (
    <div className="w-1/3 flex flex-col sticky top-4 self-start max-h-[calc(100vh-150px)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-black gradient-text">Themes</h3>
        <span className="glass-dark px-4 py-1.5 rounded-full text-white/60 text-sm font-semibold">
          {themes.length} found
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {themes.map((theme) => (
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
                  {theme.contributing_responses || 0}
                </span>
              </div>
              <h4 className={`text-base font-semibold leading-snug flex-1 ${
                selectedTheme?.id === theme.id ? 'text-white' : 'text-white/80'
              }`}>
                {theme.name}
              </h4>
            </div>
            
            {selectedTheme?.id === theme.id && theme.description && (
              <p className="text-white/60 text-xs leading-relaxed mt-2 pl-13">
                {theme.description}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

