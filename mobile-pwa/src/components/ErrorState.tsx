import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-white">Something went wrong</h3>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-teal-500/15 border border-teal-500/30 text-teal-400
            text-sm font-medium
            hover:bg-teal-500/25 active:scale-[0.97]
            transition-all duration-150
          "
        >
          <RotateCcw size={15} />
          Try Again
        </button>
      )}
    </div>
  );
}
