import React from 'react';

/**
 * Clean collegiate metric card.
 * Replaces generic glowing cards with clear typography and semantic status accents.
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'brand',
  trend,
  className = ''
}) {
  const accentStyles = {
    brand: 'text-brand-500 bg-brand-500/10 border-brand-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
  };

  const badgeStyle = accentStyles[accent] || accentStyles.brand;

  return (
    <div
      className={`bg-surface-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-slate-700 transition-all ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${badgeStyle}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
          {value}
        </div>
        {trend && (
          <span className="text-xs font-medium text-slate-400">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
