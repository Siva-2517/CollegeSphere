import React, { useState, useEffect } from 'react';
import { X as CloseIcon, User, Lock, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Shared modal component for editing user profile (name) and updating password.
 * Preserves the exact onSave(payload, 'profile' | 'password') contract.
 */
export default function ProfileEditModal({ isOpen, onClose, user, onSave }) {
  const [formData, setFormData] = useState({ name: '', currentPassword: '', newPassword: '' });
  const [activeSection, setActiveSection] = useState('profile'); // 'profile' | 'password'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', currentPassword: '', newPassword: '' });
    }
    setError('');
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (activeSection === 'profile') {
        if (!formData.name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        await onSave({ name: formData.name.trim() }, 'profile');
      } else {
        if (!formData.currentPassword || !formData.newPassword) {
          setError('Both current and new password are required');
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          setError('New password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await onSave({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }, 'password');
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      }
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div
        className="bg-surface-900 border border-slate-700/80 rounded-2xl max-w-md w-full shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-surface-800/60">
          <h3 id="profile-modal-title" className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-brand-500" />
            Account Settings
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-800 bg-surface-950/40 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => { setActiveSection('profile'); setError(''); }}
            className={`pb-2.5 px-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
              activeSection === 'profile'
                ? 'border-brand-600 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            General Profile
          </button>
          <button
            type="button"
            onClick={() => { setActiveSection('password'); setError(''); }}
            className={`pb-2.5 px-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
              activeSection === 'password'
                ? 'border-brand-600 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Update Password
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeSection === 'profile' ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-white text-sm"
                placeholder="Your full name"
                required
              />
              <p className="mt-1.5 text-xs text-slate-400">
                This name is displayed on your registrations, certificates, and event rosters.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-white text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  New Password (Min. 6 chars)
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-white text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

