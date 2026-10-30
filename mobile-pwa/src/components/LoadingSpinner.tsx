interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { spinner: 'w-6 h-6', border: 'border-2', text: 'text-xs' },
  md: { spinner: 'w-10 h-10', border: 'border-[3px]', text: 'text-sm' },
  lg: { spinner: 'w-14 h-14', border: 'border-4', text: 'text-base' },
};

export default function LoadingSpinner({ message, size = 'md' }: LoadingSpinnerProps) {
  const s = sizeMap[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`
          ${s.spinner} ${s.border}
          border-[#E5E9ED] border-t-[#315E63]
          rounded-full animate-spin
        `}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className={`${s.text} text-[#64748B] font-medium animate-pulse`}>
          {message}
        </p>
      )}
    </div>
  );
}
