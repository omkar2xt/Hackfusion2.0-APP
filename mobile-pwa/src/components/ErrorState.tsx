import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-[#C74747]/10 border border-[#C74747]/25 flex items-center justify-center">
        <AlertTriangle size={28} className="text-[#C74747]" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-[#202A35]">Something went wrong</h3>
        <p className="text-sm text-[#64748B] max-w-xs leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-[#315E63]/10 border border-[#315E63]/25 text-[#315E63]
            text-sm font-semibold
            hover:bg-[#315E63]/20 active:scale-[0.97]
            transition-all duration-150 cursor-pointer
          "
        >
          <RotateCcw size={15} />
          Try Again
        </button>
      )}
    </div>
  );
}
