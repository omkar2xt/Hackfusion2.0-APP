import React from 'react';

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color?: string;
}

const colorStyles: Record<string, { bg: string; ring: string }> = {
  teal: { bg: 'bg-teal-500/15', ring: 'ring-teal-500/20' },
  cyan: { bg: 'bg-cyan-500/15', ring: 'ring-cyan-500/20' },
  blue: { bg: 'bg-blue-500/15', ring: 'ring-blue-500/20' },
  purple: { bg: 'bg-purple-500/15', ring: 'ring-purple-500/20' },
  amber: { bg: 'bg-amber-500/15', ring: 'ring-amber-500/20' },
  red: { bg: 'bg-red-500/15', ring: 'ring-red-500/20' },
  green: { bg: 'bg-green-500/15', ring: 'ring-green-500/20' },
};

export default function QuickActionCard({
  icon,
  title,
  description,
  onClick,
  color = 'teal',
}: QuickActionCardProps) {
  const c = colorStyles[color] || colorStyles.teal;

  return (
    <button
      onClick={onClick}
      className="
        group flex items-center gap-3.5 w-full p-4 rounded-2xl text-left
        bg-slate-800/40 border border-slate-700/50
        hover:bg-slate-800/70 hover:border-slate-600/60
        hover:shadow-lg hover:shadow-teal-500/5
        active:scale-[0.98]
        transition-all duration-200 ease-out
      "
    >
      {/* Icon circle */}
      <div
        className={`
          w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0
          ${c.bg} ring-1 ${c.ring}
          group-hover:scale-110 transition-transform duration-200
        `}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-white truncate leading-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 truncate">
          {description}
        </p>
      </div>
    </button>
  );
}
