import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Calendar, MapPin, Tag } from 'lucide-react';

export default function ConfirmationCard({ pendingAction, onConfirm, onCancel, isLoading }) {
  if (!pendingAction) return null;

  const { actionType, summary, payload } = pendingAction;

  return (
    <div className="my-2.5 p-3.5 rounded-xl border border-amber-500/40 bg-surface-900 shadow-md">
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-amber-300 text-xs">Action Confirmation Required</h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{summary}</p>
        </div>
      </div>

      {payload && (
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 mb-3 space-y-1 text-[11px]">
          {payload.eventTitle && (
            <div className="text-white font-semibold">
              <span className="text-slate-400 font-normal">Event:</span> {payload.eventTitle}
            </div>
          )}
          {payload.date && (
            <div className="text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-500" /> Date: {new Date(payload.date).toLocaleDateString()}
            </div>
          )}
          {payload.venue && (
            <div className="text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-500" /> Venue: {payload.venue}
            </div>
          )}
          {payload.teamName && (
            <div className="text-slate-300">
              Team: <strong className="text-amber-300">{payload.teamName}</strong>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onConfirm(pendingAction)}
          disabled={isLoading}
          className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{isLoading ? 'Processing...' : 'Confirm Action'}</span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 border border-slate-700 disabled:opacity-50 cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
}
