import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  LayoutDashboard,
  Search,
  QrCode,
  Radio,
  Dna,
  GitFork,
  BookOpen,
  FileText,
  User as UserIcon,
} from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

export default function Header({ title, subtitle, showBack = false }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const desktopNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Scan', path: '/scan', icon: Search },
    { label: 'QR Guard', path: '/qr-scanner', icon: QrCode },
    { label: 'Cyber Radar', path: '/radar', icon: Radio },
    { label: 'Threat DNA', path: '/threat-dna', icon: Dna },
    { label: 'Trust Graph', path: '/trust-graph', icon: GitFork },
    { label: 'Safety Coach', path: '/coach', icon: BookOpen },
    { label: 'Reports', path: '/reports', icon: FileText },
    { label: 'Profile', path: '/profile', icon: UserIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0a0f1e]/95 backdrop-blur-lg border-b border-slate-800/80">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Left: Branding & Back Button */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:brightness-110 transition">
              <Shield size={19} className="text-slate-950 font-bold" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">SignalSafe</span>
                <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/30 px-1.5 py-0.2 rounded uppercase">
                  Campus
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Unified Cybersecurity Defense</p>
            </div>
          </div>

          {title && (
            <div className="ml-3 pl-3 border-l border-slate-800 hidden md:block">
              <h1 className="text-sm font-bold text-slate-200">{title}</h1>
              {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
            </div>
          )}
        </div>

        {/* Middle/Right: Desktop Navigation Links (Visible on tablets & big screens) */}
        <nav className="hidden lg:flex items-center gap-1">
          {desktopNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-teal-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Title Display */}
        {title && (
          <div className="block md:hidden text-right min-w-0 flex-1 ml-2">
            <h1 className="text-xs font-bold text-white truncate">{title}</h1>
            {subtitle && <p className="text-[10px] text-slate-400 truncate">{subtitle}</p>}
          </div>
        )}
      </div>
    </header>
  );
}
