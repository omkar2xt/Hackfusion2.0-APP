import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export default function Header({ title, subtitle, showBack = false }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-[#0a0f1e]/95 backdrop-blur-lg border-b border-slate-700/50">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {/* Left: Back button or spacer */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="
                -ml-1 w-9 h-9 flex items-center justify-center rounded-xl
                text-slate-400 hover:text-white hover:bg-slate-800/60
                active:scale-95 transition-all duration-150 flex-shrink-0
              "
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white truncate leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-slate-400 truncate leading-tight">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Shield branding */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
          <Shield size={20} className="text-teal-400" strokeWidth={2} />
          <span className="text-xs font-bold text-teal-400 tracking-wide hidden sm:inline">
            SignalSafe
          </span>
        </div>
      </div>
    </header>
  );
}
