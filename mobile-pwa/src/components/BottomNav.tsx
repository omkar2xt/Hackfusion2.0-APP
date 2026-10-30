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

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/welcome'];

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={20} strokeWidth={1.8} />,
    activeIcon: <LayoutDashboard size={20} strokeWidth={2.4} />,
    label: 'Dashboard',
    route: '/dashboard',
  },
  {
    icon: <Search size={20} strokeWidth={1.8} />,
    activeIcon: <Search size={20} strokeWidth={2.4} />,
    label: 'Scan',
    route: '/scan',
  },
  {
    icon: <QrCode size={20} strokeWidth={1.8} />,
    activeIcon: <QrCode size={20} strokeWidth={2.4} />,
    label: 'QR',
    route: '/qr-scanner',
  },
  {
    icon: <FileText size={20} strokeWidth={1.8} />,
    activeIcon: <FileText size={20} strokeWidth={2.4} />,
    label: 'Reports',
    route: '/reports',
  },
  {
    icon: <User size={20} strokeWidth={1.8} />,
    activeIcon: <User size={20} strokeWidth={2.4} />,
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E5E9ED] lg:hidden shadow-xs">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.route;

          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`
                flex flex-col items-center justify-center gap-0.5 w-full h-full
                transition-all duration-150 ease-out relative cursor-pointer
                ${isActive ? 'text-[#315E63]' : 'text-[#64748B] hover:text-[#202A35]'}
              `}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#315E63] rounded-full" />
              )}
              <span
                className={`
                  transition-transform duration-150
                  ${isActive ? 'scale-105' : 'scale-100'}
                `}
              >
                {isActive ? item.activeIcon : item.icon}
              </span>
              <span
                className={`
                  text-[10px] leading-none mt-0.5
                  ${isActive ? 'font-bold text-[#315E63]' : 'font-medium text-[#64748B]'}
                `}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
