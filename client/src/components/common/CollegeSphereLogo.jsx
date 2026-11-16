import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Option A: The Collegiate Orbital Crest (Saturn Planetary Ring Construction)
 * 
 * 3D Layering Architecture:
 * 1. BACK RING LAYER (Z-index 0): The top half of the tilted Saturn orbit (passes behind the upper shield).
 * 2. SHIELD BODY LAYER (Z-index 1): The architectural collegiate crest with inner heraldry & star (middle).
 * 3. FRONT RING LAYER (Z-index 2): The bottom half of the tilted Saturn orbit with depth shadow & satellites
 *    (passes in front of the lower shield, completely encircling it like Saturn's rings).
 */
export function CollegeSphereLogoMark({
  size = 40,
  className = '',
  variant = 'brand', // 'brand' (Royal Blue) | 'amber' (SuperAdmin Gold) | 'emerald' (Organizer Green) | 'white'
  animated = false
}) {
  const uniqueId = React.useId().replace(/:/g, '');

  // Theme palettes based on variant
  const themes = {
    brand: {
      shieldFrom: '#2563EB',
      shieldTo: '#1D4ED8',
      shieldDeep: '#070D1E',
      ringFrom: '#60A5FA',
      ringTo: '#38BDF8',
      core: '#FFFFFF',
      glow: 'rgba(37, 99, 235, 0.45)',
      node: '#93C5FD'
    },
    amber: {
      shieldFrom: '#F59E0B',
      shieldTo: '#D97706',
      shieldDeep: '#180E02',
      ringFrom: '#FDE68A',
      ringTo: '#F59E0B',
      core: '#FFFFFF',
      glow: 'rgba(245, 158, 11, 0.45)',
      node: '#FDE68A'
    },
    emerald: {
      shieldFrom: '#10B981',
      shieldTo: '#059669',
      shieldDeep: '#022115',
      ringFrom: '#A7F3D0',
      ringTo: '#34D399',
      core: '#FFFFFF',
      glow: 'rgba(16, 185, 129, 0.45)',
      node: '#A7F3D0'
    },
    white: {
      shieldFrom: '#FFFFFF',
      shieldTo: '#CBD5E1',
      shieldDeep: '#0B132B',
      ringFrom: '#94A3B8',
      ringTo: '#64748B',
      core: '#0F172A',
      glow: 'rgba(255, 255, 255, 0.2)',
      node: '#FFFFFF'
    }
  };

  const theme = themes[variant] || themes.brand;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 transition-transform ${animated ? 'hover:scale-105' : ''} ${className}`}
      aria-label="CollegeSphere Collegiate Saturn-Orbital Crest Logo"
    >
      <defs>
        {/* Shield Gradient */}
        <linearGradient id={`shieldGrad-${uniqueId}`} x1="20" y1="14" x2="80" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.shieldFrom} />
          <stop offset="100%" stopColor={theme.shieldTo} />
        </linearGradient>

        {/* Inner Shield Bevel Depth */}
        <linearGradient id={`innerBevel-${uniqueId}`} x1="50" y1="20" x2="50" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
        </linearGradient>

        {/* Front Orbit Ring Gradient */}
        <linearGradient id={`frontRingGrad-${uniqueId}`} x1="4" y1="50" x2="96" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.ringFrom} />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={theme.ringTo} />
        </linearGradient>

        {/* Back Orbit Ring Gradient (Perspective depth) */}
        <linearGradient id={`backRingGrad-${uniqueId}`} x1="4" y1="50" x2="96" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.shieldTo} stopOpacity="0.65" />
          <stop offset="50%" stopColor={theme.ringFrom} stopOpacity="0.8" />
          <stop offset="100%" stopColor={theme.shieldFrom} stopOpacity="0.65" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id={`glow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={theme.glow} />
        </filter>
      </defs>

      {/* =========================================================================
          LAYER 1: BACK SATURN RING (Behind Shield)
          Renders the upper elliptical arc tilted at -24deg that sweeps behind the shield.
          ========================================================================= */}
      <g transform="rotate(-24 50 50)">
        {/* Outer Saturn ring back arc */}
        <path
          d="M 4 50 A 46 13.5 0 0 1 96 50"
          fill="none"
          stroke={`url(#backRingGrad-${uniqueId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Inner Cassini-style secondary track (dashed fine line) */}
        <path
          d="M 12 50 A 38 10 0 0 1 88 50"
          fill="none"
          stroke={`url(#backRingGrad-${uniqueId})`}
          strokeWidth="1.2"
          strokeDasharray="3 2"
          opacity="0.5"
        />
      </g>

      {/* =========================================================================
          LAYER 2: COLLEGIATE SHIELD CREST (In the Middle)
          Occludes the central portion of the back ring, establishing physical 3D depth.
          ========================================================================= */}
      <g filter={`url(#glow-${uniqueId})`}>
        {/* Outer Shadow Border */}
        <path
          d="M 50 14 C 64 14, 78 18, 78 18 C 78 48, 74 68, 50 88 C 26 68, 22 48, 22 18 C 22 18, 36 14, 50 14 Z"
          fill={theme.shieldDeep}
          opacity="0.6"
        />
        {/* Main Solid Shield */}
        <path
          d="M 50 15 C 63 15, 76 19, 76 19 C 76 47, 72 66, 50 86 C 28 66, 24 47, 24 19 C 24 19, 37 15, 50 15 Z"
          fill={`url(#shieldGrad-${uniqueId})`}
        />
        {/* Inner Bevel Light Surface */}
        <path
          d="M 50 18 C 61 18, 72 21, 72 21 C 72 45, 68 62, 50 80 C 32 62, 28 45, 28 21 C 28 21, 39 18, 50 18 Z"
          fill={`url(#innerBevel-${uniqueId})`}
        />
        {/* Shield Crest Boundary Highlight Stroke */}
        <path
          d="M 50 15 C 63 15, 76 19, 76 19 C 76 47, 72 66, 50 86 C 28 66, 24 47, 24 19 C 24 19, 37 15, 50 15 Z"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeOpacity="0.35"
        />
      </g>

      {/* Inner Crest Heraldry (North Star & Chevron) */}
      <g>
        {/* Central North Star / Nexus Node */}
        <path
          d="M 50 34 L 53 47 L 66 50 L 53 53 L 50 66 L 47 53 L 34 50 L 47 47 Z"
          fill={theme.core}
          opacity="0.95"
        />
        {/* Radiating Micro Core */}
        <circle cx="50" cy="50" r="2.8" fill={theme.shieldFrom} />
        {/* Collegiate Pillar Chevron Bottom */}
        <path
          d="M 40 68 L 50 75 L 60 68"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.4"
        />
      </g>

      {/* =========================================================================
          LAYER 3: FRONT SATURN RING (In Front of Shield)
          Renders the lower elliptical arc sweeping cleanly in front of the lower shield,
          with drop-shadow depth and planetary satellite nodes.
          ========================================================================= */}
      <g transform="rotate(-24 50 50)">
        {/* Deep Under-Shadow where the ring crosses the front of the shield */}
        <path
          d="M 96 50 A 46 13.5 0 0 1 4 50"
          fill="none"
          stroke={theme.shieldDeep}
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Main High-Luminance Front Saturn Ring */}
        <path
          d="M 96 50 A 46 13.5 0 0 1 4 50"
          fill="none"
          stroke={`url(#frontRingGrad-${uniqueId})`}
          strokeWidth="3.6"
          strokeLinecap="round"
        />

        {/* Inner Cassini Front Track */}
        <path
          d="M 88 50 A 38 10 0 0 1 12 50"
          fill="none"
          stroke={`url(#frontRingGrad-${uniqueId})`}
          strokeWidth="1.2"
          strokeDasharray="3 2"
          opacity="0.75"
        />

        {/* Planetary Satellite Nodes on the Ring Wings */}
        {/* Left Wing Satellite Node */}
        <circle cx="4" cy="50" r="3.2" fill="#FFFFFF" />
        <circle cx="4" cy="50" r="1.6" fill={theme.shieldFrom} />

        {/* Right Wing Satellite Node */}
        <circle cx="96" cy="50" r="2.8" fill={theme.node} />
        <circle cx="96" cy="50" r="1.4" fill="#FFFFFF" />

        {/* Front Center Orbiting Starlet */}
        <circle cx="50" cy="63.5" r="2.2" fill="#FFFFFF" opacity="0.9" />
      </g>
    </svg>
  );
}

/**
 * Full CollegeSphere Brand Unit:
 * Pairs Option A (The Collegiate Orbital Crest) with typographic wordmark and subtitle.
 */
export default function CollegeSphereLogo({
  to,
  size = 40,
  variant = 'brand', // 'brand' | 'amber' | 'emerald' | 'white'
  subtitle = 'Inter-College Event Network',
  className = '',
  wordmarkClassName = '',
  subtitleClassName = '',
  textScale = 'md', // 'sm' | 'md' | 'lg'
  onClick
}) {
  const isAmber = variant === 'amber';

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  const defaultSubtitleStyles = isAmber
    ? 'text-amber-400 font-bold'
    : 'text-slate-400 font-semibold';

  const content = (
    <div className={`flex items-center gap-3 group cursor-pointer select-none ${className}`}>
      {/* Option A: Orbital Crest Mark */}
      <div className="flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
        <CollegeSphereLogoMark size={size} variant={variant} animated />
      </div>

      {/* Collegiate Wordmark */}
      <div className="flex flex-col justify-center">
        <div className={`font-extrabold tracking-tight text-white leading-tight flex items-baseline ${titleSizes[textScale] || 'text-lg'} ${wordmarkClassName}`}>
          <span>College</span>
          <span className={isAmber ? 'text-amber-400' : 'text-brand-500'}>Sphere</span>
        </div>
        {subtitle && (
          <span
            className={`text-[10px] uppercase tracking-wider leading-none mt-0.5 truncate ${defaultSubtitleStyles} ${subtitleClassName}`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center text-inherit no-underline" onClick={onClick}>
        {content}
      </Link>
    );
  }

  return content;
}
