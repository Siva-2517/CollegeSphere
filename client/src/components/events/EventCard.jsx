import React from 'react';
import { Calendar, MapPin, Users, Clock, Image, CheckCircle, ArrowRight } from 'lucide-react';
import { formatCalendarDate, formatDate } from '../../utils/formatDate';

export default function EventCard({
  event,
  onRegister,
  onPreviewPoster,
  isRegistered = false,
  isProcessing = false
}) {
  const eventDateObj = formatCalendarDate(event.date);
  const now = new Date();
  const deadline = new Date(event.deadline || event.registrationDeadline);
  const isPastDeadline = deadline < now;

  const eventTitle = event.title || event.name || 'Untitled Event';
  const collegeTitle = event.collegeName || event.collegeId?.name || 'Accredited University';
  const isTeam = event.eventType === 'team';

  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-surface-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 hover:shadow-ticket transition-all flex flex-col justify-between group">
      <div className="p-5">
        {/* Pass Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center min-w-[56px] shadow-sm">
            <span className="text-[10px] font-bold text-brand-400 tracking-wider">
              {eventDateObj.month}
            </span>
            <span className="text-xl font-extrabold text-white leading-none mt-0.5 tabular-nums">
              {eventDateObj.day}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-surface-800 text-slate-300 border border-slate-700/60">
              {event.category || 'General'}
            </span>

            {isRegistered ? (
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-brand-500/15 text-brand-300 border border-brand-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-brand-400" />
                Registered
              </span>
            ) : isPastDeadline ? (
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Closed
              </span>
            ) : (
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Open
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white mb-2 line-clamp-2 leading-snug group-hover:text-brand-300 transition-colors">
          {eventTitle}
        </h3>

        {/* Metadata List */}
        <div className="space-y-1.5 text-xs text-slate-400 mb-4">
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-500">🏛️</span>
            <span className="truncate font-medium">{collegeTitle}</span>
          </div>

          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="truncate">{event.venue || 'Campus Venue'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="capitalize">
              {isTeam
                ? `Team (${event.minTeamSize || 2}–${event.maxTeamSize || 5} members)`
                : 'Individual Entry (Solo)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className={diffDays <= 2 && diffDays > 0 ? 'text-amber-400 font-semibold' : ''}>
              Deadline: {formatDate(event.deadline || event.registrationDeadline)}
              {diffDays > 0 && diffDays <= 3 && ` (${diffDays}d left)`}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 pt-0 border-t border-slate-800/60 mt-auto flex items-center gap-2">
        {event.poster && (
          <button
            type="button"
            onClick={() => onPreviewPoster(event.poster, eventTitle)}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
            title="View Event Poster"
            aria-label="View Event Poster"
          >
            <Image className="w-4 h-4" />
          </button>
        )}

        {isRegistered ? (
          <div className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs text-center bg-brand-500/10 border border-brand-500/20 text-brand-300">
            Participation Confirmed
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onRegister(event._id)}
            disabled={isPastDeadline || isProcessing}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isPastDeadline
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm disabled:opacity-50'
            }`}
          >
            {isProcessing ? (
              <span>Registering...</span>
            ) : isPastDeadline ? (
              <span>Deadline Passed</span>
            ) : isTeam ? (
              <>
                <span>Register Team</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <span>Register Solo</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
