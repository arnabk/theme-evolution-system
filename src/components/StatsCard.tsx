interface StatsCardProps {
  icon: string;
  label: string;
  value: number;
  color?: 'blue' | 'purple' | 'pink' | 'green';
}

export function StatsCard({ icon, label, value, color = 'blue' }: StatsCardProps) {
  const colors = {
    blue: 'from-blue-500/20 to-cyan-600/20 border-cyan-400/30 shadow-cyan-500/50',
    purple: 'from-indigo-500/20 to-blue-600/20 border-blue-400/30 shadow-blue-500/50',
    pink: 'from-teal-500/20 to-emerald-600/20 border-teal-400/30 shadow-teal-500/50',
    green: 'from-green-500/20 to-emerald-600/20 border-emerald-400/30 shadow-emerald-500/50',
  };

  return (
    <div className={`
      group relative overflow-hidden
      bg-gradient-to-br ${colors[color]}
      backdrop-blur-xl border rounded-2xl p-6
      hover:scale-105 transition-all duration-500
      hover:shadow-2xl ${colors[color].split(' ')[2]}
      cursor-pointer
    `}>
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-4xl filter drop-shadow-lg">{icon}</span>
          <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse"></div>
        </div>
        <div className="text-white/70 text-sm font-medium mb-2">{label}</div>
        <div className="text-5xl font-black gradient-text drop-shadow-2xl">
          {value}
        </div>
      </div>
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full"></div>
    </div>
  );
}
