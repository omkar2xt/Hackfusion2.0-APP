import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F0F4F4] border border-[#E5E9ED] flex items-center justify-center text-[#64748B] text-3xl">
        {icon}
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-[#202A35]">{title}</h3>
        <p className="text-sm text-[#64748B] max-w-xs leading-relaxed">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-xl mt-1
            bg-[#315E63] text-white
            text-sm font-semibold
            hover:bg-[#274B4F] active:scale-[0.97]
            shadow-xs cursor-pointer
            transition-all duration-150
          "
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
