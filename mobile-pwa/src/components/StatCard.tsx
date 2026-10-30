import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

const colorMap: Record<string, { icon: string; border: string }> = {
  teal: {
    icon: 'text-[#315E63] bg-[#315E63]/10',
    border: 'border-[#315E63]/20',
  },
  cyan: {
    icon: 'text-[#397C78] bg-[#397C78]/10',
    border: 'border-[#397C78]/20',
  },
  blue: {
    icon: 'text-[#477B9B] bg-[#477B9B]/10',
    border: 'border-[#477B9B]/20',
  },
  amber: {
    icon: 'text-[#C58A35] bg-[#C58A35]/10',
    border: 'border-[#C58A35]/20',
  },
  red: {
    icon: 'text-[#C74747] bg-[#C74747]/10',
    border: 'border-[#C74747]/20',
  },
  purple: {
    icon: 'text-[#315E63] bg-[#315E63]/10',
    border: 'border-[#315E63]/20',
  },
  green: {
    icon: 'text-[#27845A] bg-[#27845A]/10',
    border: 'border-[#27845A]/20',
  },
};

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  switch (trend) {
    case 'up':
      return <TrendingUp size={14} className="text-[#27845A]" />;
    case 'down':
      return <TrendingDown size={14} className="text-[#C74747]" />;
    case 'neutral':
      return <Minus size={14} className="text-[#64748B]" />;
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
    <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E5E9ED] p-4 shadow-xs transition hover:border-[#315E63]/30">
      <div className="flex items-start justify-between gap-2">
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

      <div className="mt-3">
        <p className="text-2xl font-bold text-[#202A35] leading-none tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs text-[#64748B] mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}
