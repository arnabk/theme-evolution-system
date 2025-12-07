interface QuestionDisplayProps {
  question: string;
}

export function QuestionDisplay({ question }: QuestionDisplayProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-black gradient-text flex items-center gap-3">
        <span className="text-4xl">📋</span>
        Current Survey Question
      </h2>
      {question ? (
        <div className="glass rounded-2xl p-8 border-l-4 border-blue-400 shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-500">
          <p className="text-xl text-white/90 leading-relaxed">{question}</p>
          <div className="mt-4 flex items-center gap-2 text-white/50 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span>Active Question</span>
          </div>
        </div>
      ) : (
        <div className="glass-dark rounded-2xl p-8 border-l-4 border-yellow-400 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <span className="text-4xl">⚠️</span>
            <div>
              <p className="text-white/80 text-lg font-medium mb-2">No question generated yet</p>
              <p className="text-white/50">Click 🎯 Generate Question to start the theme evolution process</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
