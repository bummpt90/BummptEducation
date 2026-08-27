import React from 'react';

interface LogoProps {
  variant?: 'full' | 'compact' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BummptechLogo: React.FC<LogoProps> = ({ variant = 'full', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-14 text-lg',
    xl: 'h-20 text-2xl'
  };

  const iconSizes = {
    sm: { w: 32, h: 32, bi: 'text-[11px]' },
    md: { w: 42, h: 42, bi: 'text-[14px]' },
    lg: { w: 56, h: 56, bi: 'text-[18px]' },
    xl: { w: 80, h: 80, bi: 'text-[26px]' }
  };

  const currentIcon = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`} id="bummptech-brand-logo">
      {/* SVG Icon matching the Bummptech "BI" Circuit Star & Wings Logo */}
      <div 
        className="relative flex items-center justify-center rounded-xl bg-slate-950 p-1 shadow-md border border-slate-800 shrink-0"
        style={{ width: currentIcon.w, height: currentIcon.h }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="wingGradientLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E40AF" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="wingGradientRight" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E40AF" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>

          {/* Left Wing / Crescent */}
          <path
            d="M 10 40 Q 30 75 50 82 Q 25 78 12 55 Z"
            fill="url(#wingGradientLeft)"
            opacity="0.9"
          />
          {/* Right Wing / Crescent */}
          <path
            d="M 90 40 Q 70 75 50 82 Q 75 78 88 55 Z"
            fill="url(#wingGradientRight)"
            opacity="0.9"
          />

          {/* Circuit connection dots/lines */}
          <line x1="50" y1="20" x2="30" y2="40" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="2,2" />
          <line x1="50" y1="20" x2="70" y2="40" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="2,2" />
          <line x1="50" y1="75" x2="35" y2="60" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="2,2" />
          <line x1="50" y1="75" x2="65" y2="60" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="2,2" />

          {/* Central 6-Pointed Star */}
          <polygon
            points="50,15 58,35 78,35 62,48 68,68 50,55 32,68 38,48 22,35 42,35"
            fill="url(#starGradient)"
            stroke="#38BDF8"
            strokeWidth="1"
          />

          {/* Central BI Text */}
          <text
            x="50"
            y="49"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#DC2626"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
            fontSize="22"
            letterSpacing="-0.5"
          >
            BI
          </text>

          {/* Innovate & Create caption in curve or bottom */}
          <text
            x="50"
            y="88"
            textAnchor="middle"
            fill="#EF4444"
            fontWeight="700"
            fontSize="6.5"
            letterSpacing="0.8"
          >
            INNOVATE & CREATE
          </text>
        </svg>
      </div>

      {variant !== 'compact' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-slate-900 text-lg md:text-xl leading-none">
              Bummpt<span className="text-blue-600">Education</span>
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 tracking-tight leading-tight mt-0.5">
            By Bummptech Global Concepts
          </span>
        </div>
      )}
    </div>
  );
};
