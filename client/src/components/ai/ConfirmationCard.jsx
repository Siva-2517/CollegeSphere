import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Calendar, MapPin, Tag } from 'lucide-react';

const ConfirmationCard = ({ pendingAction, onConfirm, onCancel, isLoading }) => {
  if (!pendingAction) return null;

  const { actionType, summary, payload } = pendingAction;

  return (
    <div className="my-3 p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 backdrop-blur-md shadow-lg transition-all animate-fade-in">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-amber-200 text-sm">Action Confirmation Required</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{summary}</p>
        </div>
      </div>

      {payload && (
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 mb-3 space-y-1.5 text-xs">
          {payload.eventTitle && (
            <div className="text-slate-200 font-medium flex items-center gap-1.5">
              <span className="text-amber-400">Event:</span> {payload.eventTitle}
            </div>
          )}
          {payload.date && (
            <div className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Date: {new Date(payload.date).toLocaleDateString()}
            </div>
          )}
          {payload.venue && (
            <div className="text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" /> Venue: {payload.venue}
            </div>
          )}
          {payload.organizerName && (
            <div className="text-slate-400">
              Organizer: <span className="text-slate-300">{payload.organizerName}</span>
            </div>
          )}
          {payload.teamName && (
            <div className="text-slate-400">
              Team: <span className="text-amber-300 font-medium">{payload.teamName}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onConfirm(pendingAction)}
          disabled={isLoading}
          className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {isLoading ? 'Processing...' : 'Confirm Action'}
        </button>

        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 border border-slate-700 disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ConfirmationCard;
