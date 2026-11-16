import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

/**
 * Shared confirmation dialog for destructive or administrative actions.
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'approve',
  confirmText,
  isLoading = false
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPositive = type === 'approve';
  const buttonLabel = confirmText || (isPositive ? 'Confirm Approval' : type === 'delete' ? 'Delete' : 'Confirm Rejection');

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="bg-surface-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-modal animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
            isPositive
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          }`}
        >
          {isPositive ? (
            <CheckCircle className="w-6 h-6" />
          ) : type === 'delete' ? (
            <AlertTriangle className="w-6 h-6" />
          ) : (
            <XCircle className="w-6 h-6" />
          )}
        </div>

        <h3 id="confirm-modal-title" className="text-xl font-bold text-center text-white mb-2">
          {title}
        </h3>
        <p className="text-slate-300 text-sm text-center mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-xl shadow transition-all cursor-pointer disabled:opacity-50 ${
              isPositive
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isLoading ? 'Processing...' : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

