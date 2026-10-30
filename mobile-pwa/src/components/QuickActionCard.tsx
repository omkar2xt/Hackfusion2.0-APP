import React from 'react';

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color?: string;
}

const colorStyles: Record<string, { bg: string; text: string }> = {
  teal: { bg: 'bg-[#315E63]/10', text: 'text-[#315E63]' },
  cyan: { bg: 'bg-[#397C78]/10', text: 'text-[#397C78]' },
  blue: { bg: 'bg-[#477B9B]/10', text: 'text-[#477B9B]' },
  purple: { bg: 'bg-[#315E63]/10', text: 'text-[#315E63]' },
  amber: { bg: 'bg-[#C58A35]/10', text: 'text-[#C58A35]' },
  red: { bg: 'bg-[#C74747]/10', text: 'text-[#C74747]' },
  green: { bg: 'bg-[#27845A]/10', text: 'text-[#27845A]' },
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
        bg-white border border-[#E5E9ED] shadow-xs
        hover:bg-[#F0F4F4] hover:border-[#315E63]/30
        active:scale-[0.98] cursor-pointer
        transition-all duration-150 ease-out
      "
    >
      {/* Icon circle */}
      <div
        className={`
          w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0
          ${c.bg} ${c.text}
          group-hover:scale-105 transition-transform duration-150
        `}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-[#202A35] truncate leading-tight group-hover:text-[#315E63] transition">
          {title}
        </h3>
        <p className="text-xs text-[#64748B] mt-0.5 truncate">
          {description}
        </p>
      </div>
    </button>
  );
}
