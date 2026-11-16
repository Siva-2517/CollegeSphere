import React, { useState } from 'react';
import {
  User,
  Shield,
  Building2,
  Mail,
  Lock,
  Key,
  CheckCircle,
  AlertCircle,
  Award,
  GraduationCap,
  Calendar,
  Sparkles,
  Check
} from 'lucide-react';
import { CollegeSphereLogoMark } from './CollegeSphereLogo';

/**
 * Bespoke Collegiate Profile & Academic ID Credential Section.
 * Shared across Student, Organizer, Admin, and SuperAdmin dashboards.
 */
export default function ProfileSection({
  user,
  collegeName,
  roleTitle = 'Student Scholar',
  roleDescription = 'Verified Academic Member',
  stats = [],
  onSaveProfile, // (payload, 'profile' | 'password') => Promise
  accentColor = 'brand' // 'brand' | 'amber' | 'indigo' | 'emerald'
}) {
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [nameFeedback, setNameFeedback] = useState({ type: '', message: '' });
  const [passwordFeedback, setPasswordFeedback] = useState({ type: '', message: '' });

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setNameFeedback({ type: '', message: '' });

    if (!name.trim()) {
      setNameFeedback({ type: 'error', message: 'Name cannot be empty.' });
      return;
    }

    setSavingName(true);
    try {
      await onSaveProfile({ name: name.trim() }, 'profile');
      setNameFeedback({ type: 'success', message: 'Profile name successfully updated!' });
      setTimeout(() => setNameFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setNameFeedback({
        type: 'error',
        message: err.response?.data?.msg || err.response?.data?.message || err.message || 'Failed to update name'
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordFeedback({ type: '', message: '' });

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', message: 'Current password is required.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      await onSaveProfile({ currentPassword, newPassword }, 'password');
      setPasswordFeedback({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setPasswordFeedback({
        type: 'error',
        message: err.response?.data?.msg || err.response?.data?.message || err.message || 'Failed to update password'
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const accentGradient =
    accentColor === 'amber'
      ? 'from-amber-600 via-amber-700 to-amber-900'
      : accentColor === 'indigo'
      ? 'from-indigo-600 via-indigo-700 to-indigo-900'
      : accentColor === 'emerald'
      ? 'from-emerald-600 via-emerald-700 to-emerald-900'
      : 'from-brand-600 via-brand-700 to-rose-950';

  const badgeBg =
    accentColor === 'amber'
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      : accentColor === 'indigo'
      ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
      : accentColor === 'emerald'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : 'bg-brand-500/15 text-brand-300 border-brand-500/30';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <GraduationCap className="w-7 h-7 text-brand-500" />
          Academic Identity & Profile
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review institutional credentials, active standing, and manage account security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Collegiate ID Credential Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative bg-surface-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-ticket">
            {/* ID Ribbon Banner */}
            <div className={`h-28 bg-gradient-to-r ${accentGradient} p-4 relative flex items-start justify-between`}>
              <div className="flex items-center gap-2 text-white/90">
                <CollegeSphereLogoMark size={20} variant="white" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  CollegeSphere Academic ID
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/40 text-white/80 border border-white/20">
                VERIFIED
              </span>

              {/* Decorative background watermark */}
              <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none">
                <CollegeSphereLogoMark size={140} variant="white" />
              </div>
            </div>

            {/* Avatar & Core Identity */}
            <div className="px-6 pb-6 pt-0 relative">
              <div className="-mt-14 mb-4 flex items-end justify-between">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-surface-800 border-4 border-surface-900 text-white flex items-center justify-center font-extrabold text-2xl shadow-xl">
                    {initials}
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-surface-900 flex items-center justify-center"
                    title="Active Collegiate Account"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>

                <div className={`text-right px-3 py-1 rounded-xl border text-[11px] font-bold ${badgeBg}`} title={roleDescription}>
                  {roleTitle}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {user?.name || 'Academic Member'}
                  </h3>
                  <Award className="w-4 h-4 text-amber-400" title="Accredited Member" />
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {user?.email || 'N/A'}
                </p>
              </div>

              {/* Institutional Details */}
              <div className="mt-5 pt-5 border-t border-slate-800/80 space-y-3">
                <div className="flex items-start justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    Institution:
                  </span>
                  <span className="font-semibold text-slate-200 text-right max-w-[200px]">
                    {collegeName || 'Accredited Campus'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    Role Designation:
                  </span>
                  <span className="font-semibold text-slate-200 capitalize">
                    {user?.role || 'Student'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Account Standing:
                  </span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    Good Standing
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Academic Session:
                  </span>
                  <span className="font-semibold text-slate-200">
                    2025 – 2026
                  </span>
                </div>
              </div>

              {/* ID Footer Note */}
              <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>Digital collegiate identity verified by CollegeSphere platform services.</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-surface-900 border border-slate-800 rounded-2xl flex flex-col justify-between shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-semibold">{s.label}</span>
                    {s.icon && <s.icon className="w-4 h-4 text-brand-400" />}
                  </div>
                  <span className="text-2xl font-extrabold text-white tabular-nums tracking-tight">
                    {s.value}
                  </span>
                  {s.subtext && (
                    <span className="text-[10px] text-slate-500 mt-1">{s.subtext}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Security, Password & Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Display Name */}
          <div className="bg-surface-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Full Legal Name</h3>
                  <p className="text-xs text-slate-400">Displayed on event rosters and completion certificates.</p>
                </div>
              </div>
            </div>

            {nameFeedback.message && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  nameFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {nameFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{nameFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Prof. Alex Mercer"
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingName || name.trim() === user?.name}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2"
                >
                  {savingName && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Save Name</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Security & Password Update */}
          <div className="bg-surface-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Security & Password</h3>
                <p className="text-xs text-slate-400">Safeguard institutional access with a strong credential.</p>
              </div>
            </div>

            {passwordFeedback.message && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Password must contain at least 6 characters.
                </span>
                <button
                  type="submit"
                  disabled={savingPassword || !currentPassword || !newPassword}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2"
                >
                  {savingPassword && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

