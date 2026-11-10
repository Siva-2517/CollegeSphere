import React, { useEffect } from 'react';
import { X as CloseIcon } from 'lucide-react';

/**
 * Shared modal component for previewing event posters.
 * Replaces duplicated implementations across Student, Organizer, and Admin dashboards.
 */
export default function PosterPreviewModal({ isOpen, onClose, posterUrl, title = 'Event Poster' }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="poster-modal-title"
    >
      <div
        className="relative max-w-4xl max-h-[92vh] w-full bg-surface-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-modal animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-surface-800/60">
          <h3 id="poster-modal-title" className="text-lg sm:text-xl font-bold text-white truncate pr-4">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            aria-label="Close poster preview"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center justify-center bg-slate-950/90 p-2 sm:p-4 min-h-[300px]">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md"
            />
          ) : (
            <div className="text-slate-400 py-16 text-center text-sm">
              No poster image available for this event.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
