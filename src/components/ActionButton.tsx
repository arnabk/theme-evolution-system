interface ActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  progress?: number; // 0-100
  helpText?: string;
  variant?: 'primary' | 'secondary' | 'accent';
}

export function ActionButton({ label, onClick, disabled, loading, progress, helpText, variant = 'primary' }: ActionButtonProps) {
  const variants = {
    primary: 'from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-600',
    secondary: 'from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600',
    accent: 'from-blue-500 via-indigo-500 to-violet-500 hover:from-blue-600 hover:via-indigo-600 hover:to-violet-600',
  };

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          group relative w-full py-5 px-8 rounded-2xl font-bold text-white text-lg
          bg-gradient-to-r ${variants[variant]}
          shadow-2xl shadow-blue-500/30
          disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
          transition-all duration-500 ease-out
          hover:scale-[1.02] hover:shadow-blue-500/50
          active:scale-95
          overflow-hidden
        `}
      >
        {/* Progress bar inside button */}
        {typeof progress === 'number' && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/5 transition-all duration-300"
               style={{ width: `${progress}%` }}>
          </div>
        )}
        
        {/* Shine effect */}
        {!loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 ease-out"></div>
        )}
        
        <div className="relative flex items-center justify-center space-x-2 whitespace-nowrap">
          {loading && (
            <svg className="animate-spin h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span className="drop-shadow-lg truncate">{label}</span>
          {typeof progress === 'number' && (
            <span className="text-sm opacity-75 flex-shrink-0">({Math.round(progress)}%)</span>
          )}
        </div>
      </button>
      {helpText && (
        <p className="text-white/50 text-sm text-center animate-pulse">{helpText}</p>
      )}
    </div>
  );
}
