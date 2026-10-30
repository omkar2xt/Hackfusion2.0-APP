import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  variant = 'compact',
  className = '',
  onClick,
}) => {
  const sizeMap = {
    sm: {
      img: 'w-7 h-7 rounded-lg',
      title: 'text-xs',
      sub: 'text-[9px]',
      badge: 'text-[9px] px-1 py-0.2',
    },
    md: {
      img: 'w-9 h-9 rounded-xl',
      title: 'text-sm',
      sub: 'text-[10px]',
      badge: 'text-[10px] px-1.5 py-0.2',
    },
    lg: {
      img: 'w-14 h-14 rounded-2xl shadow-sm',
      title: 'text-xl',
      sub: 'text-xs',
      badge: 'text-xs px-2 py-0.5',
    },
    xl: {
      img: 'w-24 h-24 rounded-3xl shadow-md border border-[#E5E9ED]',
      title: 'text-3xl',
      sub: 'text-sm',
      badge: 'text-xs px-2.5 py-0.5',
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* Emblem Icon */}
      <div className="relative shrink-0 flex items-center justify-center">
        <img
          src="/logo-icon.jpg"
          alt="YODHRA Cyber Intelligence Logo"
          className={`${currentSize.img} object-cover border border-[#E5E9ED] shadow-sm transition group-hover:border-[#315E63]/40`}
        />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-tight min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`${currentSize.title} font-black tracking-wider text-[#202A35] uppercase font-sans group-hover:text-[#315E63] transition`}
            >
              YODHRA
            </span>
            <span
              className={`${currentSize.badge} font-bold text-[#315E63] bg-[#315E63]/10 border border-[#315E63]/25 rounded uppercase tracking-wider`}
            >
              CAMPUS
            </span>
          </div>

          {variant === 'full' ? (
            <div className="flex flex-col mt-0.5">
              <span className={`${currentSize.sub} font-semibold tracking-widest text-[#315E63] uppercase text-[10px]`}>
                CYBER INTELLIGENCE
              </span>
              <span className="text-[9px] text-[#64748B] font-mono tracking-wider mt-0.5">
                DEFEND • DETECT • RESPOND
              </span>
            </div>
          ) : (
            <p className={`${currentSize.sub} text-[#64748B] hidden sm:block truncate mt-0.5`}>
              Defend • Detect • Respond
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
