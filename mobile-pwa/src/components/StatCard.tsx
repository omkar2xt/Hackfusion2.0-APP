import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

const colorMap: Record<string, { icon: string; gradient: string }> = {
  teal: {
    icon: 'text-teal-400 bg-teal-500/15',
    gradient: 'from-teal-500/20 via-transparent to-transparent',
  },
  cyan: {
    icon: 'text-cyan-400 bg-cyan-500/15',
    gradient: 'from-cyan-500/20 via-transparent to-transparent',
  },
  blue: {
    icon: 'text-blue-400 bg-blue-500/15',
    gradient: 'from-blue-500/20 via-transparent to-transparent',
  },
  amber: {
    icon: 'text-amber-400 bg-amber-500/15',
    gradient: 'from-amber-500/20 via-transparent to-transparent',
  },
  red: {
    icon: 'text-red-400 bg-red-500/15',
    gradient: 'from-red-500/20 via-transparent to-transparent',
  },
  purple: {
    icon: 'text-purple-400 bg-purple-500/15',
    gradient: 'from-purple-500/20 via-transparent to-transparent',
  },
  green: {
    icon: 'text-green-400 bg-green-500/15',
    gradient: 'from-green-500/20 via-transparent to-transparent',
  },
};

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  switch (trend) {
    case 'up':
      return <TrendingUp size={14} className="text-green-400" />;
    case 'down':
      return <TrendingDown size={14} className="text-red-400" />;
    case 'neutral':
      return <Minus size={14} className="text-slate-500" />;
  }
}

export default function StatCard({
  icon,
  label,
  value,
  trend,
  color = 'teal',
}: StatCardProps) {
  const c = colorMap[color] || colorMap.teal;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-800/40 border border-slate-700/50 p-4">
      {/* Subtle gradient glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${c.gradient} pointer-events-none`}
      />

      <div className="relative flex items-start justify-between gap-2">
        {/* Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}
        >
          {icon}
        </div>

        {/* Trend indicator */}
        {trend && (
          <div className="flex-shrink-0">
            <TrendIcon trend={trend} />
          </div>
        )}
      </div>

      <div className="relative mt-3">
        <p className="text-2xl font-bold text-white leading-none tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}
