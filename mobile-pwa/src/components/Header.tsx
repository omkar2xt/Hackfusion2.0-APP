import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutDashboard,
  Search,
  QrCode,
  Radio,
  Dna,
  GitFork,
  ShieldCheck,
  FileText,
  User as UserIcon,
  Menu,
  X,
  AlertTriangle,
  ChevronRight,
  Smartphone,
} from 'lucide-react';
import Logo from './Logo';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

export default function Header({ title, subtitle, showBack = false }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, desc: 'Central security posture' },
    { label: 'Scan', path: '/scan', icon: Search, desc: 'Analyze URLs & suspicious text' },
    { label: 'QR Guard', path: '/qr-scanner', icon: QrCode, desc: 'Quishing & tamper detection' },
    { label: 'Cyber Radar', path: '/radar', icon: Radio, desc: 'Threat trends & proximity mesh' },
    { label: 'Threat DNA', path: '/threat-dna', icon: Dna, desc: 'Campaign correlation & clusters' },
    { label: 'Trust Graph', path: '/trust-graph', icon: GitFork, desc: 'Verified campus directory' },
    { label: 'Cyber Readiness', path: '/coach', icon: ShieldCheck, desc: 'SOC investigation workspace' },
    { label: 'Reports', path: '/reports', icon: FileText, desc: 'Incident cases & offline sync' },
    { label: 'Profile & Relay', path: '/profile', icon: UserIcon, desc: 'Device mesh & account hierarchy' },
    { label: 'Get APK', path: '/download', icon: Smartphone, desc: 'Direct Android APK & sideloading' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E9ED] shadow-xs">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Left: Branding & Back Button */}
          <div className="flex items-center gap-3 min-w-0">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#64748B] hover:text-[#202A35] hover:bg-[#F0F4F4] transition"
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <Logo
              size="md"
              onClick={() => navigate('/dashboard')}
              className="shrink-0"
            />

            {title && (
              <div className="ml-2 pl-3 border-l border-[#E5E9ED] hidden xl:block max-w-xs truncate">
                <h1 className="text-xs font-bold text-[#202A35] truncate">{title}</h1>
                {subtitle && <p className="text-[10px] text-[#64748B] truncate">{subtitle}</p>}
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-[#F0F4F4] text-[#315E63] border border-[#315E63]/25 font-bold shadow-xs'
                      : 'text-[#64748B] hover:text-[#202A35] hover:bg-[#F0F4F4]'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-[#315E63]' : 'text-[#64748B]'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Red Alert Radar Shortcut + Mobile Hamburger */}
          <div className="flex items-center gap-2">
            {/* APK Download Button */}
            <button
              onClick={() => navigate('/download')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#315E63]/10 hover:bg-[#315E63]/20 border border-[#315E63]/25 text-[#315E63] text-xs font-bold transition active:scale-95 cursor-pointer"
              title="Download Android APK"
            >
              <Smartphone size={13} className="text-[#315E63]" />
              <span>Get APK</span>
            </button>

            <button
              onClick={() => navigate('/radar')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#C74747]/10 hover:bg-[#C74747]/20 border border-[#C74747]/25 text-[#C74747] text-xs font-bold transition active:scale-95 cursor-pointer"
              title="Campus Threat Radar & Red Alert Command"
            >
              <Radio size={13} className="text-[#C74747] animate-pulse" />
              <span className="hidden sm:inline">Radar Mesh</span>
            </button>

            {/* Hamburger Button for Mobile / Tablet */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="xl:hidden w-9 h-9 rounded-xl bg-white border border-[#E5E9ED] flex items-center justify-center text-[#202A35] hover:bg-[#F0F4F4] transition"
              aria-label="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Navigation Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border-l border-[#E5E9ED] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Top Header */}
            <div className="p-4 border-b border-[#E5E9ED] flex items-center justify-between">
              <Logo size="sm" variant="full" />
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#F7F8FA] border border-[#E5E9ED] text-[#64748B] hover:text-[#202A35] flex items-center justify-center cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* User Session Profile Snippet */}
            <div className="p-4 mx-4 mt-4 rounded-2xl bg-[#F7F8FA] border border-[#E5E9ED] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#315E63]/10 border border-[#315E63]/25 flex items-center justify-center text-[#315E63] font-bold text-xs">
                AR
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-[#202A35] truncate">Alex Rivera</h4>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#315E63]/10 text-[#315E63] border border-[#315E63]/25 uppercase">
                    Student
                  </span>
                </div>
                <p className="text-[10px] text-[#64748B] font-mono truncate">Main University Campus</p>
                <div className="flex items-center gap-1 text-[10px] text-[#27845A] mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#27845A] animate-ping" />
                  <span>Authenticated Device Relay Active</span>
                </div>
              </div>
            </div>

            {/* Navigation Links List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider px-2 pt-2 pb-1">
                Security Modules & Workspaces
              </div>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition cursor-pointer ${
                      isActive
                        ? 'bg-[#F0F4F4] border border-[#315E63]/30 text-[#315E63] font-bold'
                        : 'text-[#202A35] hover:bg-[#F0F4F4] border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-[#315E63]/15 text-[#315E63]' : 'bg-[#F7F8FA] text-[#64748B]'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#202A35]">{item.label}</div>
                      <div className="text-[10px] text-[#64748B] truncate">{item.desc}</div>
                    </div>
                    <ChevronRight size={14} className="text-[#64748B]" />
                  </button>
                );
              })}
            </div>

            {/* Drawer Bottom Quick Action */}
            <div className="p-4 border-t border-[#E5E9ED] space-y-2">
              <button
                onClick={() => {
                  navigate('/radar');
                  setMobileDrawerOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-[#C74747] hover:bg-[#B33E3E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <AlertTriangle size={14} />
                <span>Dispatch Campus Red Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
