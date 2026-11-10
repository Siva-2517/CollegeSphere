import React, { useState, useEffect } from 'react';
import { X as CloseIcon, Users, Plus, Trash2, AlertCircle } from 'lucide-react';

/**
 * Shared modal component for team registrations.
 * Preserves the exact dynamic participant roster logic and validations.
 */
export default function TeamRegistrationModal({ isOpen, onClose, event, onRegister }) {
  const [teamName, setTeamName] = useState('');
  const [participants, setParticipants] = useState([{ name: '', email: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && event) {
      const minSize = event.minTeamSize || 2;
      const initialParticipants = Array.from({ length: minSize }, () => ({ name: '', email: '' }));
      setParticipants(initialParticipants);
      setTeamName('');
      setError('');
    }
  }, [isOpen, event]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const addParticipant = () => {
    const maxSize = event?.maxTeamSize || 50;
    if (participants.length < maxSize) {
      setParticipants([...participants, { name: '', email: '' }]);
    }
  };

  const removeParticipant = (index) => {
    const minSize = event?.minTeamSize || 2;
    if (participants.length > minSize) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index, field, value) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const validateForm = () => {
    if (!teamName.trim()) {
      setError('Team name is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 0; i < participants.length; i++) {
      if (!participants[i].name.trim()) {
        setError(`Participant ${i + 1} name is required`);
        return false;
      }
      if (!participants[i].email.trim()) {
        setError(`Participant ${i + 1} email is required`);
        return false;
      }
      if (!emailRegex.test(participants[i].email)) {
        setError(`Participant ${i + 1} has an invalid email format`);
        return false;
      }
    }

    const minSize = event?.minTeamSize;
    const maxSize = event?.maxTeamSize;

    if (minSize && participants.length < minSize) {
      setError(`Team must have at least ${minSize} members`);
      return false;
    }

    if (maxSize && participants.length > maxSize) {
      setError(`Team cannot exceed ${maxSize} members`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onRegister(event._id, { teamName: teamName.trim(), participants });
      onClose();
    } catch (err) {
      setError(err.message || 'Team registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !event) return null;

  const teamSizeInfo =
    event.minTeamSize && event.maxTeamSize && event.minTeamSize === event.maxTeamSize
      ? `${event.minTeamSize} members required`
      : event.minTeamSize && event.maxTeamSize
      ? `${event.minTeamSize} to ${event.maxTeamSize} members`
      : event.minTeamSize
      ? `Min. ${event.minTeamSize} members`
      : event.maxTeamSize
      ? `Max. ${event.maxTeamSize} members`
      : 'Team registration';

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-reg-modal-title"
    >
      <div
        className="bg-surface-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-modal animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface-900 border-b border-slate-800 p-5 flex items-center justify-between z-10">
          <div>
            <h2 id="team-reg-modal-title" className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-500" />
              Team Registration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{event.title || event.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-3.5 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs text-brand-300 flex items-center justify-between">
            <span className="font-semibold">Required Team Roster:</span>
            <span className="font-bold tabular-nums text-white">{teamSizeInfo}</span>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Team / Squad Name *
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
              placeholder="e.g., CyberKnights"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Team Members ({participants.length})
              </label>
              {(!event.maxTeamSize || participants.length < event.maxTeamSize) && (
                <button
                  type="button"
                  onClick={addParticipant}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Member
                </button>
              )}
            </div>

            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div
                  key={index}
                  className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {index === 0 ? 'Member 1 (Team Lead)' : `Member ${index + 1}`}
                    </span>
                    {participants.length > (event.minTeamSize || 2) && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(index)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                        aria-label={`Remove Member ${index + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={participant.name}
                      onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 bg-surface-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
                      required
                    />
                    <input
                      type="email"
                      value={participant.email}
                      onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                      placeholder="College Email Address"
                      className="w-full px-3 py-2 bg-surface-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting Roster...' : 'Submit Team Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
