import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  QrCode,
  FileText,
  User,
} from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
  route: string;
}

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/'];

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={22} strokeWidth={1.8} />,
    activeIcon: <LayoutDashboard size={22} strokeWidth={2.4} />,
    label: 'Dashboard',
    route: '/dashboard',
  },
  {
    icon: <Search size={22} strokeWidth={1.8} />,
    activeIcon: <Search size={22} strokeWidth={2.4} />,
    label: 'Scan',
    route: '/scan',
  },
  {
    icon: <QrCode size={22} strokeWidth={1.8} />,
    activeIcon: <QrCode size={22} strokeWidth={2.4} />,
    label: 'QR',
    route: '/qr-scanner',
  },
  {
    icon: <FileText size={22} strokeWidth={1.8} />,
    activeIcon: <FileText size={22} strokeWidth={2.4} />,
    label: 'Reports',
    route: '/reports',
  },
  {
    icon: <User size={22} strokeWidth={1.8} />,
    activeIcon: <User size={22} strokeWidth={2.4} />,
    label: 'Profile',
    route: '/profile',
  },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = AUTH_ROUTES.some(
    (route) => location.pathname === route
  );

  if (isAuthPage) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.route;

          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`
                flex flex-col items-center justify-center gap-0.5 w-full h-full
                transition-all duration-200 ease-out relative
                ${isActive ? 'text-teal-400' : 'text-slate-500 active:text-slate-300'}
              `}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-teal-400 rounded-full" />
              )}
              <span
                className={`
                  transition-transform duration-200
                  ${isActive ? 'scale-110' : 'scale-100'}
                `}
              >
                {isActive ? item.activeIcon : item.icon}
              </span>
              <span
                className={`
                  text-[10px] font-medium leading-none mt-0.5
                  ${isActive ? 'text-teal-400' : 'text-slate-500'}
                `}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
