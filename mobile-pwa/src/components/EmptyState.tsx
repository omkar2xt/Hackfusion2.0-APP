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
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-500 text-3xl">
        {icon}
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-xl mt-1
            bg-teal-500 text-white
            text-sm font-semibold
            hover:bg-teal-600 active:scale-[0.97]
            shadow-lg shadow-teal-500/20
            transition-all duration-150
          "
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
